import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, PageHead } from "@/components/admin/ui";
import { audit, requireAdmin } from "@/lib/admin/auth";
import { describeAnswers } from "@/lib/assessment-questions";
import { formatInr } from "@/lib/lead";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Assessment" };

export default async function AssessmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^c[a-z0-9]{20,32}$/.test(id)) notFound();
  const a = await prisma.assessment.findUnique({
    where: { id },
    include: { orders: { orderBy: { createdAt: "desc" }, include: { booking: true } } },
  });
  if (!a) notFound();
  await audit(admin.id, "assessment.viewed", a.id);

  return (
    <>
      <PageHead title={a.name} sub={`Assessment submitted ${formatDateTime(a.createdAt)} · +91 ${a.phone}`} />
      <p className="small"><Link href="/admin/assessments">← All assessments</Link></p>
      <div className="agrid">
        <section className="apanel">
          <h2>Answers</h2>
          <dl className="akv akv--wide">
            {describeAnswers(a.answers).map((row) => (
              <div key={row.question}><dt>{row.question}</dt><dd>{row.answer}</dd></div>
            ))}
          </dl>
          <p className="small">{a.consentedAt ? `Consent recorded ${formatDateTime(a.consentedAt)}.` : "Submitted before consent was recorded."}</p>
        </section>
        <section className="apanel">
          <h2>Payments &amp; bookings</h2>
          {a.orders.length === 0 ? (
            <p className="small">No checkout started from this assessment.</p>
          ) : (
            <ul className="alist">
              {a.orders.map((o) => (
                <li key={o.id}>
                  <span>{formatInr(o.amount)} · <Badge status={o.status} /> · {formatDateTime(o.createdAt)}</span>
                  {o.booking ? (
                    <Link href={`/admin/bookings/${o.booking.id}`}>Booking: {formatDateTime(o.booking.startsAt)}</Link>
                  ) : (
                    <span className="small">{o.status === "PAID" ? "Paid, not booked yet" : "No booking"}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
