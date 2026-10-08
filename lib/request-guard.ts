import { NextResponse } from "next/server";

const MAX_BODY_BYTES = 16 * 1024;

// In-memory fixed-window limiter, keyed by route + client IP. It protects a single server
// process; behind several instances, swap it for a shared store (e.g. Redis/Upstash).
const buckets = new Map<string, { count: number; resetAt: number }>();

// Prefer x-real-ip (set by Vercel / nginx), then the LAST x-forwarded-for hop, which our own
// proxy appended. The first hop is whatever the client claimed, so it can't key a limit.
function clientIp(request: Request) {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const hops = request.headers.get("x-forwarded-for")?.split(",").map((h) => h.trim()).filter(Boolean);
  return hops?.length ? hops[hops.length - 1] : "unknown";
}

function rateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

// Reads a small JSON object from a same-site POST, or returns the response to send instead.
// Requiring application/json also blocks cross-site form posts, which can only send
// form-encoded or text/plain bodies without a CORS preflight.
export async function readGuardedJson(
  request: Request,
  opts: { route: string; limit: number; windowMs: number },
): Promise<{ body: Record<string, unknown> } | { response: NextResponse }> {
  if (rateLimited(`${opts.route}:${clientIp(request)}`, opts.limit, opts.windowMs)) {
    return { response: jsonError("Too many attempts. Please wait a few minutes and try again.", 429) };
  }

  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) {
    return { response: jsonError("Send the request as JSON.", 415) };
  }

  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) return { response: jsonError("Request is too large.", 413) };

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return { response: jsonError("Request is too large.", 413) };

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { response: jsonError("Send the request as JSON.", 400) };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { response: jsonError("Send the request as JSON.", 400) };
  }

  const record = body as Record<string, unknown>;
  // Honeypot: a hidden field real visitors never fill. Pretend success so bots learn nothing.
  if (typeof record.website === "string" && record.website.length > 0) {
    return { response: NextResponse.json({ ok: true }, { status: 202 }) };
  }
  return { body: record };
}
