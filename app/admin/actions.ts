"use server";

import crypto from "node:crypto";
import type { BookingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, hashPassword, login, logout, passwordProblem, requireAdmin, verifyPassword } from "@/lib/admin/auth";
import { deliverBookingConfirmation } from "@/lib/booking-delivery";
import { prisma } from "@/lib/prisma";
import { BookingError, bookSlot } from "@/lib/scheduling";
import { inputToMinutes, IST_OFFSET_MS } from "@/lib/time";

export type ActionState = { ok?: string; error?: string; secret?: string } | undefined;

const str = (fd: FormData, key: string, max = 500) => String(fd.get(key) ?? "").trim().slice(0, max);
const int = (fd: FormData, key: string) => Number.parseInt(String(fd.get(key) ?? ""), 10);
const ID = /^c[a-z0-9]{20,32}$/;

// "2026-10-12T10:30" typed in the admin panel is IST wall-clock time.
function istInputToDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(Date.parse(`${value}:00Z`) - IST_OFFSET_MS);
  return Number.isNaN(date.getTime()) ? null : date;
}

function safeMeetingUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

// ---------- session ----------

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const result = await login(str(fd, "email", 200), String(fd.get("password") ?? "").slice(0, 200));
  if (!result.ok) return { error: result.error };
  redirect("/admin");
}

export async function logoutAction() {
  const admin = await requireAdmin();
  await audit(admin.id, "logout");
  await logout();
  redirect("/admin/login");
}

export async function changePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const problem = passwordProblem(next);
  if (problem) return { error: problem };
  if (next !== String(fd.get("confirm") ?? "")) return { error: "The new passwords don't match." };
  const user = await prisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  if (!(await verifyPassword(current, user.passwordHash))) return { error: "Your current password is incorrect." };
  await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(next) } });
  await audit(admin.id, "account.password_changed");
  return { ok: "Password updated." };
}

// ---------- bookings ----------

const STATUSES: BookingStatus[] = ["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];

export async function updateBookingAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(fd, "id", 40);
  if (!ID.test(id)) return { error: "Unknown booking." };
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return { error: "Unknown booking." };

  const status = str(fd, "status", 20) as BookingStatus;
  if (!STATUSES.includes(status)) return { error: "Pick a valid status." };
  const doctorId = str(fd, "doctorId", 40) || null;
  if (doctorId && !(ID.test(doctorId) && (await prisma.doctor.findUnique({ where: { id: doctorId } })))) {
    return { error: "Pick a valid doctor." };
  }
  const meetingUrl = safeMeetingUrl(str(fd, "meetingUrl", 500));
  if (meetingUrl === undefined) return { error: "The meeting link must be a full https:// address." };
  const adminNotes = str(fd, "adminNotes", 4000) || null;

  if (status === "CONFIRMED" && booking.status === "CANCELLED") {
    return { error: "To restore a cancelled booking, reschedule it to a new time below." };
  }

  await prisma.booking.update({
    where: { id },
    data: {
      status,
      doctorId,
      meetingUrl,
      adminNotes,
      // Cancelling releases the seat so someone else can book the slot.
      ...(status === "CANCELLED" ? { seat: null } : {}),
    },
  });
  await audit(admin.id, "booking.updated", id, {
    from: { status: booking.status, doctorId: booking.doctorId, meetingUrl: booking.meetingUrl },
    to: { status, doctorId, meetingUrl },
    notesChanged: (booking.adminNotes ?? "") !== (adminNotes ?? ""),
  });
  if (status === "CONFIRMED" && meetingUrl && meetingUrl !== booking.meetingUrl) {
    void deliverBookingConfirmation(id);
  }
  revalidatePath("/admin", "layout");
  return { ok: "Booking saved." };
}

export async function rescheduleBookingAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(fd, "id", 40);
  const startsAt = istInputToDate(str(fd, "startsAt", 20));
  if (!ID.test(id) || !startsAt) return { error: "Pick a date and time." };
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return { error: "Unknown booking." };
  let updated;
  try {
    updated = await bookSlot({ orderId: booking.orderId, startsAt: startsAt.toISOString(), by: "admin", overrideCapacity: fd.get("override") === "on" });
  } catch (error) {
    if (error instanceof BookingError) return { error: `${error.message} Tick “Override” to book outside open slots.` };
    throw error;
  }
  await audit(admin.id, "booking.rescheduled", id, { from: booking.startsAt.toISOString(), to: startsAt.toISOString() });
  void deliverBookingConfirmation(updated.id, { recreateMeet: true });
  revalidatePath("/admin", "layout");
  return { ok: "Booking moved." };
}

export async function createBookingForOrderAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const orderId = str(fd, "orderId", 40);
  const startsAt = istInputToDate(str(fd, "startsAt", 20));
  if (!ID.test(orderId) || !startsAt) return { error: "Pick a date and time." };
  try {
    const booking = await bookSlot({ orderId, startsAt: startsAt.toISOString(), by: "admin", overrideCapacity: fd.get("override") === "on" });
    await audit(admin.id, "booking.created_by_admin", booking.id, { orderId, startsAt: startsAt.toISOString() });
    void deliverBookingConfirmation(booking.id);
  } catch (error) {
    if (error instanceof BookingError) return { error: `${error.message} Tick “Override” to book outside open slots.` };
    throw error;
  }
  revalidatePath("/admin", "layout");
  return { ok: "Booked." };
}

// ---------- schedule (admins only) ----------

export async function saveScheduleSettingsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin("ADMIN");
  const data = {
    slotMinutes: int(fd, "slotMinutes"),
    capacity: int(fd, "capacity"),
    minNoticeMinutes: int(fd, "minNoticeHours") * 60,
    horizonDays: int(fd, "horizonDays"),
    rescheduleCutoffHours: int(fd, "rescheduleCutoffHours"),
    maxReschedules: int(fd, "maxReschedules"),
  };
  if (![15, 20, 30, 45, 60].includes(data.slotMinutes)) return { error: "Slot length must be 15, 20, 30, 45 or 60 minutes." };
  if (!(data.capacity >= 1 && data.capacity <= 20)) return { error: "Parallel consultations must be 1–20." };
  if (!(data.minNoticeMinutes >= 0 && data.minNoticeMinutes <= 7 * 24 * 60)) return { error: "Minimum notice must be 0–168 hours." };
  if (!(data.horizonDays >= 1 && data.horizonDays <= 90)) return { error: "Booking window must be 1–90 days." };
  if (!(data.rescheduleCutoffHours >= 0 && data.rescheduleCutoffHours <= 168)) return { error: "Reschedule cutoff must be 0–168 hours." };
  if (!(data.maxReschedules >= 0 && data.maxReschedules <= 10)) return { error: "Reschedule limit must be 0–10." };

  await prisma.scheduleSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  await audit(admin.id, "schedule.settings_saved", null, data);
  revalidatePath("/admin/schedule");
  return { ok: "Settings saved." };
}

// Each weekday is a text field like "10:00-13:00, 14:00-18:00" (empty = closed).
export async function saveWeeklyHoursAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin("ADMIN");
  const rows: { weekday: number; startMinute: number; endMinute: number }[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    const raw = str(fd, `day${weekday}`, 200);
    if (!raw) continue;
    const ranges = raw.split(",").map((r) => r.trim()).filter(Boolean);
    const parsed: { start: number; end: number }[] = [];
    for (const range of ranges) {
      const [a, b] = range.split(/\s*[-–]\s*/);
      const start = inputToMinutes(a ?? "");
      const end = inputToMinutes(b ?? "");
      if (start === null || end === null || end <= start) {
        return { error: `Couldn't read “${range}”. Use 24-hour ranges like 10:00-13:00.` };
      }
      parsed.push({ start, end });
    }
    parsed.sort((x, y) => x.start - y.start);
    if (parsed.some((r, i) => i > 0 && r.start < parsed[i - 1].end)) return { error: "Opening hours on the same day can't overlap." };
    parsed.forEach((r) => rows.push({ weekday, startMinute: r.start, endMinute: r.end }));
  }
  await prisma.$transaction([prisma.weeklyHours.deleteMany(), prisma.weeklyHours.createMany({ data: rows })]);
  await audit(admin.id, "schedule.hours_saved", null, { ranges: rows.length });
  revalidatePath("/admin/schedule");
  return { ok: rows.length ? "Opening hours saved." : "Saved — the clinic is now closed every day." };
}

export async function addBlockedPeriodAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin("ADMIN");
  const startsAt = istInputToDate(str(fd, "startsAt", 20));
  const endsAt = istInputToDate(str(fd, "endsAt", 20));
  const reason = str(fd, "reason", 200) || null;
  if (!startsAt || !endsAt || endsAt <= startsAt) return { error: "Pick a start and an end after it." };
  const block = await prisma.blockedPeriod.create({ data: { startsAt, endsAt, reason } });
  const affected = await prisma.booking.count({
    where: { status: "CONFIRMED", startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
  });
  await audit(admin.id, "schedule.block_added", block.id, { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), reason });
  revalidatePath("/admin/schedule");
  return affected
    ? { ok: `Blocked. ${affected} existing booking${affected === 1 ? "" : "s"} fall in this period — reschedule ${affected === 1 ? "it" : "them"} from Bookings.` }
    : { ok: "Blocked. No existing bookings were affected." };
}

export async function deleteBlockedPeriodAction(fd: FormData) {
  const admin = await requireAdmin("ADMIN");
  const id = str(fd, "id", 40);
  if (!ID.test(id)) return;
  await prisma.blockedPeriod.deleteMany({ where: { id } });
  await audit(admin.id, "schedule.block_removed", id);
  revalidatePath("/admin/schedule");
}

// ---------- doctors (admins only) ----------

export async function saveDoctorAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin("ADMIN");
  const id = str(fd, "id", 40);
  const data = {
    name: str(fd, "name", 120),
    qualification: str(fd, "qualification", 120),
    registrationNumber: str(fd, "registrationNumber", 60),
  };
  if (!data.name || !data.qualification || !data.registrationNumber) return { error: "Name, qualification and registration number are all required." };
  if (id) {
    if (!ID.test(id)) return { error: "Unknown doctor." };
    await prisma.doctor.update({ where: { id }, data });
    await audit(admin.id, "doctor.updated", id, data);
  } else {
    const doctor = await prisma.doctor.create({ data });
    await audit(admin.id, "doctor.created", doctor.id, data);
  }
  revalidatePath("/admin/doctors");
  return { ok: id ? "Doctor updated." : "Doctor added." };
}

export async function toggleDoctorAction(fd: FormData) {
  const admin = await requireAdmin("ADMIN");
  const id = str(fd, "id", 40);
  if (!ID.test(id)) return;
  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) return;
  await prisma.doctor.update({ where: { id }, data: { active: !doctor.active } });
  await audit(admin.id, doctor.active ? "doctor.deactivated" : "doctor.activated", id);
  revalidatePath("/admin/doctors");
}

// ---------- team (admins only) ----------

const generatedPassword = () => crypto.randomBytes(15).toString("base64url");

export async function createAdminUserAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin("ADMIN");
  const email = str(fd, "email", 200).toLowerCase();
  const name = str(fd, "name", 120);
  const role = str(fd, "role", 10) === "ADMIN" ? "ADMIN" : "STAFF";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) return { error: "Enter a name and a valid email." };
  if (await prisma.adminUser.findUnique({ where: { email } })) return { error: "That email already has an account." };
  const password = generatedPassword();
  const user = await prisma.adminUser.create({ data: { email, name, role, passwordHash: await hashPassword(password) } });
  await audit(admin.id, "team.user_created", user.id, { email, role });
  revalidatePath("/admin/team");
  return { ok: `Account created for ${email}. Share this password with them privately — it won't be shown again.`, secret: password };
}

export async function resetAdminPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin("ADMIN");
  const id = str(fd, "id", 40);
  const user = ID.test(id) ? await prisma.adminUser.findUnique({ where: { id } }) : null;
  if (!user) return { error: "Unknown account." };
  const password = generatedPassword();
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id }, data: { passwordHash: await hashPassword(password) } }),
    prisma.adminSession.deleteMany({ where: { userId: id } }),
  ]);
  await audit(admin.id, "team.password_reset", id);
  return { ok: `New password for ${user.email} (shown once):`, secret: password };
}

export async function toggleAdminUserAction(fd: FormData) {
  const admin = await requireAdmin("ADMIN");
  const id = str(fd, "id", 40);
  if (!ID.test(id) || id === admin.id) return; // never lock yourself out
  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) return;
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id }, data: { active: !user.active } }),
    ...(user.active ? [prisma.adminSession.deleteMany({ where: { userId: id } })] : []),
  ]);
  await audit(admin.id, user.active ? "team.user_deactivated" : "team.user_activated", id);
  revalidatePath("/admin/team");
}
