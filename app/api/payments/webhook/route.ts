import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/cashfree";
import { markOrderPaid, markOrderUnpaid, ORDER_ID_PATTERN } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

type WebhookPayload = {
  type?: string;
  data?: {
    order?: { order_id?: string; order_amount?: number | string };
    payment?: { cf_payment_id?: string | number; payment_status?: string; payment_amount?: number | string };
  };
};

function outcome(payload: WebhookPayload): "PAID" | "FAILED" | null {
  const type = payload.type ?? "";
  const paymentStatus = payload.data?.payment?.payment_status ?? "";
  if (type === "PAYMENT_SUCCESS_WEBHOOK" || paymentStatus === "SUCCESS") return "PAID";
  if (type === "PAYMENT_FAILED_WEBHOOK" || paymentStatus === "FAILED") return "FAILED";
  if (type === "PAYMENT_USER_DROPPED_WEBHOOK" || paymentStatus === "USER_DROPPED") return "FAILED";
  return null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (rawBody.length > 64 * 1024) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const timestamp = request.headers.get("x-webhook-timestamp") ?? "";

  if (!verifyWebhookSignature(rawBody, signature, timestamp)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const orderId = payload.data?.order?.order_id;
  const status = outcome(payload);
  if (!orderId || !ORDER_ID_PATTERN.test(orderId) || !status) {
    return NextResponse.json({ ok: true });
  }

  try {
    const existing = await prisma.paymentOrder.findUnique({ where: { cashfreeOrderId: orderId } });
    if (!existing || existing.status === "PAID") return NextResponse.json({ ok: true });

    if (status === "PAID") {
      const amount = Number(payload.data?.payment?.payment_amount ?? payload.data?.order?.order_amount);
      const cfPaymentId = payload.data?.payment?.cf_payment_id;
      await markOrderPaid(existing, amount, cfPaymentId === undefined ? null : String(cfPaymentId));
    } else {
      // A failed attempt doesn't close the order: the customer may retry and a later
      // success webhook still upgrades it to PAID.
      await markOrderUnpaid(existing, "FAILED");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    // 500 makes Cashfree retry the webhook later.
    console.error("[webhook] processing failed", error);
    return NextResponse.json({ error: "Could not process webhook." }, { status: 500 });
  }
}
