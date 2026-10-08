import Link from "next/link";
import { notFound } from "next/navigation";
import { rescheduleBookingAction, updateBookingAction } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/admin-form";
import { Badge, PageHead } from "@/components/admin/ui";
import { audit, requireAdmin } from "@/lib/admin/auth";
import { describeAnswers } from "@/lib/assessment-questions";
import { formatInr } from "@/lib/lead";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatLongDay, formatTime, IST_OFFSET_MS } from "@/lib/time";

export const metadata = { title: "Booking" };

const toIstInput = (d: Date) => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 16);

export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^c[a-z0-9]{20,32}$/.test(id)) notFound();

  const [booking, doctors] = await Promise.all([
    prisma.booking.findUnique({ where: { id }, include: { order: true, assessment: true, doctor: true } }),
    prisma.doctor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  if (!booking) notFound();
  // Health answers are sensitive: record who looked at them.
  if (booking.assessment) await audit(admin.id, "assessment.viewed", booking.assessment.id, { via: "booking" });

  const doctorOptions = booking.doctor && !booking.doctor.active ? [booking.doctor, ...doctors] : doctors;

  return (
    <>
      <PageHead title={booking.customerName} sub={`${formatLongDay(booking.startsAt)}, ${formatTime(booking.startsAt)}–${formatTime(booking.endsAt)} IST`}>
        <Badge status={booking.status} />
      </PageHead>
      <p className="small"><Link href="/admin/bookings">← All bookings</Link></p>

      <div className="agrid">
        <section className="apanel">
          <h2>Manage</h2>
          <AdminForm action={updateBookingAction} submitLabel="Save changes">
            <input type="hidden" name="id" value={booking.id} />
            <label className="afield">
              <span>Status</span>
              <select name="status" defaultValue={booking.status}>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="NO_SHOW">No-show</option>
                <option value="CANCELLED">Cancelled (frees the slot)</option>
              </select>
            </label>
            <label className="afield">
              <span>Doctor</span>
              <select name="doctorId" defaultValue={booking.doctorId ?? ""}>
                <option value="">Unassigned</option>
                {doctorOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.qualification}{d.active ? "" : " (inactive)"}
                  </option>
                ))}
              </select>
              {doctors.length === 0 && <small>Add doctors under Doctors first.</small>}
            </label>
            <label className="afield">
              <span>Meeting link</span>
              <input name="meetingUrl" type="url" defaultValue={booking.meetingUrl ?? ""} placeholder="https://meet.google.com/…" />
              <small>Shown to the patient on their booking page as soon as you save.</small>
            </label>
            <label className="afield">
              <span>Internal notes</span>
              <textarea name="adminNotes" rows={4} defaultValue={booking.adminNotes ?? ""} placeholder="Only visible to staff" />
            </label>
          </AdminForm>
        </section>

        <section className="apanel">
          <h2>Patient</h2>
          <dl className="akv">
            <div><dt>Name</dt><dd>{booking.customerName}</dd></div>
            <div><dt>Phone</dt><dd><a href={`tel:+91${booking.customerPhone}`}>+91 {booking.customerPhone}</a></dd></div>
            <div><dt>Payment</dt><dd>{formatInr(booking.order.amount)} · <Badge status={booking.order.status} /></dd></div>
            <div><dt>Order</dt><dd className="mono">{booking.order.cashfreeOrderId}</dd></div>
            <div><dt>Booked</dt><dd>{formatDateTime(booking.createdAt)}</dd></div>
            <div><dt>Reschedules</dt><dd>{booking.rescheduleCount} by patient</dd></div>
          </dl>

          <h2 style={{ marginTop: 28 }}>Reschedule</h2>
          <AdminForm action={rescheduleBookingAction} submitLabel="Move booking" submitVariant="ghost">
            <input type="hidden" name="id" value={booking.id} />
            <label className="afield">
              <span>New date and time (IST)</span>
              <input name="startsAt" type="datetime-local" defaultValue={toIstInput(booking.startsAt)} required />
            </label>
            <label className="acheck">
              <input type="checkbox" name="override" /> Override — allow times outside opening hours or a full slot
            </label>
          </AdminForm>
        </section>
      </div>

      <section className="apanel">
        <h2>Assessment</h2>
        {booking.assessment ? (
          <>
            <dl className="akv akv--wide">
              {describeAnswers(booking.assessment.answers).map((row) => (
                <div key={row.question}><dt>{row.question}</dt><dd>{row.answer}</dd></div>
              ))}
            </dl>
            <p className="small">
              Submitted {formatDateTime(booking.assessment.createdAt)}
              {booking.assessment.consentedAt ? " · consent recorded" : ""}
            </p>
          </>
        ) : (
          <p className="small">This patient booked without completing the assessment.</p>
        )}
      </section>
    </>
  );
}
