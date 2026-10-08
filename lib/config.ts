// Server-only settings read from the environment. Never import this from a client component.
import "server-only";
import crypto from "node:crypto";

export class ConfigError extends Error {}

const isProduction = process.env.NODE_ENV === "production";

export function consultationFeeInr() {
  const amount = Number(process.env.CONSULTATION_FEE_INR ?? "999");
  if (!Number.isInteger(amount) || amount < 1 || amount > 500000) return 999;
  return amount;
}

// The public origin Cashfree returns customers to. Production must set an https URL;
// falling back to localhost there would send paying customers to a dead page.
export function appUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (isProduction && (!raw || !raw.startsWith("https://"))) {
    throw new ConfigError("NEXT_PUBLIC_APP_URL must be set to the site's https origin in production.");
  }
  return (raw || "http://localhost:3000").replace(/\/$/, "");
}

export const isSecureSite = () => appUrl().startsWith("https://");

// Signs customer access cookies. Required in production; in development a per-process
// random secret is used, so customer cookies reset when the dev server restarts.
let devSecret: string | undefined;
export function appSecret() {
  const secret = process.env.APP_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;
  if (isProduction) throw new ConfigError("APP_SECRET must be set (32+ random characters) in production.");
  devSecret ??= crypto.randomBytes(32).toString("hex");
  return devSecret;
}

// Optional: a Slack-compatible incoming webhook told about paid orders and bookings.
export function orderNotifyUrl() {
  const url = process.env.ORDER_NOTIFY_WEBHOOK_URL?.trim();
  return url && url.startsWith("https://") ? url : null;
}

// httpOnly cookie proving this browser may see and manage an order (see lib/access.ts).
export const ORDER_COOKIE = "llx_order";
export const ADMIN_COOKIE = "llx_admin";
