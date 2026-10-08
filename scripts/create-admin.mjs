// Creates (or resets the password of) a LifelineX admin account.
//
//   npm run admin:create -- you@example.com "Your Name" [ADMIN|STAFF]
//
// The password comes from ADMIN_PASSWORD if set; otherwise a strong one is generated and
// printed once. Uses the same scrypt format as lib/admin/auth.ts.
import crypto from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const scrypt = promisify(crypto.scrypt);
const [email, name, roleArg] = process.argv.slice(2);
const role = (roleArg ?? "ADMIN").toUpperCase();

if (!email || !email.includes("@") || !name || !["ADMIN", "STAFF"].includes(role)) {
  console.error('Usage: npm run admin:create -- email@example.com "Full Name" [ADMIN|STAFF]');
  process.exit(1);
}

const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(15).toString("base64url");
if (password.length < 12) {
  console.error("ADMIN_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const key = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
const passwordHash = `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;

const prisma = new PrismaClient();
try {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.adminUser.upsert({
    where: { email: normalized },
    update: { passwordHash, name, role, active: true },
    create: { email: normalized, name, role, passwordHash },
  });
  // A password reset signs the account out everywhere.
  await prisma.adminSession.deleteMany({ where: { userId: user.id } });
  console.log(`Admin ready: ${user.email} (${user.role})`);
  if (!process.env.ADMIN_PASSWORD) console.log(`Password (shown once): ${password}`);
} finally {
  await prisma.$disconnect();
}
