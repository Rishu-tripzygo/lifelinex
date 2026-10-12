import Link from "next/link";
import type { Metadata } from "next";
import { consultationFeeInr } from "@/lib/config";
import { formatInr } from "@/lib/lead";
import { Icon, type IconName } from "@/components/icons";
import { PageEffects } from "@/components/page-effects";
import {
  DISCLAIMER,
  Dock,
  Faq,
  SiteNav,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_HREF,
} from "@/components/site-chrome";
import { faqJsonLd, JsonLd } from "@/components/json-ld";

// Rendered at build time from CONSULTATION_FEE_INR; rebuild after changing it.
const FEE_INR = consultationFeeInr();
const FEE = formatInr(FEE_INR);

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

type Concern = { title: string; desc: string; icon: IconName; href?: string };

const GROUPS: { label: string; items: Concern[] }[] = [
  {
    label: "Women's & hormonal health",
    items: [
      { title: "PCOS / PCOD", desc: "Irregular cycles, hormonal symptoms and related concerns.", icon: "cycle", href: "/pcos" },
      { title: "Thyroid health", desc: "Fatigue, weight shifts and metabolism-related symptoms.", icon: "thyroid" },
      { title: "Fertility-related health", desc: "Support for conception planning and related concerns.", icon: "heart" },
    ],
  },
  {
    label: "Metabolic health",
    items: [
      { title: "Weight & metabolic health", desc: "A structured, doctor-guided approach to weight and metabolism.", icon: "chart" },
      { title: "Type 2 diabetes support", desc: "Ongoing guidance for blood sugar and lifestyle management.", icon: "drop" },
    ],
  },
  {
    label: "Other health concerns",
    items: [
      { title: "Hair & skin concerns", desc: "Hair thinning, acne and related skin changes.", icon: "leaf" },
      { title: "Autoimmune conditions", desc: "Guidance for chronic, immune-related health concerns.", icon: "shield" },
      { title: "Cancer & supportive care", desc: "Supportive care for people living with cancer, and concerns that need a broader, ongoing plan.", icon: "care" },
    ],
  },
];

const STEPS = [
  ["Choose your concern", "Select the health area that best matches what you're experiencing."],
  ["Complete your assessment", "Share relevant symptoms, history and concerns through a private digital assessment."],
  ["Consult a doctor", `Pay ${FEE} and book your online consultation. You'll be connected with a qualified doctor after booking.`],
  ["Choose your next step", "Review your doctor's recommendations and decide whether to proceed with diagnostics, a protocol or continued support."],
];

const WHY = [
  ["Condition-focused assessments", "Each assessment is built around the specific concern you're dealing with — not a generic questionnaire."],
  ["Qualified doctor consultations", "Every consultation is with a qualified doctor (MBBS/MD) — never an algorithm or a call-centre script."],
  ["A clear digital journey", "Assessment, consultation and next steps — all in one place, without confusing back-and-forth."],
  ["Optional continued support", "Diagnostics, protocols and follow-up are offered only if relevant, and always your choice."],
];

const FAQ = [
  { q: "What is LifelineX?", a: "LifelineX is a doctor-led online platform that helps you understand a health concern, consult a qualified doctor, and decide on an appropriate next step." },
  { q: "How does the online consultation work?", a: "After your assessment, you pay the consultation fee and book a time online. You'll then be connected with a qualified doctor for your consultation." },
  { q: `What is included in the ${FEE} consultation?`, a: `The ${FEE} fee covers your assessment review and a 1-on-1 consultation with a qualified doctor.` },
  { q: `Are diagnostic tests included in ${FEE}?`, a: "No. If your doctor recommends diagnostic tests, these are arranged and charged separately." },
  { q: "Are protocols or products included in the consultation price?", a: "No. Any recommended protocol, product or supplement is offered separately, and only if relevant to you." },
  { q: "How is a doctor assigned?", a: "Doctors are assigned based on availability and the health concern you've chosen. All LifelineX doctors are qualified (MBBS/MD)." },
  { q: "Can I choose not to purchase a protocol?", a: "Yes. The consultation gives you your doctor's recommendations — deciding whether to proceed with anything further is entirely up to you." },
  { q: "How do I join my consultation?", a: "After you book a time, we email you a Google Meet link for your video call. You can also join from your booking page." },
  { q: "Is LifelineX suitable for emergencies?", a: "No. LifelineX is not an emergency service." },
  { q: "What should I do if I need urgent medical attention?", a: "Please contact your local emergency services or visit the nearest hospital immediately. Do not wait for an online consultation." },
];

function ConcernCard({ c }: { c: Concern }) {
  const body = (
    <>
      <span className="concern__icon">
        <Icon name={c.icon} size={20} />
      </span>
      <h3 className="concern__title">{c.title}</h3>
      <p className="concern__desc">{c.desc}</p>
      <div className="concern__foot">
        <span className="concern__status">{c.href ? "Available now" : "Coming soon"}</span>
        {c.href && (
          <span className="concern__go">
            <Icon name="arrow" />
          </span>
        )}
      </div>
    </>
  );
  return c.href ? (
    <Link className="concern concern--live" href={c.href} aria-label={`${c.title} — start here`}>
      {body}
    </Link>
  ) : (
    <div className="concern concern--soon" aria-disabled="true">
      {body}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <SiteNav
        links={[
          { href: "#concerns", label: "Health concerns" },
          { href: "#how-it-works", label: "How it works" },
          { href: "#why", label: "Why LifelineX" },
          { href: "#doctors", label: "Doctors" },
          { href: "#faq", label: "FAQ" },
        ]}
        cta={{ href: "#concerns", label: "Start assessment" }}
      />

      <main id="main">
        <section className="hero" id="top">
          <div className="container hero__grid">
            <div className="hero__copy">
              <span className="eyebrow">Doctor-led online care</span>
              <h1 className="display-xl">
                Find the right <em className="accent">next step</em> for your health
              </h1>
              <p className="lede">
                Start with a structured assessment and consult a qualified doctor online for hormonal, metabolic and complex health concerns.
              </p>
              <div className="hero__actions">
                <a className="btn btn--primary" href="#concerns">
                  Choose your health concern <Icon name="arrow" />
                </a>
                <a className="textlink" href="#how-it-works">
                  See how it works
                </a>
              </div>
              <ul className="hero__assure">
                <li><Icon name="check" size={16} />Private assessment</li>
                <li><Icon name="check" size={16} />Online consultation</li>
                <li><Icon name="check" size={16} />{FEE}, shown upfront</li>
              </ul>
            </div>
            <figure className="hero__media">
              <img
                src="/assets/consult-call.webp"
                alt="A woman at her dining table on a video consultation, taking notes beside a cup of chai"
                width={1400}
                height={940}
                fetchPriority="high"
                style={{ objectPosition: "28% center" }}
              />
              <div className="hero__note">
                <span className="hero__note-mark"><Icon name="steth" /></span>
                <p>
                  <strong>Nothing added automatically</strong>
                  Diagnostics, protocols and continued support are separate, and always your choice.
                </p>
              </div>
            </figure>
          </div>
        </section>

        <section className="section" id="concerns" style={{ paddingTop: "var(--space-8)" }}>
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Start here</span>
              <h2 className="display-l">What would you like help with?</h2>
              <p className="lede">Choose the concern closest to what you&apos;re experiencing — we&apos;ll guide you to the right assessment.</p>
            </div>
            {GROUPS.map((group) => (
              <div className="concerns__group reveal" key={group.label}>
                <h3 className="concerns__label">{group.label}</h3>
                <div className="concerns__grid">
                  {group.items.map((c) => (
                    <ConcernCard key={c.title} c={c} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section on-night" id="how-it-works">
          <div className="container how__grid" style={{ alignItems: "start" }}>
            <div className="reveal stack" style={{ gap: "var(--space-4)" }}>
              <span className="eyebrow">How it works</span>
              <h2 className="display-l">
                Four steps, and you <em className="accent">decide</em> every one
              </h2>
              <p className="lede">From choosing a concern to deciding what to do next, the process is short, private and doctor-led.</p>
            </div>
            <ol className="how__steps reveal" style={{ marginTop: 0 }}>
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
        </section>

        <section className="section" id="why">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Why LifelineX</span>
              <h2 className="display-l">Care that starts with your concern, not a template</h2>
            </div>
            <ol className="points reveal">
              {WHY.map(([title, desc], i) => (
                <li key={title}>
                  <span className="points__n">0{i + 1}</span>
                  <div>
                    <p className="title">{title}</p>
                    <p className="small" style={{ fontSize: 15 }}>{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section faq" style={{ borderTop: 0 }}>
          <div className="container expect__grid">
            <figure className="expect__media reveal">
              <img src="/assets/planner.webp" alt="Hands marking days in a paper planner beside a glass of water" width={960} height={1200} loading="lazy" style={{ aspectRatio: "4/5", objectPosition: "center 70%" }} />
            </figure>
            <div className="expect__copy reveal">
              <span className="eyebrow">After your consultation</span>
              <h2 className="display-l">What happens next</h2>
              <p className="lede">Your doctor reviews your assessment and consultation, then lets you know what would genuinely help. Depending on your situation, that might include:</p>
              <ul className="ticks">
                <li><Icon name="check" size={16} />Recommended diagnostic tests</li>
                <li><Icon name="check" size={16} />A structured health protocol</li>
                <li><Icon name="check" size={16} />Educational guidance for your specific concern</li>
                <li><Icon name="check" size={16} />Relevant products, supplements or ongoing support, where appropriate</li>
              </ul>
              <p className="small">Recommendations vary from person to person, and you decide whether to go ahead with any additional paid offering — nothing is added automatically.</p>
            </div>
          </div>
        </section>

        <section className="section doctors" id="doctors">
          <div className="container doctors__grid">
            <div className="doctors__intro reveal">
              <span className="eyebrow">Our doctors</span>
              <h2 className="display-l">Doctor-led, every time</h2>
              <p className="lede">
                LifelineX consultations are conducted by qualified doctors (MBBS/MD). Doctors are assigned based on availability and your specific concern, so we don&apos;t tie the experience to a single doctor&apos;s profile.
              </p>
              <ul className="doctors__creds">
                <li><Icon name="check" />MBBS / MD verified</li>
                <li><Icon name="check" />1-on-1 — not an influencer-made program</li>
                <li><Icon name="check" />Matched to your concern</li>
              </ul>
            </div>
            <div className="assigned reveal">
              <span className="assigned__icon"><Icon name="steth" /></span>
              <div>
                <strong>Google Meet link emailed after booking</strong>
                <p>
                  Once you pick a consultation time, we create your Google Meet room and email you the join link. Your doctor&apos;s name and credentials are shared ahead of the call.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container split">
            <div className="stack reveal" style={{ gap: "var(--space-4)" }}>
              <span className="eyebrow">Privacy &amp; choice</span>
              <h2 className="display-l">Built around your privacy and your choice</h2>
            </div>
            <ul className="ticks reveal" style={{ gap: "var(--space-4)", paddingTop: "var(--space-3)" }}>
              <li><Icon name="lock" size={16} />Your assessment answers are kept private and used only to inform your consultation.</li>
              <li><Icon name="check" size={16} />Consultation pricing is shown upfront — {FEE}, nothing hidden.</li>
              <li><Icon name="check" size={16} />You are never automatically enrolled into a protocol or subscription.</li>
              <li><Icon name="check" size={16} />Every additional purchase — diagnostics, protocol or support — is your choice.</li>
            </ul>
          </div>
        </section>

        <section className="section faq" id="faq">
          <div className="container faq__grid">
            <div className="faq__intro">
              <span className="eyebrow">FAQ</span>
              <h2 className="display-l">Questions, answered</h2>
              <p className="small">Not finding what you need? Your doctor can answer anything specific to you on the call.</p>
            </div>
            <Faq items={FAQ} />
          </div>
          <JsonLd data={faqJsonLd(FAQ)} />
        </section>

        <section className="section--tight on-night final">
          <div className="container final__inner">
            <div className="final__copy">
              <h2 className="display-l">
                Your next step can start with <em className="accent">understanding</em>
              </h2>
              <p className="lede">Complete a short assessment and book your online doctor consultation.</p>
            </div>
            <a className="btn btn--primary" href="#concerns">
              Choose your health concern <Icon name="arrow" />
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer__cols">
            <div className="footer__brand">
              <img src="/assets/logo-horizontal.svg" alt="LifelineX" width={115} height={22} />
              <p>{DISCLAIMER}</p>
            </div>
            <div>
              <h3>Health concerns</h3>
              <ul>
                <li><Link href="/pcos">PCOS / PCOD</Link></li>
                <li className="soon">Thyroid health — coming soon</li>
                <li className="soon">Weight &amp; metabolic — coming soon</li>
                <li className="soon">More concerns — coming soon</li>
              </ul>
            </div>
            <div>
              <h3>Contact</h3>
              <ul>
                <li><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
                <li><a href={SUPPORT_PHONE_HREF}>{SUPPORT_PHONE_DISPLAY}</a></li>
                <li className="soon">Mon–Sat, 10am–7pm IST</li>
              </ul>
            </div>
          </div>
          <div className="footer__base">
            <p>© 2026 LifelineX. All rights reserved.</p>
            <p><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> · <a href={SUPPORT_PHONE_HREF}>{SUPPORT_PHONE_DISPLAY}</a></p>
          </div>
        </div>
      </footer>

      <Dock title="Doctor-led consultation" detail={`${FEE} · starts with a free assessment`} href="#concerns" label="Choose" />
      <PageEffects hideDockOn="concerns" />
    </>
  );
}
