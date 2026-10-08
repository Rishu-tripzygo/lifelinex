import "server-only";
import { Prisma, type Booking, type ScheduleSettings } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addDaysKey, istDateKey, istMidnight, istWeekday } from "@/lib/time";

export type Slot = { startsAt: string; endsAt: string; remaining: number };
export type SlotDay = { date: string; slots: Slot[] };

// Mon–Sat, 10:00–13:00 and 14:00–18:00 IST: used only until an admin saves real hours.
const DEFAULT_HOURS = [1, 2, 3, 4, 5, 6].flatMap((weekday) => [
  { weekday, startMinute: 600, endMinute: 780 },
  { weekday, startMinute: 840, endMinute: 1080 },
]);

async function ensureDefaultHours(client: Pick<typeof prisma, "weeklyHours"> = prisma) {
  if ((await client.weeklyHours.count()) === 0) await client.weeklyHours.createMany({ data: DEFAULT_HOURS });
}

export async function getScheduleSettings(): Promise<ScheduleSettings> {
  const existing = await prisma.scheduleSettings.findUnique({ where: { id: 1 } });
  if (existing) {
    await ensureDefaultHours();
    return existing;
  }
  // First run: create the settings row and default hours together. The lock keeps two
  // simultaneous first visits from both inserting id 1 (Prisma upsert is not race-safe).
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(748211)`;
      const again = await tx.scheduleSettings.findUnique({ where: { id: 1 } });
      if (again) {
        await ensureDefaultHours(tx);
        return again;
      }
      const settings = await tx.scheduleSettings.create({ data: { id: 1 } });
      await ensureDefaultHours(tx);
      return settings;
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const row = await prisma.scheduleSettings.findUnique({ where: { id: 1 } });
    if (row) {
      await ensureDefaultHours();
      return row;
    }
    throw error;
  }
}

// Every bookable slot from now (plus minimum notice) to the booking horizon.
// `ignoreBookingId` lets a reschedule see the seat its own booking currently holds as free.
export async function listAvailableSlots(opts: { ignoreBookingId?: string; includeFull?: boolean } = {}): Promise<SlotDay[]> {
  const settings = await getScheduleSettings();
  const [hours, now] = [await prisma.weeklyHours.findMany(), Date.now()];
  const earliest = now + settings.minNoticeMinutes * 60_000;
  const todayKey = istDateKey(new Date(now));
  const rangeStart = istMidnight(todayKey);
  const rangeEnd = istMidnight(addDaysKey(todayKey, settings.horizonDays + 1));

  const [blocked, taken] = await Promise.all([
    prisma.blockedPeriod.findMany({ where: { endsAt: { gt: rangeStart }, startsAt: { lt: rangeEnd } } }),
    prisma.booking.groupBy({
      by: ["startsAt"],
      where: {
        startsAt: { gte: rangeStart, lt: rangeEnd },
        seat: { not: null },
        ...(opts.ignoreBookingId ? { id: { not: opts.ignoreBookingId } } : {}),
      },
      _count: { _all: true },
    }),
  ]);
  const takenAt = new Map(taken.map((t) => [t.startsAt.getTime(), t._count._all]));

  const days: SlotDay[] = [];
  for (let i = 0; i <= settings.horizonDays; i++) {
    const dateKey = addDaysKey(todayKey, i);
    const midnight = istMidnight(dateKey).getTime();
    const ranges = hours
      .filter((h) => h.weekday === istWeekday(dateKey))
      .sort((a, b) => a.startMinute - b.startMinute);
    const slots: Slot[] = [];
    for (const range of ranges) {
      for (let m = range.startMinute; m + settings.slotMinutes <= range.endMinute; m += settings.slotMinutes) {
        const start = midnight + m * 60_000;
        const end = start + settings.slotMinutes * 60_000;
        if (start < earliest) continue;
        if (blocked.some((b) => b.startsAt.getTime() < end && b.endsAt.getTime() > start)) continue;
        const remaining = settings.capacity - (takenAt.get(start) ?? 0);
        if (remaining <= 0 && !opts.includeFull) continue;
        slots.push({ startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString(), remaining: Math.max(0, remaining) });
      }
    }
    if (slots.length) days.push({ date: dateKey, slots });
  }
  return days;
}

export class BookingError extends Error {}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// Books (or moves) the booking for a paid order into a slot. Customers can only pick a slot
// that `listAvailableSlots` would offer; admins may also override capacity and notice.
export async function bookSlot(input: {
  orderId: string;
  startsAt: string;
  by: "customer" | "admin";
  overrideCapacity?: boolean;
}): Promise<Booking> {
  const order = await prisma.paymentOrder.findUnique({ where: { id: input.orderId }, include: { booking: true } });
  if (!order || order.status !== "PAID") throw new BookingError("This order hasn't been paid.");
  const existing = order.booking;
  if (existing && (existing.status === "COMPLETED" || existing.status === "NO_SHOW")) {
    throw new BookingError("This consultation has already taken place.");
  }
  if (existing?.status === "CANCELLED" && input.by === "customer") {
    throw new BookingError("This booking was cancelled by our team. Please contact us to rebook.");
  }

  const settings = await getScheduleSettings();
  if (existing && existing.status === "CONFIRMED" && input.by === "customer") {
    const cutoff = existing.startsAt.getTime() - settings.rescheduleCutoffHours * 3_600_000;
    if (Date.now() > cutoff) {
      throw new BookingError(`Bookings can't be changed within ${settings.rescheduleCutoffHours} hours of the consultation.`);
    }
    if (existing.rescheduleCount >= settings.maxReschedules) {
      throw new BookingError("You've reached the reschedule limit. Please contact us to change your time.");
    }
  }

  const start = new Date(input.startsAt);
  if (Number.isNaN(start.getTime())) throw new BookingError("Pick a valid time.");
  const end = new Date(start.getTime() + settings.slotMinutes * 60_000);

  if (!input.overrideCapacity) {
    const days = await listAvailableSlots({ ignoreBookingId: existing?.id });
    const offered = days.some((d) => d.slots.some((s) => s.startsAt === start.toISOString()));
    if (!offered) throw new BookingError("That time is no longer available. Please pick another.");
  }

  // Claim the first free seat. The unique (startsAt, seat) index arbitrates races: if two
  // people take the last seat at once, one insert fails and they're told to pick again.
  const maxSeat = input.overrideCapacity ? settings.capacity + 20 : settings.capacity;
  for (let seat = 1; seat <= maxSeat; seat++) {
    try {
      if (existing) {
        if (existing.startsAt.getTime() === start.getTime() && existing.seat !== null) return existing;
        return await prisma.booking.update({
          where: { id: existing.id },
          data: {
            startsAt: start,
            endsAt: end,
            seat,
            status: "CONFIRMED",
            ...(existing.status === "CONFIRMED" && input.by === "customer" ? { rescheduleCount: { increment: 1 } } : {}),
          },
        });
      }
      return await prisma.booking.create({
        data: {
          orderId: order.id,
          assessmentId: order.assessmentId,
          startsAt: start,
          endsAt: end,
          seat,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        // Either the seat is taken (try the next) or another tab booked this order first.
        const again = await prisma.booking.findUnique({ where: { orderId: order.id } });
        if (!existing && again) return again;
        continue;
      }
      throw error;
    }
  }
  throw new BookingError("That time was just taken. Please pick another.");
}
