import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="status-page admin-login">
      <main id="main">
        <div className="status">
          <img src="/assets/logo-horizontal.svg" alt="LifelineX" width={125} height={24} />
          <h1>Admin sign in</h1>
          <p className="small" style={{ fontSize: 15 }}>For LifelineX staff. Accounts are created by an administrator.</p>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
