import type { PaymentOrder, PaymentStatus } from "@prisma/client";
import { fetchCashfreeOrder, fetchCashfreeOrderPayments } from "@/lib/cashfree";
import { formatInr } from "@/lib/lead";
import { notifyTeam } from "@/lib/notify";
import { prisma } from "@/lib/prisma";

export const ORDER_ID_PATTERN = /^llx_[a-z0-9]{6,12}_[a-f0-9]{8}$/;

// Attempt statuses that mean the customer is done with this order without paying.
const GAVE_UP = new Set(["FAILED", "USER_DROPPED", "CANCELLED", "VOID"]);
const SYNC_INTERVAL_MS = 5000;
const lastSync = new Map<string, number>();

// Moves an order to PAID exactly once, after checking the amount, and announces it.
// Both the webhook and the return page call this, so it must be safe to race.
export async function markOrderPaid(order: PaymentOrder, paidAmount: number, cfPaymentId?: string | null) {
  if (Number.isFinite(paidAmount) && paidAmount !== order.amount) {
    console.error(`[payments] amount mismatch on ${order.cashfreeOrderId}: expected ${order.amount}, got ${paidAmount}`);
    return order;
  }
  const result = await prisma.paymentOrder.updateMany({
    where: { id: order.id, status: { not: "PAID" } },
    data: { status: "PAID", ...(cfPaymentId ? { cfPaymentId } : {}) },
  });
  const updated = await prisma.paymentOrder.findUniqueOrThrow({ where: { id: order.id } });
  if (result.count === 1) void notifyPaid(updated);
  return updated;
}

export async function markOrderUnpaid(order: PaymentOrder, status: Exclude<PaymentStatus, "PAID" | "CREATED">) {
  if (order.status === status) return order;
  const result = await prisma.paymentOrder.updateMany({
    where: { id: order.id, status: { not: "PAID" } },
    data: { status },
  });
  return result.count ? prisma.paymentOrder.findUniqueOrThrow({ where: { id: order.id } }) : order;
}

// Brings our copy of an order up to date with Cashfree. Used by the return page, which
// can't rely on webhooks (they are only sent to https sites and may arrive late).
export async function syncPaymentOrder(cashfreeOrderId: string) {
  if (!ORDER_ID_PATTERN.test(cashfreeOrderId)) return null;
  const order = await prisma.paymentOrder.findUnique({ where: { cashfreeOrderId } });
  if (!order || order.status === "PAID") return order;

  // Throttle: a refreshing page shouldn't turn into a stream of Cashfree API calls.
  const now = Date.now();
  if (now - (lastSync.get(order.id) ?? 0) < SYNC_INTERVAL_MS) return order;
  lastSync.set(order.id, now);
  if (lastSync.size > 5000) lastSync.clear();

  try {
    const remote = await fetchCashfreeOrder(cashfreeOrderId);
    if (remote.orderStatus === "PAID") return markOrderPaid(order, remote.orderAmount);
    if (remote.orderStatus === "EXPIRED") return markOrderUnpaid(order, "EXPIRED");
    if (remote.orderStatus === "TERMINATED" || remote.orderStatus === "TERMINATION_REQUESTED") {
      return markOrderUnpaid(order, "FAILED");
    }

    // ACTIVE: look at the attempts. Any success wins; otherwise only call it failed when
    // there were attempts and every one of them ended without payment.
    const payments = await fetchCashfreeOrderPayments(cashfreeOrderId);
    const success = payments.find((p) => p.status === "SUCCESS");
    if (success) return markOrderPaid(order, remote.orderAmount, success.cfPaymentId);
    if (payments.length > 0 && payments.every((p) => GAVE_UP.has(p.status))) {
      return markOrderUnpaid(order, "FAILED");
    }
    return order;
  } catch (error) {
    console.error(`[payments] sync failed for ${cashfreeOrderId}`, error);
    return order;
  }
}

async function notifyPaid(order: PaymentOrder) {
  await notifyTeam(
    `New paid consultation: ${formatInr(order.amount)} from ${order.customerName} (+91 ${order.customerPhone}). Order ${order.cashfreeOrderId}. Waiting for them to pick a slot.`,
  );
}
