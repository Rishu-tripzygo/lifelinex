import type { BookingStatus, Prisma } from "@prisma/client";
import Link from "next/link";
import { Badge, Empty, Filters, one, PAGE_SIZE, PageHead, Pager, pageFrom } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { digitsOnly } from "@/lib/lead";
import { prisma } from "@/lib/prisma";
import { addDaysKey, formatDay, formatTime, istDateKey, istMidnight } from "@/lib/time";

export const metadata = { title: "Bookings" };

const VIEWS: [string, string][] = [
  ["upcoming", "Upcoming"],
  ["today", "Today"],
  ["past", "Past"],
  ["cancelled", "Cancelled"],
  ["all", "All"],
];

export default async function BookingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const view = VIEWS.some(([v]) => v === one(sp.view)) ? one(sp.view)! : "upcoming";
  const q = one(sp.q)?.trim() ?? "";
  const page = pageFrom(sp.page);
  const now = new Date();
  const todayKey = istDateKey(now);

  const where: Prisma.BookingWhereInput = {};
  if (view === "upcoming") Object.assign(where, { startsAt: { gte: now }, status: "CONFIRMED" as BookingStatus });
  if (view === "today") Object.assign(where, { startsAt: { gte: istMidnight(todayKey), lt: istMidnight(addDaysKey(todayKey, 1)) } });
  if (view === "past") Object.assign(where, { startsAt: { lt: now }, status: { not: "CANCELLED" as BookingStatus } });
  if (view === "cancelled") where.status = "CANCELLED";
  if (q) {
    const digits = digitsOnly(q);
    where.OR = [
      { customerName: { contains: q, mode: "insensitive" } },
      ...(digits.length >= 4 ? [{ customerPhone: { contains: digits.slice(-10) } }] : []),
      { order: { cashfreeOrderId: { contains: q } } },
    ];
  }
  const ascending = view === "upcoming" || view === "today";

  const rows = await prisma.booking.findMany({
    where,
    orderBy: { startsAt: ascending ? "asc" : "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
    include: { doctor: { select: { name: true } } },
  });
  const hasMore = rows.length > PAGE_SIZE;
  const bookings = rows.slice(0, PAGE_SIZE);

  return (
    <>
      <PageHead title="Bookings" sub="Every scheduled consultation. Times in IST." />
      <div className="atoolbar">
        <Filters base="/admin/bookings" param="view" value={view} options={VIEWS} keep={{ q }} />
        <form className="asearch" role="search">
          <input type="hidden" name="view" value={view} />
          <input name="q" defaultValue={q} placeholder="Search name, phone or order" aria-label="Search bookings" />
        </form>
      </div>

      {bookings.length === 0 ? (
        <Empty>No bookings here{q ? ` matching “${q}”` : ""}.</Empty>
      ) : (
        <div className="atable-wrap">
          <table className="atable">
            <thead>
              <tr>
                <th>When</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Link</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="nowrap">
                    <Link href={`/admin/bookings/${b.id}`} className="arow-link">
                      <strong>{formatDay(b.startsAt)}</strong> {formatTime(b.startsAt)}
                    </Link>
                  </td>
                  <td>
                    {b.customerName}
                    <span className="sub">+91 {b.customerPhone}</span>
                  </td>
                  <td className={b.doctor ? undefined : "muted"}>{b.doctor?.name ?? "Unassigned"}</td>
                  <td className={b.meetingUrl ? undefined : "muted"}>{b.meetingUrl ? "Set" : "—"}</td>
                  <td><Badge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager base="/admin/bookings" page={page} hasMore={hasMore} keep={{ view, q }} />
    </>
  );
}
