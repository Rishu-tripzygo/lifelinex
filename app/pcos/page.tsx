import Link from "next/link";
import type { Metadata } from "next";
import { AssessmentQuiz } from "@/components/assessment-quiz";
import { BookingCard } from "@/components/booking-card";
import { consultationFeeInr } from "@/lib/config";
import { formatInr } from "@/lib/lead";
import { Icon } from "@/components/icons";
import { PageEffects } from "@/components/page-effects";
import { Dock, Faq, LEGAL_NAME, SiteNav, SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_HREF } from "@/components/site-chrome";
import { faqJsonLd, JsonLd } from "@/components/json-ld";

// Rendered at build time from CONSULTATION_FEE_INR; rebuild after changing it.
const FEE_INR = consultationFeeInr();
const FEE = formatInr(FEE_INR);

export const metadata: Metadata = {
  title: "PCOS & PCOD Consultation",
  description:
    "A 1-on-1 consultation with an MBBS/MD doctor and a plan personalised to your PCOS or PCOD history. Take the free 2-minute assessment.",
  alternates: { canonical: "/pcos" },
  openGraph: {
    title: "PCOS & PCOD Consultation — LifelineX",
    description: "Doctor-led, personalised PCOS and PCOD care. Take the free 2-minute assessment.",
    images: ["/assets/hero-conversation.jpg"],
  },
};

const COMPARE = [
  ["Your plan", "Same diet chart for everyone", "A defined protocol — built around your case, not a template"],
  ["Guidance", "Content you have to figure out alone", "A real conversation with a doctor who listens"],
  ["Products", "One-size-fits-all supplements", "Specific products and steps, matched to what you're actually experiencing"],
  ["Questions", "No one to ask follow-up questions to", "Direct access to your doctor during your consultation"],
];

const STEPS = [
  ["Take a 2-minute assessment", "A few questions about your cycle, symptoms and goals."],
  ["Book a call with a doctor (MBBS/MD)", `Pay the ${FEE} consultation fee, then pick a time that suits you.`],
  ["Your doctor reviews your history and builds your plan", "Medication, supplements or lifestyle steps — whatever fits your case."],
  ["Get your plan, with ongoing support", "Most plans arrive within 2–4 hours of your consultation."],
];

const FAQ = [
  { q: "Is this a diagnosis?", a: "The online assessment itself isn't a diagnosis — it just gives your doctor context before your call. The consultation is a real medical consultation: your doctor can diagnose your condition and prescribe medication, supplements or a personalised treatment plan, and will advise if in-person testing or a specialist referral is needed." },
  { q: "What happens on the call?", a: "Your doctor reviews your assessment answers and asks follow-up questions about your history, symptoms and goals, then explains what a personalised plan would involve for you." },
  { q: "Is the consultation fee refundable?", a: "The consultation fee is non-refundable. If you choose to go ahead with your personalised plan, the full fee is adjusted against it — no extra charge." },
  { q: "How soon do I get my plan after the call?", a: "Most plans are delivered within 2–4 hours of your consultation." },
  { q: "Is my information kept private?", a: "Yes. Your assessment answers and consultation details are used only to build your plan and are not shared outside our clinical team." },
];

export default function PcosPage() {
  return (
    <>
      <SiteNav
        links={[
          { href: "#how-it-works", label: "How it works" },
          { href: "#doctors", label: "Doctors" },
          { href: "#book", label: "Pricing" },
          { href: "#faq", label: "FAQ" },
        ]}
        cta={{ href: "#assessment", label: "Free assessment" }}
      />

      <main id="main">
        <section className="hero" id="top">
          <div className="container hero__grid">
            <div className="hero__copy">
              <span className="eyebrow">PCOS · PCOD care</span>
              <h1 className="display-xl">
                A doctor-led, personal path to understanding <em className="accent">your</em> PCOS &amp; PCOD
              </h1>
              <p className="lede">
                A 1-on-1 consultation with an MBBS/MD doctor, followed by a plan personalised to your history — not a generic chart everyone else got too.
              </p>
              <div className="hero__actions">
                <a className="btn btn--primary" href="#assessment">
                  Take the 2-minute assessment <Icon name="arrow" />
                </a>
                <a className="textlink" href="#how-it-works">
                  See how it works
                </a>
              </div>
              <ul className="hero__assure">
                <li><Icon name="check" size={16} />Free to start</li>
                <li><Icon name="check" size={16} />About 2 minutes</li>
                <li><Icon name="check" size={16} />No payment until you book</li>
              </ul>
            </div>
            <figure className="hero__media">
              <img src="/assets/hero-conversation.webp" alt="Two women walking together outdoors, in conversation" width={1400} height={933} fetchPriority="high" />
              <div className="hero__note">
                <span className="hero__note-mark"><Icon name="clock" /></span>
                <p>
                  <strong>Plan in 2–4 hours</strong>
                  Most plans are delivered within hours of your consultation.
                </p>
              </div>
            </figure>
          </div>
        </section>

        <section className="facts" aria-label="At a glance">
          <div className="container">
            <dl>
              <div><dt>MBBS / MD</dt><dd>Qualified doctors lead every consultation</dd></div>
              <div><dt>1-on-1</dt><dd>A real conversation — not an influencer-made program</dd></div>
              <div><dt>{FEE}</dt><dd>One-time consultation fee</dd></div>
            </dl>
          </div>
        </section>

        <section className="section heard">
          <div className="container heard__grid">
            <div className="heard__intro reveal">
              <span className="eyebrow">Sound familiar?</span>
              <h2 className="display-l">You&apos;ve probably heard this before…</h2>
              <p className="lede">
                Many people looking for PCOS or PCOD support say the same thing: the advice they get doesn&apos;t fit their actual life, history, or body.
              </p>
            </div>
            <ol className="heard__list" id="heard-list">
              {[
                "“Here's a diet chart — this works for everyone.”",
                "“Just lose some weight, it'll sort itself out.”",
                "“Come back in three months if it hasn't improved.”",
              ].map((quote, i) => (
                <li key={quote}>
                  <span className="heard__num">0{i + 1}</span>
                  <p className="heard__quote"><span>{quote}</span></p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section compare" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="compare__head reveal">
              <span className="eyebrow">A different approach</span>
              <h2 className="display-l">Same problem, two very different approaches</h2>
            </div>
            <div className="compare__table reveal" role="table" aria-label="The usual way compared with LifelineX">
              <div className="compare__row compare__row--head" role="row">
                <span role="columnheader" />
                <span role="columnheader">The usual way</span>
                <span role="columnheader" className="is-us">With LifelineX</span>
              </div>
              {COMPARE.map(([topic, old, ours]) => (
                <div className="compare__row" role="row" key={topic}>
                  <span className="compare__topic" role="rowheader">{topic}</span>
                  <span className="compare__old" role="cell"><Icon name="x" size={16} />{old}</span>
                  <span className="compare__new" role="cell"><Icon name="check" size={16} />{ours}</span>
                </div>
              ))}
            </div>
            <p className="compare__foot reveal">
              PCOS and PCOD show up differently for everyone — irregular cycles, skin changes, weight shifts, fertility concerns, or all of the above. A plan that ignores that isn&apos;t really a plan. That&apos;s why we start with a conversation, not a checklist.
            </p>
          </div>
        </section>

        <section className="section on-night" id="how-it-works">
          <div className="container how__grid">
            <div className="reveal">
              <span className="eyebrow">How it works</span>
              <h2 className="display-l" style={{ marginTop: 16 }}>
                From a 2-minute assessment to a plan <em className="accent">built for you</em>
              </h2>
              <ol className="how__steps">
                {STEPS.map(([title, desc], i) => (
                  <li key={title}>
                    <span className="how__n">{i + 1}</span>
                    <div>
                      <p className="title">{title}</p>
                      <p className="small">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <figure className="how__media reveal">
              <img src="/assets/consult-call.webp" alt="A woman at her dining table on a video consultation, taking notes beside a cup of chai" width={1400} height={940} loading="lazy" />
              <figcaption>Hundreds of women have already taken this assessment.</figcaption>
            </figure>
          </div>
        </section>

        <section className="section assess" id="assessment">
          <div className="container assess__grid">
            <aside className="assess__aside">
              <span className="eyebrow">Free · about 2 minutes</span>
              <h2 className="display-l">Start your assessment</h2>
              <p className="lede">A few quick questions about your cycle, symptoms and goals — so your doctor already has context before your call.</p>
              <ul className="assess__topics" aria-label="Topics covered">
                <li>Cycle</li><li>Symptoms</li><li>History</li><li>Goals</li><li>Energy &amp; sleep</li>
              </ul>
              <img className="assess__img" src="/assets/planner.webp" alt="Hands marking days in a paper planner beside a glass of water" width={960} height={1200} loading="lazy" />
            </aside>
            <div>
              <AssessmentQuiz fee={FEE_INR} />
              <p className="quiz__skip">
                Prefer to skip ahead? <a href="#book">Book directly</a>
              </p>
            </div>
          </div>
        </section>

        <section className="section doctors" id="doctors">
          <div className="container doctors__grid">
            <div className="doctors__intro reveal">
              <span className="eyebrow">Our doctors</span>
              <h2 className="display-l">Backed by real medical expertise</h2>
              <p className="lede">MBBS, MD-qualified doctors with years of combined clinical experience, specialising in hormonal and metabolic health.</p>
              <ul className="doctors__creds">
                <li><Icon name="check" />MBBS, MD verified</li>
                <li><Icon name="check" />5,000+ consultations completed</li>
                <li><Icon name="check" />1-on-1, not an influencer-made program</li>
              </ul>
            </div>
            <figure className="pullquote reveal">
              <span className="pullquote__mark" aria-hidden="true">“</span>
              <blockquote>Every plan is reviewed and built by a licensed doctor — never an algorithm, never a generic template.</blockquote>
              <figcaption>The LifelineX clinical team</figcaption>
            </figure>
          </div>
        </section>

        <section className="section expect">
          <div className="container expect__grid">
            <figure className="expect__media reveal">
              <img src="/assets/hero-kitchen.webp" alt="Woman preparing fresh vegetables in her kitchen" width={1400} height={933} loading="lazy" />
            </figure>
            <div className="expect__copy reveal">
              <span className="eyebrow">Your consultation</span>
              <h2 className="display-l">What to expect</h2>
              <ol className="checklist">
                <li><div><strong>A real conversation, not a script</strong>Your doctor asks about your history, symptoms and goals.</div></li>
                <li><div><strong>Your history reviewed before any recommendation</strong>Nothing is suggested until your case is understood.</div></li>
                <li><div><strong>A plan you can realistically start the same week</strong>Practical steps that fit around your life.</div></li>
              </ol>
            </div>
          </div>
        </section>

        <section className="section pricing" id="book" style={{ paddingTop: 0 }}>
          <div className="container pricing__grid">
            <div className="pricing__copy reveal">
              <span className="eyebrow">Pricing</span>
              <h2 className="display-l">Simple, transparent pricing</h2>
              <p className="lede">One consultation fee. If you continue with your personalised plan, the full {FEE} is adjusted against it — no extra charge.</p>
              <p className="small">After you book, we email your Google Meet link for the video consultation.</p>
            </div>
            <div className="price">
              <span className="price__label">Consultation fee</span>
              <div className="price__amount"><strong>{FEE}</strong><span>one-time</span></div>
              <ul className="price__list">
                <li><Icon name="check" size={16} />1-on-1 call with an MBBS/MD doctor</li>
                <li><Icon name="check" size={16} />Personalised plan built from your history</li>
                <li><Icon name="check" size={16} /><span><strong>Fully adjusted against your plan</strong> if you continue</span></li>
              </ul>
              <BookingCard fee={FEE_INR} />
              <p className="price__fine">Non-refundable if you choose not to continue with a plan.</p>
            </div>
          </div>
        </section>

        <section className="section faq" id="faq">
          <div className="container faq__grid">
            <div className="faq__intro">
              <span className="eyebrow">FAQ</span>
              <h2 className="display-l">Questions, answered</h2>
              <p className="small">Something else on your mind? Ask your doctor on the call — that&apos;s what it&apos;s for.</p>
            </div>
            <Faq items={FAQ} />
          </div>
          <JsonLd data={faqJsonLd(FAQ)} />
        </section>

        <section className="section--tight on-night final">
          <div className="container final__inner">
            <div className="final__copy">
              <h2 className="display-l">
                Ready for a plan that&apos;s actually <em className="accent">built for you</em>?
              </h2>
              <p className="lede">No obligation to buy anything after your call.</p>
            </div>
            <a className="btn btn--primary" href="#book">
              Book your consultation — {FEE} <Icon name="arrow" />
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer__top">
            <Link href="/"><img src="/assets/logo-horizontal.svg" alt="LifelineX home" width={115} height={22} /></Link>
            <nav className="footer__links" aria-label="Footer">
              <Link href="/">All health concerns</Link>
              <a href="#book">Pricing</a>
              <a href="#faq">FAQ</a>
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              <a href={SUPPORT_PHONE_HREF}>{SUPPORT_PHONE_DISPLAY}</a>
            </nav>
          </div>
          <p>
            LifelineX connects you with a licensed doctor (MBBS/MD) for an online consultation. Based on that consultation, your doctor may prescribe medication, supplements or a personalised treatment plan, with digital follow-up support. This is a telemedicine service — your doctor will advise if an in-person examination or specialist referral is needed. If you are experiencing a medical emergency, contact your local emergency services immediately.
          </p>
          <p>© 2026 LifelineX. Operated by {LEGAL_NAME}. All rights reserved.</p>
        </div>
      </footer>

      <Dock title="Doctor consultation" detail={FEE} href="#assessment" label="Start" />
      <PageEffects hideDockOn="assessment,book" />
    </>
  );
}
