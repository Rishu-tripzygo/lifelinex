import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { orderAccessToken, orderCookieOptions } from "@/lib/access";
import { isSecureSite, ORDER_COOKIE } from "@/lib/config";
import { normalizePhone } from "@/lib/lead";
import { ORDER_ID_PATTERN } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { jsonError, readGuardedJson } from "@/lib/request-guard";

// Lets a customer open their booking on another device by confirming the phone number used
// at checkout. Tightly rate limited: the order id plus 10 digits is the only secret here.
export async function POST(request: Request) {
  const read = await readGuardedJson(request, { route: "verify", limit: 5, windowMs: 15 * 60 * 1000 });
  if ("response" in read) return read.response;
  const { orderId, phone } = read.body;

  const normalized = typeof phone === "string" ? normalizePhone(phone) : null;
  if (typeof orderId !== "string" || !ORDER_ID_PATTERN.test(orderId) || !normalized) {
    return jsonError("Enter the 10-digit mobile number you paid with.", 400);
  }

  try {
    const order = await prisma.paymentOrder.findUnique({ where: { cashfreeOrderId: orderId } });
    const match =
      !!order &&
      order.customerPhone.length === normalized.length &&
      crypto.timingSafeEqual(Buffer.from(order.customerPhone), Buffer.from(normalized));
    if (!match) return jsonError("That number doesn't match this booking.", 403);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ORDER_COOKIE, orderAccessToken(orderId), orderCookieOptions(isSecureSite()));
    return response;
  } catch (error) {
    console.error("[verify] failed", error);
    return jsonError("Something went wrong. Please try again.", 503);
  }
}
