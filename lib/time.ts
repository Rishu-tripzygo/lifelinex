// IST helpers, safe for both server and browser. India has no daylight saving, so IST is a
// fixed UTC+05:30 and slot maths can use plain offsets.

export const IST_OFFSET_MS = 330 * 60 * 1000;
export const TIME_ZONE = "Asia/Kolkata";

const DAY_MS = 24 * 60 * 60 * 1000;

// The IST calendar date of an instant, as "YYYY-MM-DD".
export function istDateKey(date: Date) {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

// UTC instant of IST midnight for a "YYYY-MM-DD" key.
export function istMidnight(dateKey: string) {
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) - IST_OFFSET_MS);
}

export function istWeekday(dateKey: string) {
  return new Date(`${dateKey}T00:00:00Z`).getUTCDay();
}

export function addDaysKey(dateKey: string, days: number) {
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function minutesToLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function minutesToInput(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function inputToMinutes(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59 || (h === 24 && m > 0)) return null;
  return h * 60 + m;
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: TIME_ZONE, ...opts });
const timeFmt = fmt({ hour: "numeric", minute: "2-digit", hour12: true });
const dayFmt = fmt({ weekday: "short", day: "numeric", month: "short" });
const longDayFmt = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const dateTimeFmt = fmt({ day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

export const formatTime = (d: Date | string) => timeFmt.format(new Date(d)).replace(/\s?(am|pm)/i, (s) => s.toLowerCase());
export const formatDay = (d: Date | string) => dayFmt.format(new Date(d));
export const formatLongDay = (d: Date | string) => longDayFmt.format(new Date(d));
export const formatDateTime = (d: Date | string) => dateTimeFmt.format(new Date(d)).replace(/\s?(am|pm)/i, (s) => s.toLowerCase());

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
