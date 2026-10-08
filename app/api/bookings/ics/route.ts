import { hasOrderAccess } from "@/lib/access";
import { ORDER_ID_PATTERN } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escapeText = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");

// Calendar invite for the caller's own booking.
export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("order_id") ?? "";
  if (!ORDER_ID_PATTERN.test(orderId) || !(await hasOrderAccess(orderId))) {
    return new Response("Not found", { status: 404 });
  }
  const order = await prisma.paymentOrder.findUnique({ where: { cashfreeOrderId: orderId }, include: { booking: true } });
  const booking = order?.booking;
  if (!booking || booking.status !== "CONFIRMED") return new Response("Not found", { status: 404 });

  const description = booking.meetingUrl
    ? `Join: ${booking.meetingUrl}`
    : "Your meeting link will appear on your LifelineX booking page before the call.";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LifelineX//Booking//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.id}@lifelinex`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(booking.startsAt)}`,
    `DTEND:${stamp(booking.endsAt)}`,
    "SUMMARY:LifelineX doctor consultation",
    `DESCRIPTION:${escapeText(description)}`,
    ...(booking.meetingUrl ? [`URL:${booking.meetingUrl}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="lifelinex-consultation.ics"',
      "Cache-Control": "no-store",
    },
  });
}
