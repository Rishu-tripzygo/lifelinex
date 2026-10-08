import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { appSecret, ORDER_COOKIE } from "@/lib/config";

// The customer's proof of access to an order: "<orderId>.<HMAC>". Unlike a bare order id,
// it can't be forged by setting a cookie by hand, so it gates personal details and booking.

function sign(orderId: string) {
  return crypto.createHmac("sha256", appSecret()).update(`order:${orderId}`).digest("base64url");
}

export function orderAccessToken(orderId: string) {
  return `${orderId}.${sign(orderId)}`;
}

export function verifyOrderAccessToken(token: string | undefined, orderId: string) {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1 || token.slice(0, dot) !== orderId) return false;
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(orderId));
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

export async function hasOrderAccess(orderId: string) {
  return verifyOrderAccessToken((await cookies()).get(ORDER_COOKIE)?.value, orderId);
}

export const orderCookieOptions = (secure: boolean) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure,
  path: "/",
  maxAge: 60 * 60 * 24 * 60,
});
