import Link from "next/link";
import { Badge, Empty, PageHead } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { formatInr } from "@/lib/lead";
import { prisma } from "@/lib/prisma";
import { addDaysKey, formatDateTime, formatDay, formatTime, IST_OFFSET_MS, istDateKey, istMidnight } from "@/lib/time";

export const metadata = { title: { absolute: "Overview · LifelineX admin" } };

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const admin = await requireAdmin();
  const { denied } = await searchParams;
  const now = new Date();
  const todayKey = istDateKey(now);
  const todayStart = istMidnight(todayKey);
  const tomorrow = istMidnight(addDaysKey(todayKey, 1));
  const weekEnd = istMidnight(addDaysKey(todayKey, 8));
  const monthStart = istMidnight(`${todayKey.slice(0, 7)}-01`);
  const soon = new Date(now.getTime() + 48 * 3_600_000);
  const hour = new Date(now.getTime() + IST_OFFSET_MS).getUTCHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  const [today, upcomingCount, unbooked, revenue, assessmentsWeek, attention] = await Promise.all([
    prisma.booking.findMany({
      where: { startsAt: { gte: todayStart, lt: tomorrow }, status: { not: "CANCELLED" } },
      orderBy: { startsAt: "asc" },
      include: { doctor: { select: { name: true } } },
    }),
    prisma.booking.count({ where: { status: "CONFIRMED", startsAt: { gte: now, lt: weekEnd } } }),
    prisma.paymentOrder.findMany({ where: { status: "PAID", booking: null }, orderBy: { createdAt: "asc" }, take: 10 }),
    prisma.paymentOrder.aggregate({ where: { status: "PAID", createdAt: { gte: monthStart } }, _sum: { amount: true }, _count: true }),
    prisma.assessment.count({ where: { createdAt: { gte: istMidnight(addDaysKey(todayKey, -6)) } } }),
    prisma.booking.findMany({
      where: { status: "CONFIRMED", startsAt: { gte: now, lt: soon }, OR: [{ doctorId: null }, { meetingUrl: null }] },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  return (
    <>
      <PageHead title={`Good ${greeting}, ${admin.name.split(" ")[0]}`} sub={`${formatDay(now)} · all times IST`} />
      {denied && <p className="alert" role="alert">That page is for administrators only.</p>}

      <dl className="kpis" aria-label="Key numbers">
        <div><dt>Today</dt><dd>{today.length}</dd><span>consultations</span></div>
        <div><dt>Next 7 days</dt><dd>{upcomingCount}</dd><span>confirmed</span></div>
        <div><dt>Paid, not booked</dt><dd className={unbooked.length ? "is-warn" : undefined}>{unbooked.length}</dd><span>need a slot</span></div>
        <div><dt>This month</dt><dd>{formatInr(revenue._sum.amount ?? 0)}</dd><span>{revenue._count} paid orders</span></div>
        <div><dt>Assessments</dt><dd>{assessmentsWeek}</dd><span>last 7 days</span></div>
      </dl>

      <div className="agrid">
        <section className="apanel">
          <h2>Today&apos;s schedule</h2>
          {today.length === 0 ? (
            <Empty>No consultations today.</Empty>
          ) : (
            <ul className="timeline">
              {today.map((b) => (
                <li key={b.id}>
                  <span className="timeline__time">{formatTime(b.startsAt)}</span>
                  <Link href={`/admin/bookings/${b.id}`}>
                    <strong>{b.customerName}</strong>
                    <span>{b.doctor?.name ?? "No doctor assigned"}</span>
                  </Link>
                  <Badge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="apanel">
          <h2>Needs attention</h2>
          {attention.length === 0 && unbooked.length === 0 ? (
            <Empty>All caught up.</Empty>
          ) : (
            <ul className="alist">
              {attention.map((b) => (
                <li key={b.id}>
                  <Link href={`/admin/bookings/${b.id}`}>
                    <strong>{b.customerName}</strong> · {formatDateTime(b.startsAt)}
                  </Link>
                  <span className="small">{[!b.doctorId && "no doctor", !b.meetingUrl && "no meeting link"].filter(Boolean).join(", ")}</span>
                </li>
              ))}
              {unbooked.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders?view=unbooked`}>
                    <strong>{o.customerName}</strong> · paid {formatDateTime(o.createdAt)}
                  </Link>
                  <span className="small">hasn&apos;t picked a slot · +91 {o.customerPhone}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
