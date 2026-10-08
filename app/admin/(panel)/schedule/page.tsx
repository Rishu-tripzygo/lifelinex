import {
  addBlockedPeriodAction,
  deleteBlockedPeriodAction,
  saveScheduleSettingsAction,
  saveWeeklyHoursAction,
} from "@/app/admin/actions";
import { AdminForm, ConfirmButton } from "@/components/admin/admin-form";
import { Empty, PageHead } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { getScheduleSettings, listAvailableSlots } from "@/lib/scheduling";
import { formatDateTime, minutesToInput, WEEKDAYS } from "@/lib/time";

export const metadata = { title: "Schedule" };

export default async function SchedulePage() {
  await requireAdmin("ADMIN");
  const settings = await getScheduleSettings();
  const [hours, blocks, days] = await Promise.all([
    prisma.weeklyHours.findMany({ orderBy: [{ weekday: "asc" }, { startMinute: "asc" }] }),
    prisma.blockedPeriod.findMany({ where: { endsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" } }),
    listAvailableSlots(),
  ]);
  const openSlots = days.reduce((n, d) => n + d.slots.length, 0);
  const dayValue = (weekday: number) =>
    hours
      .filter((h) => h.weekday === weekday)
      .map((h) => `${minutesToInput(h.startMinute)}-${minutesToInput(h.endMinute)}`)
      .join(", ");
  // Monday first, Sunday last — how the clinic reads its week.
  const order = [1, 2, 3, 4, 5, 6, 0];

  return (
    <>
      <PageHead
        title="Schedule"
        sub={`Opening hours, slot rules and closures. All times IST. ${openSlots} slot${openSlots === 1 ? "" : "s"} currently open for booking.`}
      />

      <div className="agrid">
        <section className="apanel">
          <h2>Opening hours</h2>
          <p className="small">24-hour ranges, comma-separated. Leave a day empty to close it. Example: 10:00-13:00, 14:00-18:00</p>
          <AdminForm action={saveWeeklyHoursAction} submitLabel="Save hours">
            {order.map((weekday) => (
              <label className="afield afield--row" key={weekday}>
                <span>{WEEKDAYS[weekday]}</span>
                <input name={`day${weekday}`} defaultValue={dayValue(weekday)} placeholder="Closed" />
              </label>
            ))}
          </AdminForm>
        </section>

        <section className="apanel">
          <h2>Booking rules</h2>
          <AdminForm action={saveScheduleSettingsAction} submitLabel="Save rules">
            <label className="afield afield--row">
              <span>Slot length</span>
              <select name="slotMinutes" defaultValue={settings.slotMinutes}>
                {[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}
              </select>
            </label>
            <label className="afield afield--row">
              <span>Parallel consultations</span>
              <input name="capacity" type="number" min={1} max={20} defaultValue={settings.capacity} />
            </label>
            <label className="afield afield--row">
              <span>Minimum notice (hours)</span>
              <input name="minNoticeHours" type="number" min={0} max={168} defaultValue={Math.round(settings.minNoticeMinutes / 60)} />
            </label>
            <label className="afield afield--row">
              <span>Bookable days ahead</span>
              <input name="horizonDays" type="number" min={1} max={90} defaultValue={settings.horizonDays} />
            </label>
            <label className="afield afield--row">
              <span>Reschedule cutoff (hours before)</span>
              <input name="rescheduleCutoffHours" type="number" min={0} max={168} defaultValue={settings.rescheduleCutoffHours} />
            </label>
            <label className="afield afield--row">
              <span>Reschedules allowed per booking</span>
              <input name="maxReschedules" type="number" min={0} max={10} defaultValue={settings.maxReschedules} />
            </label>
          </AdminForm>
          <p className="small" style={{ marginTop: 12 }}>
            Changing the slot length doesn&apos;t move existing bookings; they keep their original times.
          </p>
        </section>
      </div>

      <section className="apanel">
        <h2>Closures &amp; leave</h2>
        <AdminForm action={addBlockedPeriodAction} submitLabel="Block this time" className="aform--inline" resetOnSuccess>
          <label className="afield">
            <span>From (IST)</span>
            <input type="datetime-local" name="startsAt" required />
          </label>
          <label className="afield">
            <span>Until (IST)</span>
            <input type="datetime-local" name="endsAt" required />
          </label>
          <label className="afield">
            <span>Reason (internal)</span>
            <input name="reason" placeholder="e.g. Diwali holiday" />
          </label>
        </AdminForm>
        {blocks.length === 0 ? (
          <Empty>No upcoming closures.</Empty>
        ) : (
          <ul className="alist">
            {blocks.map((b) => (
              <li key={b.id} className="alist__row">
                <span>
                  <strong>{formatDateTime(b.startsAt)}</strong> → {formatDateTime(b.endsAt)}
                  {b.reason ? <span className="small"> · {b.reason}</span> : null}
                </span>
                <ConfirmButton action={deleteBlockedPeriodAction} name="id" value={b.id} label="Remove" confirm="Reopen this period for bookings?" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
