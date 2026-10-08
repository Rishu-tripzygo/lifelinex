import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Empty, one, PAGE_SIZE, PageHead, Pager, pageFrom } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { labelFor } from "@/lib/assessment-questions";
import { digitsOnly } from "@/lib/lead";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Assessments" };

export default async function AssessmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q)?.trim() ?? "";
  const page = pageFrom(sp.page);

  const where: Prisma.AssessmentWhereInput = {};
  if (q) {
    const digits = digitsOnly(q);
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      ...(digits.length >= 4 ? [{ phone: { contains: digits.slice(-10) } }] : []),
    ];
  }
  const rows = await prisma.assessment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
    include: { orders: { where: { status: "PAID" }, select: { id: true } } },
  });
  const items = rows.slice(0, PAGE_SIZE);

  return (
    <>
      <PageHead title="Assessments" sub="Completed PCOS assessments. Opening one is recorded in the audit log." />
      <div className="atoolbar">
        <span />
        <form className="asearch" role="search">
          <input name="q" defaultValue={q} placeholder="Search name or phone" aria-label="Search assessments" />
        </form>
      </div>
      {items.length === 0 ? (
        <Empty>No assessments{q ? ` matching “${q}”` : " yet"}.</Empty>
      ) : (
        <div className="atable-wrap">
          <table className="atable">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Name</th>
                <th>Main goal</th>
                <th>Paid</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => {
                const answers = (a.answers ?? {}) as Record<string, unknown>;
                return (
                  <tr key={a.id}>
                    <td className="nowrap">
                      <Link href={`/admin/assessments/${a.id}`} className="arow-link">{formatDateTime(a.createdAt)}</Link>
                    </td>
                    <td>
                      {a.name}
                      <span className="sub">+91 {a.phone}</span>
                    </td>
                    <td>{labelFor(4, typeof answers["4"] === "string" ? answers["4"] : undefined) || "—"}</td>
                    <td>{a.orders.length ? "Yes" : <span className="muted">No</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pager base="/admin/assessments" page={page} hasMore={rows.length > PAGE_SIZE} keep={{ q }} />
    </>
  );
}
