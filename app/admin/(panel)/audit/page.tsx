import { Empty, PAGE_SIZE, PageHead, Pager, pageFrom } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Audit log" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("ADMIN");
  const page = pageFrom((await searchParams).page);
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE * 2,
    take: PAGE_SIZE * 2 + 1,
    include: { admin: { select: { name: true, email: true } } },
  });
  const items = rows.slice(0, PAGE_SIZE * 2);

  return (
    <>
      <PageHead title="Audit log" sub="Sign-ins, changes, and every time someone opens patient health answers." />
      {items.length === 0 ? (
        <Empty>Nothing recorded yet.</Empty>
      ) : (
        <div className="atable-wrap">
          <table className="atable">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td className="nowrap">{formatDateTime(r.createdAt)}</td>
                  <td>{r.admin?.name ?? <span className="muted">—</span>}</td>
                  <td className="mono">{r.action}</td>
                  <td className="mono muted">{r.target ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager base="/admin/audit" page={page} hasMore={rows.length > PAGE_SIZE * 2} />
    </>
  );
}
