import type { Metadata } from "next";
import Link from "next/link";
import { LegalHead } from "@/components/legal-head";
import { BUSINESS, telHref } from "@/lib/business";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How LifelineX collects, uses, stores and protects your personal and health information, and the rights you have over it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <LegalHead
        title="Privacy Policy"
        intro={`${BUSINESS.legalName} ("LifelineX", "we") runs lifelinex.in. This policy explains what we collect when you take an assessment or book a consultation, why we collect it, who can see it, and how to have it corrected or deleted.`}
      />

      <h2>1. Who is responsible for your data</h2>
      <p>
        {BUSINESS.legalName}, {BUSINESS.address}, is the data fiduciary for the information described here. You can
        reach us at <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or{" "}
        <a href={telHref(BUSINESS.phone)}>{BUSINESS.phone}</a>.
      </p>

      <h2>2. What we collect</h2>
      <ul>
        <li>
          <strong>Contact details</strong> — your name, phone number and email address, entered at the start of the
          assessment or when you book.
        </li>
        <li>
          <strong>Health information</strong> — your answers to the assessment questions (cycle, symptoms, history,
          goals, energy and sleep) and anything you tell your doctor during the consultation. Under India&apos;s Digital
          Personal Data Protection Act, 2023 this is sensitive personal data and we treat it as such.
        </li>
        <li>
          <strong>Booking and payment records</strong> — the consultation you paid for, the slot you chose, and the
          payment reference, amount and status returned by our payment gateway. We never see or store your card number,
          UPI PIN, CVV or bank credentials.
        </li>
        <li>
          <strong>Technical data</strong> — IP address, browser type and pages viewed, used to keep the site secure and
          working. If you accept our cookie notice, we also receive analytics and advertising measurement data (see
          section 7).
        </li>
      </ul>

      <h2>3. Why we use it, and on what basis</h2>
      <p>
        We use your assessment answers and contact details for one purpose: so a qualified doctor can review your case
        and conduct your consultation, and so we can deliver the plan and follow-up you have paid for. We rely on the
        consent you give at the assessment form and when you book. We also keep the minimum records needed to meet tax,
        accounting and medical record-keeping obligations, which is a legal requirement rather than a matter of consent.
      </p>
      <p>
        We do not sell your data. We do not share your health information with advertisers, and we do not use your
        assessment answers to target ads to you.
      </p>

      <h2>4. Who can see your information</h2>
      <ul>
        <li>
          <strong>Our clinical team and your assigned doctor</strong> — the people who need your answers to advise you.
        </li>
        <li>
          <strong>Service providers who process data on our behalf</strong>, under contract and only for the task
          concerned: Cashfree Payments (payment processing), Google (the Google Meet room and calendar invite for your
          consultation), our email provider (sending your join link and plan), and our hosting provider. If you accept
          the cookie notice, also Google Analytics and Meta for traffic and advertising measurement.
        </li>
        <li>
          <strong>Authorities</strong> — only where we are legally required to disclose, or where disclosure is needed
          to protect someone&apos;s life or safety.
        </li>
      </ul>

      <h2>5. How long we keep it</h2>
      <p>
        Consultation and prescription records are retained for the period required of a medical practice in India, and
        payment records for the period required by tax law. Assessment answers from visitors who never book are deleted
        within 12 months. You can ask us to delete your data sooner — see section 6.
      </p>

      <h2>6. Your rights</h2>
      <p>You can ask us to:</p>
      <ul>
        <li>give you a copy of the personal data we hold about you;</li>
        <li>correct anything inaccurate or incomplete;</li>
        <li>delete your data, except records we are legally required to keep;</li>
        <li>withdraw your consent, which stops any further processing that relied on it;</li>
        <li>nominate someone to exercise these rights if you are unable to.</li>
      </ul>
      <p>
        Write to <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> and we will respond within 30 days. If you
        are not satisfied, our grievance officer is {BUSINESS.grievance.name} —{" "}
        <a href={`mailto:${BUSINESS.grievance.email}`}>{BUSINESS.grievance.email}</a>. You may also complain to the Data
        Protection Board of India.
      </p>

      <h2>7. Cookies and analytics</h2>
      <p>
        Cookies strictly necessary for the site to work — keeping you signed in to your own booking page, and
        remembering your cookie choice — are always set. Analytics and advertising cookies are set only after you accept
        the cookie notice, and you can decline without losing any part of the service. Declining or clearing your
        browser storage will show you the notice again.
      </p>

      <h2>8. Security</h2>
      <p>
        The site is served over HTTPS with a strict content-security policy. Access to your booking page is restricted
        to your own browser by a signed, http-only cookie, and admin access is restricted to our team. No method of
        transmission or storage is perfectly secure, but we will notify you and the Data Protection Board as required if
        a breach affects your data.
      </p>

      <h2>9. Children</h2>
      <p>
        LifelineX is for people aged 18 and over. We do not knowingly collect data from children. If you believe a child
        has submitted an assessment, tell us and we will delete it.
      </p>

      <h2>10. Changes</h2>
      <p>
        If we change this policy we will update the date at the top of this page, and tell you by email where the change
        materially affects you.
      </p>

      <p className="legal__fine">
        See also our <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/refund">Refund &amp; Cancellation Policy</Link>.
      </p>
    </>
  );
}
