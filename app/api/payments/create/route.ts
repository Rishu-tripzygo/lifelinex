import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cashfreeMode, createCashfreeOrder } from "@/lib/cashfree";
import { orderAccessToken, orderCookieOptions } from "@/lib/access";
import { appUrl, ConfigError, consultationFeeInr, ORDER_COOKIE } from "@/lib/config";
import { cleanName, isValidName, normalizePhone } from "@/lib/lead";
import { prisma } from "@/lib/prisma";
import { jsonError, readGuardedJson } from "@/lib/request-guard";

const ORDER_TTL_MS = 30 * 60 * 1000;
const CUID = /^c[a-z0-9]{20,32}$/;

export async function POST(request: Request) {
  const read = await readGuardedJson(request, { route: "payments", limit: 6, windowMs: 10 * 60 * 1000 });
  if ("response" in read) return read.response;
  const payload = read.body;

  const name = typeof payload.name === "string" ? cleanName(payload.name) : "";
  const phone = typeof payload.phone === "string" ? normalizePhone(payload.phone) : null;
  if (!isValidName(name) || !phone) {
    return jsonError("Enter your name and a valid 10-digit mobile number.", 400);
  }

  let site: string;
  try {
    site = appUrl();
  } catch (error) {
    console.error("[payments] misconfigured", error);
    return jsonError("Checkout is temporarily unavailable. Please try again shortly.", 503);
  }

  try {
    // Only link an assessment that belongs to this phone number; anything else is dropped.
    let assessmentId: string | undefined;
    if (typeof payload.assessmentId === "string" && CUID.test(payload.assessmentId)) {
      const assessment = await prisma.assessment.findUnique({ where: { id: payload.assessmentId } });
      if (assessment && assessment.phone === phone) assessmentId = assessment.id;
    }

    const amount = consultationFeeInr();
    const cashfreeOrderId = `llx_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
    const order = await prisma.paymentOrder.create({
      data: { cashfreeOrderId, amount, customerName: name, customerPhone: phone, assessmentId },
    });

    try {
      const session = await createCashfreeOrder({
        orderId: cashfreeOrderId,
        amount,
        name,
        phone,
        customerId: `cust_${phone}`,
        returnUrl: `${site}/payment/return?order_id={order_id}`,
        notifyUrl: site.startsWith("https://") ? `${site}/api/payments/webhook` : undefined,
        assessmentId,
        expiresAt: new Date(Date.now() + ORDER_TTL_MS),
      });

      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: { paymentSessionId: session.paymentSessionId },
      });

      const response = NextResponse.json({
        orderId: cashfreeOrderId,
        paymentSessionId: session.paymentSessionId,
        mode: cashfreeMode(),
      });
      // Signed proof that this browser owns the order (lib/access.ts). SameSite=Lax still
      // sends it on Cashfree's top-level redirect back to us.
      response.cookies.set(ORDER_COOKIE, orderAccessToken(cashfreeOrderId), orderCookieOptions(site.startsWith("https://")));
      return response;
    } catch (error) {
      console.error(`[payments] Cashfree order ${cashfreeOrderId} failed`, error);
      await prisma.paymentOrder.update({ where: { id: order.id }, data: { status: "FAILED" } });
      return jsonError("We couldn't open checkout. Please try again in a moment.", 502);
    }
  } catch (error) {
    if (error instanceof ConfigError) console.error("[payments] misconfigured", error);
    else console.error("[payments] create failed", error);
    return jsonError("We couldn't start checkout right now. Please try again shortly.", 503);
  }
}
