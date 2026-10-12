"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import {
  formatInr,
  isValidEmail,
  isValidName,
  isValidPhone,
  normalizeEmail,
  LEAD_STORAGE_KEY,
  PAID_ORDER_STORAGE_KEY,
  type LeadDraft,
} from "@/lib/lead";

type CashfreeCheckout = {
  checkout: (options: { paymentSessionId: string; redirectTarget: "_self" }) => Promise<void>;
};

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => CashfreeCheckout;
  }
}

function readLead(): LeadDraft | null {
  const raw = sessionStorage.getItem(LEAD_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LeadDraft;
    if (!parsed?.name || !parsed?.phone) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadCashfree(mode: "sandbox" | "production") {
  return new Promise<CashfreeCheckout>((resolve, reject) => {
    if (window.Cashfree) {
      resolve(window.Cashfree({ mode }));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      if (!window.Cashfree) {
        reject(new Error("Cashfree checkout could not be loaded."));
        return;
      }
      resolve(window.Cashfree({ mode }));
    };
    script.onerror = () => reject(new Error("Cashfree checkout could not be loaded."));
    document.body.appendChild(script);
  });
}

export function BookingCard({ fee, inline = false }: { fee: number; inline?: boolean }) {
  const [lead, setLead] = useState<LeadDraft | null>(() => (typeof window !== "undefined" ? readLead() : null));
  const [paidOrder, setPaidOrder] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sync = () => {
      const next = readLead();
      setLead(next);
      if (next) {
        setName(next.name);
        setPhone(next.phone);
        setEmail(next.email ?? "");
        setEditing(false);
      }
    };
    sync();
    try {
      setPaidOrder(localStorage.getItem(PAID_ORDER_STORAGE_KEY));
    } catch {
      // Storage blocked; nothing to restore.
    }
    window.addEventListener("llx-lead", sync);
    return () => window.removeEventListener("llx-lead", sync);
  }, []);

  async function pay() {
    setError("");
    if (!isValidName(name) || !isValidPhone(phone) || !isValidEmail(email)) {
      if (lead) setEditing(true);
      setError("Enter your name, email and a valid 10-digit mobile number to pay.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: normalizeEmail(email),
          assessmentId: lead?.assessmentId,
          website,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        paymentSessionId?: string;
        mode?: "sandbox" | "production";
      };
      if (!response.ok || !data.paymentSessionId) {
        throw new Error(data.error || "Payment could not be started.");
      }
      const cashfree = await loadCashfree(data.mode === "production" ? "production" : "sandbox");
      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be started.");
      setLoading(false);
    }
  }

  const leadComplete = lead && isValidName(lead.name) && isValidPhone(lead.phone) && isValidEmail(lead.email ?? "");
  const showFields = !lead || editing;
  const showEmailOnly = !!lead && !editing && isValidName(lead.name) && isValidPhone(lead.phone) && !isValidEmail(lead.email ?? "");

  return (
    <div className={`booking${inline ? " booking--inline" : ""}`}>
      {paidOrder && (
        <a className="booking__as" href={`/booking/${encodeURIComponent(paidOrder)}`}>
          <span>
            <strong>Already paid?</strong> Pick or manage your consultation time
          </span>
          <Icon name="arrow" />
        </a>
      )}
      {/* Honeypot for bots; hidden from people and assistive tech. */}
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
      {showFields && !showEmailOnly ? (
        <>
          <div className="field">
            <label htmlFor="book-name">Your name</label>
            <div className="field__control">
              <input id="book-name" autoComplete="name" placeholder="e.g. Ananya Sharma" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="book-phone">Phone number</label>
            <div className="field__control">
              <span className="field__prefix">+91</span>
              <input
                id="book-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="book-email">Email</label>
            <div className="field__control">
              <input
                id="book-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        </>
      ) : showEmailOnly ? (
        <div className="field">
          <label htmlFor="book-email">Email</label>
          <div className="field__control">
            <input
              id="book-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
      ) : (
        !inline && (
          <div className="booking__as">
            <span>
              Booking for <strong>{lead?.name}</strong>
            </span>
            <button type="button" onClick={() => setEditing(true)}>
              Change
            </button>
          </div>
        )
      )}

      {error && (
        <p className="alert" role="alert">
          <Icon name="alert" size={18} style={{ flex: "none", marginTop: 1 }} />
          {error}
        </p>
      )}

      <button type="button" className="btn btn--primary btn--block" onClick={pay} disabled={loading} aria-busy={loading}>
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Opening secure checkout…
          </>
        ) : (
          <>
            {inline && leadComplete ? (
              <>Pay {formatInr(fee)} &amp; pick a time <Icon name="arrow" /></>
            ) : (
              <>Pay {formatInr(fee)} &amp; book <Icon name="arrow" /></>
            )}
          </>
        )}
      </button>
      <p className="booking__secure">
        <Icon name="lock" size={14} />
        Secure checkout by Cashfree. You&apos;ll pick a time after payment — we&apos;ll email your Google Meet link.
      </p>
    </div>
  );
}
