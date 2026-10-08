import "server-only";
import crypto from "node:crypto";
import { promisify } from "node:util";
import type { AdminRole, AdminUser, Prisma } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ADMIN_COOKIE, isSecureSite } from "@/lib/config";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number, opts: crypto.ScryptOptions) => Promise<Buffer>;
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const SESSION_HOURS = 12;

// Format: scrypt$N$r$p$saltB64$hashB64 (also produced by scripts/create-admin.mjs).
export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const key = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return crypto.timingSafeEqual(key, expected);
}

// A dummy hash so unknown emails take as long as wrong passwords (no user enumeration by timing).
const DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64).toString("base64");

export function passwordProblem(password: string) {
  if (password.length < 12) return "Use at least 12 characters.";
  if (password.length > 200) return "That password is too long.";
  return null;
}

const tokenHash = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

// ---------- login throttling (per email and per IP, in memory) ----------
const attempts = new Map<string, { count: number; resetAt: number }>();
function tooManyAttempts(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || a.resetAt <= now) return false;
  return a.count >= 8;
}
function recordFailure(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || a.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
  else a.count += 1;
  if (attempts.size > 5000) attempts.clear();
}

async function requestMeta() {
  const h = await headers();
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";
  return { ip, userAgent: h.get("user-agent")?.slice(0, 300) ?? null };
}

export async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  const { ip, userAgent } = await requestMeta();
  if (tooManyAttempts(`email:${normalized}`) || tooManyAttempts(`ip:${ip}`)) {
    return { ok: false, error: "Too many attempts. Wait 15 minutes and try again." };
  }

  const user = await prisma.adminUser.findUnique({ where: { email: normalized } });
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.active || !valid) {
    recordFailure(`email:${normalized}`);
    recordFailure(`ip:${ip}`);
    await audit(user?.id ?? null, "login.failed", normalized);
    return { ok: false, error: "That email and password don't match an active account." };
  }

  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    prisma.adminSession.create({
      data: { tokenHash: tokenHash(token), userId: user.id, expiresAt: new Date(Date.now() + SESSION_HOURS * 3_600_000), ip, userAgent },
    }),
    prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ]);
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: isSecureSite(),
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  await audit(user.id, "login");
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) await prisma.adminSession.deleteMany({ where: { tokenHash: tokenHash(token) } });
  jar.delete(ADMIN_COOKIE);
}

export type CurrentAdmin = Pick<AdminUser, "id" | "email" | "name" | "role">;

// The signed-in admin for this request, or null. Cached per request.
export const getAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true, active: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
  const { active: _active, ...user } = session.user;
  return user;
});

// Call at the top of every admin page AND every admin action: rendering a page behind a
// check doesn't protect the actions it contains.
export async function requireAdmin(role?: AdminRole): Promise<CurrentAdmin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (role === "ADMIN" && admin.role !== "ADMIN") redirect("/admin?denied=1");
  return admin;
}

export async function audit(adminId: string | null, action: string, target?: string | null, detail?: Prisma.InputJsonValue) {
  try {
    await prisma.auditLog.create({ data: { adminId, action, target: target ?? null, detail } });
  } catch (error) {
    console.error("[audit] write failed", error);
  }
}
