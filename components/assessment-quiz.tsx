"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { BookingCard } from "@/components/booking-card";
import { Icon } from "@/components/icons";
import { labelFor, QUESTIONS, SYMPTOMS } from "@/lib/assessment-questions";
import {
  cleanName,
  isValidEmail,
  isValidName,
  isValidPhone,
  LEAD_STORAGE_KEY,
  normalizeEmail,
  type LeadDraft,
} from "@/lib/lead";

// Steps: 0 details, 1 single, 2 symptoms (multi), 3–10 single, 11 result.
const RESULT_STEP = 11;
const QUESTION_COUNT = 11;

function publishLead(lead: LeadDraft) {
  sessionStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(lead));
  window.dispatchEvent(new Event("llx-lead"));
}

export function AssessmentQuiz({ fee }: { fee: number }) {
  const [step, setStep] = useState(0);
  const [back, setBack] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [website, setWebsite] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [multiError, setMultiError] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const moved = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  // After the person moves between steps, keep the card in view and put focus on the new question.
  useEffect(() => {
    if (!moved.current) return;
    const card = cardRef.current;
    if (card) {
      const top = card.getBoundingClientRect().top;
      if (top < 60 || top > window.innerHeight * 0.6) card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function go(next: number) {
    moved.current = true;
    setBack(next < step);
    setPicked(null);
    setStep(next);
  }

  function startQuiz(event: FormEvent) {
    event.preventDefault();
    const nameOk = isValidName(name);
    const phoneOk = isValidPhone(phone);
    const emailOk = isValidEmail(email);
    setNameError(!nameOk);
    setPhoneError(!phoneOk);
    setEmailError(!emailOk);
    setConsentError(!consent);
    if (!nameOk) return nameRef.current?.focus();
    if (!phoneOk) return phoneRef.current?.focus();
    if (!emailOk) return emailRef.current?.focus();
    if (!consent) return consentRef.current?.focus();
    go(1);
  }

  function selectAnswer(current: number, value: string) {
    if (picked) return;
    const nextAnswers = { ...answers, [String(current)]: value };
    setAnswers(nextAnswers);
    setPicked(value);
    // A short pause so the selection visibly lands before the next question.
    timer.current = window.setTimeout(() => {
      if (current === 10) void finish(nextAnswers, symptoms);
      else go(current + 1);
    }, 260);
  }

  function toggleMulti(key: string) {
    setMultiError(false);
    setSymptoms((current) => {
      if (current.includes(key)) return current.filter((item) => item !== key);
      if (key === "none") return ["none"];
      return [...current.filter((item) => item !== "none"), key];
    });
  }

  function continueMulti() {
    if (!symptoms.length) {
      setMultiError(true);
      return;
    }
    go(3);
  }

  async function finish(nextAnswers: Record<string, string>, nextSymptoms: string[]) {
    go(RESULT_STEP);
    const lead: LeadDraft = {
      name: cleanName(name),
      phone: phone.trim(),
      email: normalizeEmail(email) ?? undefined,
    };
    publishLead(lead);
    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          phone: lead.phone,
          answers: nextAnswers,
          symptoms: nextSymptoms,
          consent,
          website,
        }),
      });
      const data = (await response.json()) as { id?: string };
      if (response.ok && data.id) publishLead({ ...lead, assessmentId: data.id });
    } catch {
      // Booking can still continue with the name and phone saved in this browser.
    }
  }

  // A–E picks an answer on single-choice steps while the quiz has focus.
  function onKeyDown(event: React.KeyboardEvent) {
    const q = QUESTIONS[step];
    if (!q || event.metaKey || event.ctrlKey || event.altKey) return;
    if ((event.target as HTMLElement).tagName === "INPUT") return;
    const i = event.key.toUpperCase().charCodeAt(0) - 65;
    if (event.key.length === 1 && i >= 0 && i < q.options.length) {
      event.preventDefault();
      selectAnswer(step, q.options[i][0]);
    }
  }

  const firstName = name.trim().split(/\s+/)[0];
  const question = QUESTIONS[step];
  const progress = Math.round((step / RESULT_STEP) * 100);
  const stepClass = `quiz__step${back ? " is-back" : ""}`;

  const symptomSummary = symptoms.includes("none")
    ? "None noted"
    : symptoms.map((key) => SYMPTOMS.find(([k]) => k === key)?.[1]).filter(Boolean).join(", ");
  const recap = [
    ["Cycle", labelFor(1, answers["1"])],
    ["Noticed", symptomSummary],
    ["Main goal", labelFor(4, answers["4"])],
    ["Day-to-day impact", labelFor(10, answers["10"])],
  ].filter(([, value]) => value);

  return (
    <div className="quiz" id="quiz-card" ref={cardRef} onKeyDown={onKeyDown}>
      <div className="quiz__bar">
        <button type="button" className="quiz__back" hidden={step === 0} onClick={() => step > 0 && go(step - 1)}>
          <Icon name="back" size={16} />
          Back
        </button>
        <span className="quiz__count" aria-live="polite">
          {step === RESULT_STEP ? "Complete" : `Step ${step + 1} of ${QUESTION_COUNT}`}
        </span>
      </div>
      <div className="quiz__progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="quiz__body">
        {step === 0 && (
          <div className={stepClass} key="details">
            <h3 className="quiz__q" tabIndex={-1} ref={headingRef}>
              Let&apos;s start with your details
            </h3>
            <p className="quiz__hint">So your doctor knows who they&apos;re speaking with.</p>
            <form onSubmit={startQuiz} noValidate className="stack" style={{ gap: 16, marginTop: 8 }}>
              <div className={`field${nameError ? " is-invalid" : ""}`}>
                <label htmlFor="quiz-name">Your name</label>
                <div className="field__control">
                  <input
                    id="quiz-name"
                    ref={nameRef}
                    autoComplete="name"
                    placeholder="e.g. Ananya Sharma"
                    value={name}
                    aria-invalid={nameError}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameError(false);
                    }}
                  />
                </div>
                <span className="field__error">Please enter your full name.</span>
              </div>
              <div className={`field${phoneError ? " is-invalid" : ""}`}>
                <label htmlFor="quiz-phone">Phone number</label>
                <div className="field__control">
                  <span className="field__prefix">+91</span>
                  <input
                    id="quiz-phone"
                    ref={phoneRef}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                    value={phone}
                    aria-invalid={phoneError}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneError(false);
                    }}
                  />
                </div>
                <span className="field__error">Please enter a valid 10-digit mobile number.</span>
              </div>
              <div className={`field${emailError ? " is-invalid" : ""}`}>
                <label htmlFor="quiz-email">Email</label>
                <div className="field__control">
                  <input
                    id="quiz-email"
                    ref={emailRef}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    aria-invalid={emailError}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(false);
                    }}
                  />
                </div>
                <span className="field__error">Please enter a valid email address.</span>
              </div>
              <label className={`consent${consentError ? " is-invalid" : ""}`}>
                <input
                  ref={consentRef}
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    setConsentError(false);
                  }}
                />
                <span>
                  I agree to share my answers with the LifelineX clinical team so a doctor can review them before my consultation.
                </span>
              </label>
              {consentError && <p className="form-error is-on">Please tick the box to continue.</p>}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                style={{ position: "absolute", left: "-10000px", width: 1, height: 1, opacity: 0 }}
              />
              <div className="quiz__foot">
                <button type="submit" className="btn btn--dark btn--block">
                  Continue <Icon name="arrow" />
                </button>
                <p className="privacy">
                  <Icon name="lock" size={14} />
                  Used only by our clinical team to arrange your consultation.
                </p>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className={stepClass} key="symptoms">
            <h3 className="quiz__q" tabIndex={-1} ref={headingRef}>
              Which of these have you noticed?
            </h3>
            <p className="quiz__hint">Select all that apply</p>
            <div className="quiz__options quiz__options--2" role="group" aria-label="Symptoms">
              {SYMPTOMS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="checkbox"
                  className="option"
                  aria-checked={symptoms.includes(key)}
                  onClick={() => toggleMulti(key)}
                >
                  <span className="option__box" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24">
                      <path d="M4.5 12.5l4.5 4.5L19.5 6.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {label}
                </button>
              ))}
            </div>
            <p className={`form-error${multiError ? " is-on" : ""}`} role="alert">
              Please select at least one option.
            </p>
            <div className="quiz__foot">
              <button type="button" className="btn btn--dark btn--block" onClick={continueMulti}>
                Continue <Icon name="arrow" />
              </button>
            </div>
          </div>
        )}

        {question && (
          <div className={stepClass} key={`q${step}`}>
            <h3 className="quiz__q" tabIndex={-1} ref={headingRef}>
              {question.title}
            </h3>
            <div className={`quiz__options${question.cols === 2 ? " quiz__options--2" : ""}`} role="group" aria-label={question.title}>
              {question.options.map(([value, label], i) => (
                <button
                  key={value}
                  type="button"
                  className="option"
                  aria-pressed={(picked ?? answers[String(step)]) === value}
                  onClick={() => selectAnswer(step, value)}
                >
                  <span className="option__key" aria-hidden="true">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === RESULT_STEP && (
          <div className={`${stepClass} result`} key="result">
            <span className="result__mark" aria-hidden="true">
              <Icon name="check" size={22} />
            </span>
            <h3 className="quiz__q" tabIndex={-1} ref={headingRef}>
              {firstName ? `${firstName}’s assessment is ready` : "Your assessment is ready"}
            </h3>
            <p className="small" style={{ fontSize: 15 }}>
              Based on your answers, the right next step is a 1-on-1 consultation with an MBBS/MD doctor, so your plan is built around your actual history — not a generic template.
            </p>
            {recap.length > 0 && (
              <dl className="recap">
                {recap.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="quiz__foot">
              <BookingCard fee={fee} inline />
              <p className="price__fine" style={{ textAlign: "center" }}>
                Fully adjusted against your plan if you continue. Non-refundable otherwise.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
