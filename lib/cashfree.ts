import crypto from "node:crypto";

const API_VERSION = "2025-01-01";

export type CashfreeMode = "sandbox" | "production";

export function cashfreeMode(): CashfreeMode {
  return process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
}

function baseUrl() {
  return cashfreeMode() === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function credentials() {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Cashfree is not configured. Add CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET.");
  }
  return { clientId, clientSecret };
}

async function cashfreeFetch(path: string, init?: RequestInit) {
  const { clientId, clientSecret } = credentials();
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-version": API_VERSION,
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Cashfree returned a non-JSON response (HTTP ${response.status}).`);
  }
  if (!response.ok) {
    const message =
      data && typeof data === "object" && typeof (data as Record<string, unknown>).message === "string"
        ? (data as Record<string, string>).message
        : "Cashfree could not complete that request.";
    // Kept for server logs only; routes show customers a generic message.
    throw new Error(`Cashfree HTTP ${response.status}: ${message}`);
  }
  return data;
}

export async function createCashfreeOrder(input: {
  orderId: string;
  amount: number;
  name: string;
  phone: string;
  customerId: string;
  returnUrl: string;
  notifyUrl?: string;
  assessmentId?: string;
  expiresAt: Date;
}) {
  const data = (await cashfreeFetch("/orders", {
    method: "POST",
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: "INR",
      order_note: "LifelineX doctor consultation",
      customer_details: {
        customer_id: input.customerId,
        customer_name: input.name,
        customer_phone: input.phone,
      },
      order_expiry_time: input.expiresAt.toISOString(),
      order_meta: {
        return_url: input.returnUrl,
        ...(input.notifyUrl ? { notify_url: input.notifyUrl } : {}),
      },
      ...(input.assessmentId
        ? { order_tags: { assessment_id: input.assessmentId } }
        : {}),
    }),
  })) as Record<string, unknown>;

  const paymentSessionId = data.payment_session_id;
  if (typeof paymentSessionId !== "string" || !paymentSessionId) {
    throw new Error("Cashfree did not return a payment session.");
  }
  return { paymentSessionId, raw: data };
}

export async function fetchCashfreeOrder(orderId: string) {
  const data = (await cashfreeFetch(`/orders/${encodeURIComponent(orderId)}`)) as Record<string, unknown>;
  const status = data.order_status;
  return {
    orderStatus: typeof status === "string" ? status : "UNKNOWN",
    orderAmount: typeof data.order_amount === "number" ? data.order_amount : Number(data.order_amount),
    raw: data,
  };
}

// Payment attempts on an order. An order stays ACTIVE after a failed or abandoned attempt,
// so this is how we tell "still paying" from "gave up".
export async function fetchCashfreeOrderPayments(orderId: string) {
  const data = await cashfreeFetch(`/orders/${encodeURIComponent(orderId)}/payments`);
  if (!Array.isArray(data)) return [];
  return data.map((p: Record<string, unknown>) => ({
    status: typeof p.payment_status === "string" ? p.payment_status : "UNKNOWN",
    cfPaymentId: p.cf_payment_id === undefined || p.cf_payment_id === null ? null : String(p.cf_payment_id),
  }));
}

export function verifyWebhookSignature(rawBody: string, signature: string, timestamp: string) {
  const secret = process.env.CASHFREE_CLIENT_SECRET;
  if (!secret || !signature || !timestamp) return false;

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() - sentAt) > 15 * 60 * 1000) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(timestamp + rawBody).digest("base64");
  const actual = Buffer.from(signature);
  const computed = Buffer.from(expected);
  if (actual.length !== computed.length) return false;
  return crypto.timingSafeEqual(actual, computed);
}
