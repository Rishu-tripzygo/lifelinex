import type { Metadata } from "next";
import Link from "next/link";
import { LegalHead } from "@/components/legal-head";
import { BUSINESS } from "@/lib/business";
import { consultationFeeInr } from "@/lib/config";
import { formatInr } from "@/lib/lead";

const FEE = formatInr(consultationFeeInr());

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms on which LifelineX provides online doctor consultations: what the service is, what it is not, fees, and your responsibilities.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <LegalHead
        title="Terms of Service"
        intro={`These terms govern your use of lifelinex.in and the consultations we arrange. By taking an assessment or booking a consultation you agree to them. The service is operated by ${BUSINESS.legalName}.`}
      />

      <h2>1. What LifelineX is</h2>
      <p>
        LifelineX is a telemedicine service. You complete a structured assessment, pay the consultation fee, and consult
        a doctor registered to practise in India (MBBS/MD) over a video call. Consultations are conducted in line with
        the Telemedicine Practice Guidelines issued under the Indian Medical Council Act. Your doctor may diagnose your
        condition and prescribe medication, supplements or a personalised plan, and will tell you if an in-person
        examination, a diagnostic test or a specialist referral is needed.
      </p>

      <h2>2. What LifelineX is not</h2>
      <p>
        <strong>
          LifelineX is not an emergency service. If you are experiencing a medical emergency, call your local emergency
          services or go to the nearest hospital immediately.
        </strong>{" "}
        The online assessment on its own is not a diagnosis — it gives your doctor context before the call. A remote
        consultation cannot replace a physical examination, and your doctor may decline to prescribe remotely where the
        guidelines require an in-person visit.
      </p>

      <h2>3. Who can use it</h2>
      <p>
        You must be 18 or over and able to enter a contract. Consultations are arranged for people located in India. You
        may book on behalf of someone else only with their knowledge and consent, and the person attending the
        consultation must be the patient.
      </p>

      <h2>4. Your responsibilities</h2>
      <ul>
        <li>
          Give accurate, complete information in your assessment and on the call, including current medication,
          allergies and existing conditions. Your doctor&apos;s advice is only as good as the history you give.
        </li>
        <li>Attend your consultation at the time you booked, from somewhere private with a working internet connection.</li>
        <li>
          Do not treat the advice you receive as transferable to anyone else, and do not resell, republish or share your
          plan or prescription.
        </li>
      </ul>

      <h2>5. Fees and what they cover</h2>
      <p>
        The consultation fee is {FEE}, shown before you pay. It covers the review of your assessment by a doctor and
        your 1-on-1 consultation. If you then choose to continue with the personalised plan your doctor recommends, the
        full {FEE} is credited against the cost of that plan — you do not pay it twice.
      </p>
      <p>
        Diagnostic tests, products and supplements are <strong>not</strong> included in the fee and are not credited.
        They are offered separately, only where relevant to you, and only ever at your choice. Nothing is added to your
        order automatically and there is no subscription or auto-renewal.
      </p>
      <p>
        Refunds, cancellations, reschedules and failed payments are governed by our{" "}
        <Link href="/refund">Refund &amp; Cancellation Policy</Link>, which forms part of these terms.
      </p>

      <h2>6. Prescriptions and records</h2>
      <p>
        Any prescription is issued by the consulting doctor in their own professional judgement, under their own
        registration. LifelineX does not dispense medicines. You may obtain prescribed items from any pharmacy you
        choose. Your doctor&apos;s name, qualification and medical council registration number are shown on your booking
        page before the call.
      </p>

      <h2>7. Your data</h2>
      <p>
        We handle your personal and health information as described in our <Link href="/privacy">Privacy Policy</Link>.
        You consent to that handling when you tick the consent box on the assessment form.
      </p>

      <h2>8. Our content</h2>
      <p>
        The text, design, assessments and other material on this site belong to {BUSINESS.legalName}. You may read and
        print it for your own use; you may not copy, scrape or republish it.
      </p>

      <h2>9. Liability</h2>
      <p>
        We provide the platform and arrange your consultation with reasonable skill and care. Clinical judgement rests
        with the treating doctor. To the extent the law allows, our liability arising out of your use of the service is
        limited to the fees you paid us for the consultation concerned, and we are not liable for indirect or
        consequential loss. Nothing in these terms limits liability that cannot be limited by law, including for death
        or personal injury caused by negligence.
      </p>
      <p>
        We may suspend the service for maintenance, and we may decline or cancel a booking — with a full refund — where
        we cannot safely or lawfully provide the consultation.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by the laws of India, and the courts with jurisdiction over our registered office at{" "}
        {BUSINESS.address} have exclusive jurisdiction over any dispute.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>. Full contact details are
        on our <Link href="/contact">Contact page</Link>.
      </p>
    </>
  );
}
