import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RescheduleToggle, VerifyPhone } from "@/components/booking-manage";
import { Icon } from "@/components/icons";
import { RememberPaidOrder } from "@/components/remember-paid-order";
import { SlotPicker } from "@/components/slot-picker";
import { ConversionTracker } from "@/components/conversion-tracker";
import { hasOrderAccess } from "@/lib/access";
import { formatInr } from "@/lib/lead";
import { ORDER_ID_PATTERN } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { getScheduleSettings } from "@/lib/scheduling";
import { formatLongDay, formatTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your consultation", robots: { index: false, follow: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="status-page">
      <header className="nav is-scrolled">
        <div className="container">
          <Link className="nav__brand" href="/" aria-label="LifelineX home">
            <img src="/assets/logo-horizontal.svg" alt="LifelineX" width={125} height={24} />
          </Link>
        </div>
      </header>
      <main id="main">
        <div className="status status--wide">{children}</div>
      </main>
    </div>
  );
}

function Steps({ booked }: { booked: boolean }) {
  return (
    <div className="status-steps" aria-label="Booking progress">
      <span className="is-done"><Icon name="check" size={14} />Assessment</span>
      <i />
      <span className="is-done"><Icon name="check" size={14} />Payment</span>
      <i />
      <span className={booked ? "is-done" : "is-now"}>{booked && <Icon name="check" size={14} />}Pick a time</span>
    </div>
  );
}

export default async function BookingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!ORDER_ID_PATTERN.test(orderId)) notFound();

  const order = await prisma.paymentOrder.findUnique({
    where: { cashfreeOrderId: orderId },
    include: { booking: { include: { doctor: true } } },
  });
  if (!order) notFound();
  if (order.status !== "PAID") redirect(`/payment/return?order_id=${encodeURIComponent(orderId)}`);

  if (!(await hasOrderAccess(orderId))) {
    return (
      <Shell>
        <span className="status__mark status__mark--wait"><Icon name="lock" size={22} /></span>
        <h1>Confirm it&apos;s you</h1>
        <p className="small" style={{ fontSize: 15.5 }}>
          To see or change this booking on this device, enter the mobile number you used when paying.
        </p>
        <VerifyPhone orderId={orderId} />
      </Shell>
    );
  }

  const booking = order.booking;
  const firstName = order.customerName.split(" ")[0];

  if (!booking) {
    return (
      <Shell>
        <RememberPaidOrder orderId={orderId} />
        <ConversionTracker
          event="payment_success"
          dedupeKey={order.id}
          parameters={{ currency: "INR", value: order.amount, condition: "pcos" }}
        />
        <Steps booked={false} />
        <h1>Pick your consultation time</h1>
        <p className="small" style={{ fontSize: 15.5 }}>
          Thank you, {firstName} — your {formatInr(order.amount)} payment is confirmed. Choose a 1-on-1 slot with an MBBS/MD doctor.
        </p>
        <SlotPicker orderId={orderId} />
      </Shell>
    );
  }

  const settings = await getScheduleSettings();
  const confirmed = booking.status === "CONFIRMED";
  const canReschedule =
    confirmed &&
    booking.rescheduleCount < settings.maxReschedules &&
    Date.now() < booking.startsAt.getTime() - settings.rescheduleCutoffHours * 3_600_000;
  const statusLine: Record<string, string> = {
    COMPLETED: "This consultation has been completed.",
    NO_SHOW: "This consultation was marked as missed. Please contact us to arrange another time.",
    CANCELLED: "This booking was cancelled by our team. Please contact us if you have questions.",
  };

  return (
    <Shell>
      <RememberPaidOrder orderId={orderId} />
      <ConversionTracker
        event="payment_success"
        dedupeKey={order.id}
        parameters={{ currency: "INR", value: order.amount, condition: "pcos" }}
      />
      <ConversionTracker
        event="booking_complete"
        dedupeKey={booking.id}
        parameters={{ condition: "pcos", page_type: "booking" }}
      />
      <Steps booked />
      <span className={`status__mark ${confirmed ? "status__mark--ok" : "status__mark--wait"}`}>
        <Icon name={confirmed ? "check" : "alert"} size={24} />
      </span>
      <h1>{confirmed ? "You're booked" : "Your consultation"}</h1>
      {!confirmed && <p className="small" style={{ fontSize: 15.5 }}>{statusLine[booking.status]}</p>}

      <dl className="status__receipt">
        <div><dt>Date</dt><dd>{formatLongDay(booking.startsAt)}</dd></div>
        <div><dt>Time</dt><dd>{formatTime(booking.startsAt)} – {formatTime(booking.endsAt)} IST</dd></div>
        <div><dt>Name</dt><dd>{order.customerName}</dd></div>
        {order.customerEmail && <div><dt>Email</dt><dd>{order.customerEmail}</dd></div>}
        <div>
          <dt>Doctor</dt>
          <dd>
            {booking.doctor
              ? `${booking.doctor.name}, ${booking.doctor.qualification} · Reg. ${booking.doctor.registrationNumber}`
              : "Assigned before your call"}
          </dd>
        </div>
      </dl>

      {confirmed && (
        <>
          {booking.meetingUrl ? (
            <a className="btn btn--primary btn--block" href={booking.meetingUrl} target="_blank" rel="noopener noreferrer">
              Join on Google Meet <Icon name="arrow" />
            </a>
          ) : (
            <p className="booking__as" style={{ width: "100%" }}>
              <span>
                {order.customerEmail
                  ? `Your Google Meet link is being set up — check ${order.customerEmail} shortly.`
                  : "Your Google Meet link will appear here once your booking is confirmed."}
              </span>
            </p>
          )}
          {order.customerEmail && booking.meetingUrl && (
            <p className="small">We also emailed this Google Meet link to {order.customerEmail}.</p>
          )}
          <div className="status__actions">
            <a className="btn btn--dark" href={`/api/bookings/ics?order_id=${encodeURIComponent(orderId)}`}>
              <Icon name="clock" /> Add to calendar
            </a>
            {canReschedule ? (
              <RescheduleToggle orderId={orderId} current={booking.startsAt.toISOString()} />
            ) : null}
          </div>
          {!canReschedule && (
            <p className="small">
              Times can be changed up to {settings.rescheduleCutoffHours} hours before the call, {settings.maxReschedules}{" "}
              {settings.maxReschedules === 1 ? "time" : "times"} at most. For anything else, please contact us.
            </p>
          )}
        </>
      )}
      <p className="small">Order {orderId}</p>
    </Shell>
  );
}
