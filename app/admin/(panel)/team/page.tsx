import { createAdminUserAction, resetAdminPasswordAction, toggleAdminUserAction } from "@/app/admin/actions";
import { AdminForm, ConfirmButton } from "@/components/admin/admin-form";
import { PageHead } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const me = await requireAdmin("ADMIN");
  const users = await prisma.adminUser.findMany({ orderBy: [{ active: "desc" }, { createdAt: "asc" }] });

  return (
    <>
      <PageHead title="Team" sub="Staff manage bookings, payments and assessments. Administrators also manage the schedule, doctors and team." />
      <section className="apanel">
        <h2>Add someone</h2>
        <AdminForm action={createAdminUserAction} submitLabel="Create account" className="aform--inline" resetOnSuccess>
          <label className="afield">
            <span>Name</span>
            <input name="name" required />
          </label>
          <label className="afield">
            <span>Email</span>
            <input name="email" type="email" required />
          </label>
          <label className="afield">
            <span>Role</span>
            <select name="role" defaultValue="STAFF">
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </label>
        </AdminForm>
        <p className="small">A strong password is generated and shown once. They can change it under their account.</p>
      </section>

      <div className="atable-wrap">
        <table className="atable">
          <thead>
            <tr>
              <th>Person</th>
              <th>Role</th>
              <th>Last sign-in</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.active ? undefined : "is-off"}>
                <td>
                  {u.name} {u.id === me.id && <span className="small">(you)</span>}
                  <span className="sub">{u.email}</span>
                </td>
                <td>{u.role === "ADMIN" ? "Administrator" : "Staff"}{u.active ? "" : " · deactivated"}</td>
                <td>{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : <span className="muted">Never</span>}</td>
                <td>
                  {u.id !== me.id && (
                    <div className="arow-actions">
                      <details className="inline-book">
                        <summary>Reset password</summary>
                        <AdminForm action={resetAdminPasswordAction} submitLabel="Generate new password" submitVariant="ghost">
                          <input type="hidden" name="id" value={u.id} />
                          <p className="small">Signs them out everywhere.</p>
                        </AdminForm>
                      </details>
                      <ConfirmButton
                        action={toggleAdminUserAction}
                        name="id"
                        value={u.id}
                        label={u.active ? "Deactivate" : "Reactivate"}
                        confirm={u.active ? `Deactivate ${u.email}? They'll be signed out immediately.` : `Reactivate ${u.email}?`}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
