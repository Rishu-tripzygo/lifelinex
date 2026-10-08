import { changePasswordAction } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/admin-form";
import { PageHead } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const admin = await requireAdmin();
  return (
    <>
      <PageHead title="Your account" sub={`${admin.email} · ${admin.role === "ADMIN" ? "Administrator" : "Staff"}`} />
      <section className="apanel" style={{ maxWidth: 520 }}>
        <h2>Change password</h2>
        <AdminForm action={changePasswordAction} submitLabel="Update password" resetOnSuccess>
          <label className="afield">
            <span>Current password</span>
            <input name="current" type="password" autoComplete="current-password" required />
          </label>
          <label className="afield">
            <span>New password</span>
            <input name="next" type="password" autoComplete="new-password" minLength={12} required />
            <small>At least 12 characters. A short phrase is easier to remember.</small>
          </label>
          <label className="afield">
            <span>Confirm new password</span>
            <input name="confirm" type="password" autoComplete="new-password" minLength={12} required />
          </label>
        </AdminForm>
      </section>
    </>
  );
}
