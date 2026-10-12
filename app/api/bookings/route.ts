import { NextResponse } from "next/server";
import { hasOrderAccess } from "@/lib/access";
import { deliverBookingConfirmation } from "@/lib/booking-delivery";
import { notifyTeam } from "@/lib/notify";
import { ORDER_ID_PATTERN } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { jsonError, readGuardedJson } from "@/lib/request-guard";
import { BookingError, bookSlot } from "@/lib/scheduling";
import { formatDateTime } from "@/lib/time";

// Book or reschedule the consultation for a paid order the caller has access to.
export async function POST(request: Request) {
  const read = await readGuardedJson(request, { route: "bookings", limit: 20, windowMs: 10 * 60 * 1000 });
  if ("response" in read) return read.response;
  const { orderId, startsAt } = read.body;

  if (typeof orderId !== "string" || !ORDER_ID_PATTERN.test(orderId) || typeof startsAt !== "string") {
    return jsonError("Pick a time to book.", 400);
  }
  if (!(await hasOrderAccess(orderId))) {
    return jsonError("Please confirm your phone number to manage this booking.", 403);
  }

  try {
    const order = await prisma.paymentOrder.findUnique({ where: { cashfreeOrderId: orderId }, include: { booking: true } });
    if (!order) return jsonError("We couldn't find that order.", 404);
    const before = order.booking?.startsAt;
    const booking = await bookSlot({ orderId: order.id, startsAt, by: "customer" });

    if (!before || before.getTime() !== booking.startsAt.getTime()) {
      void notifyTeam(
        before
          ? `Rescheduled: ${order.customerName} moved from ${formatDateTime(before)} to ${formatDateTime(booking.startsAt)} IST. Order ${orderId}.`
          : `New booking: ${order.customerName} (+91 ${order.customerPhone}) on ${formatDateTime(booking.startsAt)} IST. Order ${orderId}.`,
      );
      void deliverBookingConfirmation(booking.id, { recreateMeet: !!before });
    }
    return NextResponse.json({ startsAt: booking.startsAt.toISOString(), endsAt: booking.endsAt.toISOString() });
  } catch (error) {
    if (error instanceof BookingError) return jsonError(error.message, 409);
    console.error("[bookings] failed", error);
    return jsonError("We couldn't save your booking. Please try again.", 503);
  }
}
