import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · LifelineX admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Pages and actions each check again; this only decides what the shell shows.
  const admin = await requireAdmin();
  return (
    <div className="admin">
      <aside className="anav">
        <Link href="/admin" className="anav__brand" aria-label="LifelineX admin home">
          <img src="/assets/logo-horizontal.svg" alt="LifelineX" width={115} height={22} />
          <span>Admin</span>
        </Link>
        <AdminNav isAdmin={admin.role === "ADMIN"} />
        <div className="anav__me">
          <Link href="/admin/account">
            <strong>{admin.name}</strong>
            <span>{admin.role === "ADMIN" ? "Administrator" : "Staff"}</span>
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn btn--ghost btn--xs">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="amain" id="main">
        {children}
      </main>
    </div>
  );
}
