import "server-only";
import { sendConsultationEmail } from "@/lib/email";
import { createGoogleMeetLink } from "@/lib/google-meet";
import { prisma } from "@/lib/prisma";

// Creates a Google Meet link when configured, saves it on the booking, and emails the patient.
export async function deliverBookingConfirmation(bookingId: string, opts?: { recreateMeet?: boolean }) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { order: true },
  });
  if (!booking || booking.status !== "CONFIRMED") return;

  const email = booking.order.customerEmail?.trim();
  if (!email) return;

  let meetingUrl = booking.meetingUrl;
  if (!meetingUrl || opts?.recreateMeet) {
    try {
      const created =
        (await createGoogleMeetLink({
          summary: `LifelineX consultation — ${booking.customerName}`,
          description: `Patient: ${booking.customerName}\nPhone: +91 ${booking.customerPhone}\nOrder: ${booking.order.cashfreeOrderId}`,
          startsAt: booking.startsAt,
          endsAt: booking.endsAt,
          attendeeEmail: email,
        })) ?? null;
      if (created) {
        meetingUrl = created;
        await prisma.booking.update({ where: { id: booking.id }, data: { meetingUrl } });
      }
    } catch (error) {
      console.error("[booking-delivery] Google Meet creation failed", error);
      if (!meetingUrl) return;
    }
  }

  if (!meetingUrl) return;

  await sendConsultationEmail({
    to: email,
    name: booking.customerName,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    meetingUrl,
    orderId: booking.order.cashfreeOrderId,
  });
}
