"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { formatPhoneInput } from "@/lib/lead";
import { SlotPicker } from "@/components/slot-picker";

export function RescheduleToggle({ orderId, current }: { orderId: string; current: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className="btn btn--ghost" onClick={() => setOpen(true)}>
        Change time
      </button>
    );
  }
  return (
    <div className="stack" style={{ gap: 16, width: "100%" }}>
      <SlotPicker orderId={orderId} current={current} onDone={() => setOpen(false)} />
      <button type="button" className="textlink" style={{ alignSelf: "flex-start" }} onClick={() => setOpen(false)}>
        Keep my current time
      </button>
    </div>
  );
}

export function VerifyPhone({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/bookings/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, phone }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) setError(data.error || "That number doesn't match this booking.");
      else router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="stack" style={{ gap: 14, width: "100%" }} noValidate>
      <div className={`field${error ? " is-invalid" : ""}`}>
        <label htmlFor="verify-phone">Mobile number used at payment</label>
        <div className="field__control">
          <span className="field__prefix">+91</span>
          <input
            id="verify-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              setPhone(formatPhoneInput(e.target.value));
              setError("");
            }}
            onInput={(e) => {
              setPhone(formatPhoneInput(e.currentTarget.value));
              setError("");
            }}
            onBlur={(e) => {
              const next = formatPhoneInput(e.target.value);
              if (next !== phone) setPhone(next);
            }}
          />
        </div>
        <span className="field__error">{error}</span>
      </div>
      <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
        {busy ? <><span className="spinner" aria-hidden="true" /> Checking…</> : <>Open my booking <Icon name="arrow" /></>}
      </button>
    </form>
  );
}
