import type { Metadata } from "next";
import Link from "next/link";
import { LegalHead } from "@/components/legal-head";
import { Icon } from "@/components/icons";
import { BUSINESS, telHref } from "@/lib/business";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "How to reach LifelineX: support email, phone, support hours, registered office address and our grievance officer.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <LegalHead
        title="Contact us"
        intro="Questions about an assessment, a booking, a payment or your plan — here is how to reach a human."
      />

      <div className="legal__callout legal__callout--urgent">
        <span className="legal__callout-mark">
          <Icon name="alert" size={20} />
        </span>
        <p>
          <strong>This is not an emergency line.</strong> If you are experiencing a medical emergency, call your local
          emergency services or go to the nearest hospital immediately. Do not wait for a reply from us.
        </p>
      </div>

      <h2>Support</h2>
      <dl className="legal__details">
        <div>
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
            <span>We reply within 1 working day.</span>
          </dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>
            <a href={telHref(BUSINESS.phone)}>{BUSINESS.phone}</a>
            <span>{BUSINESS.hours}</span>
          </dd>
        </div>
      </dl>

      <h2>Registered entity</h2>
      <dl className="legal__details">
        <div>
          <dt>Name</dt>
          <dd>{BUSINESS.legalName}</dd>
        </div>
        <div>
          <dt>Registered office</dt>
          <dd>{BUSINESS.address}</dd>
        </div>
      </dl>

      <h2>Grievance officer</h2>
      <p>
        For complaints about your data, a refund decision, or anything our support team could not resolve, write to our
        grievance officer. We acknowledge within 2 working days and resolve within 30 days, as required under the
        Information Technology Rules and the Digital Personal Data Protection Act, 2023.
      </p>
      <dl className="legal__details">
        <div>
          <dt>Name</dt>
          <dd>{BUSINESS.grievance.name}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${BUSINESS.grievance.email}`}>{BUSINESS.grievance.email}</a>
          </dd>
        </div>
      </dl>

      <h2>Before you write</h2>
      <p>These answer most of what reaches us:</p>
      <ul>
        <li>
          <strong>Cancelling, rescheduling or a refund</strong> — see the{" "}
          <Link href="/refund">Refund &amp; Cancellation Policy</Link>.
        </li>
        <li>
          <strong>What the fee covers</strong> — the <Link href="/terms">Terms of Service</Link>, section 5.
        </li>
        <li>
          <strong>Your data, or having it deleted</strong> — the <Link href="/privacy">Privacy Policy</Link>, section 6.
        </li>
        <li>
          <strong>Joining your consultation</strong> — the Google Meet link is in your confirmation email, and on your
          booking page.
        </li>
      </ul>
      <p>
        When you email about a booking, send it from the address you booked with and include the order reference from
        your confirmation — it lets us find you without a round of questions.
      </p>
    </>
  );
}
