import type { Metadata } from "next";
import Link from "next/link";
import { LegalHead } from "@/components/legal-head";
import { BUSINESS } from "@/lib/business";
import { consultationFeeInr } from "@/lib/config";
import { formatInr } from "@/lib/lead";
import { getScheduleSettings } from "@/lib/scheduling";

const FEE = formatInr(consultationFeeInr());

// Mirrors the ScheduleSettings defaults, used if the database is unreachable so a
// legal page never fails to render.
const FALLBACK = { rescheduleCutoffHours: 12, maxReschedules: 2 };

// Re-render hourly so the quoted booking rules follow what an admin saves.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "When the LifelineX consultation fee is refunded, how to reschedule or cancel, and what happens if a slot is missed, a doctor cannot attend, or a payment fails.",
  alternates: { canonical: "/refund" },
};

export default async function RefundPage() {
  // Quoted from the live booking rules so the policy and the booking engine agree.
  const { rescheduleCutoffHours, maxReschedules } = await getScheduleSettings().catch(() => FALLBACK);

  return (
    <>
      <LegalHead
        title="Refund & Cancellation Policy"
        intro={`This policy covers the ${FEE} consultation fee: when it is credited, when it is refunded, and what happens if a slot is missed or a payment fails. It forms part of our Terms of Service.`}
      />

      <h2>1. What the fee buys</h2>
      <p>
        The {FEE} consultation fee covers the review of your assessment by a doctor and your 1-on-1 consultation. If you
        choose to continue with the personalised plan your doctor recommends, the full {FEE} is credited against the
        cost of that plan. Diagnostic tests, products and supplements are separate, optional, and not credited.
      </p>

      <h2>2. Once the consultation has taken place</h2>
      <p>
        After your consultation has been delivered the fee is non-refundable, including where you decide not to continue
        with a plan. By then the service you paid for — a doctor&apos;s review of your case and a consultation — has been
        provided.
      </p>

      <h2>3. Cancelling before your consultation</h2>
      <ul>
        <li>
          <strong>More than {rescheduleCutoffHours} hours before your slot:</strong> cancel for a full refund of {FEE},
          no questions asked. Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> from the address you
          booked with, or reply to your booking confirmation.
        </li>
        <li>
          <strong>Within {rescheduleCutoffHours} hours of your slot:</strong> the slot is held for you and the fee is no
          longer refundable, because the doctor&apos;s time has been reserved. You may still reschedule as a goodwill
          exception by contacting us — see section 4.
        </li>
      </ul>

      <h2>4. Rescheduling</h2>
      <p>
        You can move your consultation yourself from your booking page, up to {maxReschedules} times, provided you do so
        more than {rescheduleCutoffHours} hours before the slot. Rescheduling is free and does not affect the fee or the
        credit against your plan. If you need to change a time inside the {rescheduleCutoffHours}-hour window, or you
        have used your reschedules, email us and we will do what we reasonably can.
      </p>

      <h2>5. If you miss your slot</h2>
      <p>
        If you do not join within 10 minutes of the start time and have not told us in advance, the consultation counts
        as delivered and the fee is not refundable. As a one-time courtesy we will normally offer you a fresh slot at no
        extra cost — ask us and we will arrange it. Repeated no-shows may not be rescheduled.
      </p>

      <h2>6. If your doctor cannot attend</h2>
      <p>
        If the doctor does not join, or we cancel or move your consultation for any reason on our side, you choose: a
        replacement slot at a time that suits you, or a <strong>full refund of {FEE}</strong>. The same applies if a
        technical fault on our side — the Google Meet room, the join link or our site — prevents the consultation from
        going ahead and we cannot run it within a reasonable time.
      </p>

      <h2>7. Failed, duplicate and pending payments</h2>
      <ul>
        <li>
          <strong>Payment failed but you were debited:</strong> no booking is created and the amount is reversed by your
          bank or payment provider, normally within 5–7 working days. If it has not reached you by then, email us with
          the date, amount and the reference from your bank statement and we will chase it with the gateway.
        </li>
        <li>
          <strong>Charged twice for one consultation:</strong> tell us and we refund the duplicate in full. We initiate
          it within 2 working days of confirming the duplicate.
        </li>
        <li>
          <strong>Payment pending:</strong> if a payment is still unconfirmed after 24 hours, treat it as failed. Do not
          pay again — contact us first so we do not create a second order.
        </li>
      </ul>

      <h2>8. How refunds are paid</h2>
      <p>
        Refunds go back to the original payment method — the same card, UPI ID or bank account — and cannot be redirected
        elsewhere. We initiate an approved refund within 2 working days; your bank then typically takes 5–7 working days
        to credit it. We do not charge a cancellation or processing fee, and we do not issue refunds as credit or
        vouchers unless you ask for one.
      </p>

      <h2>9. How to request a refund</h2>
      <p>
        Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> from the address you booked with, with your name
        and the order reference from your confirmation email. We acknowledge within 2 working days and decide within 7.
        If you disagree with the outcome, escalate to our grievance officer, {BUSINESS.grievance.name} —{" "}
        <a href={`mailto:${BUSINESS.grievance.email}`}>{BUSINESS.grievance.email}</a>.
      </p>

      <p className="legal__fine">
        See also our <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </>
  );
}
