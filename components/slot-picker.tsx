"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { trackEvent } from "@/lib/client-analytics";
import { formatDay, formatLongDay, formatTime } from "@/lib/time";

// "Fri, 9 Oct" -> ["Fri", "9 Oct"]
function dayParts(iso: string) {
  const [weekday, ...rest] = formatDay(iso).replace(",", "").split(" ");
  return [weekday, rest.join(" ")];
}

type Slot = { startsAt: string; endsAt: string; remaining: number };
type Day = { date: string; slots: Slot[] };

// Lets a paid customer pick (or change) their consultation time. Admin-only times and
// capacity are enforced again on the server; this is just the picker.
export function SlotPicker({ orderId, current, onDone }: { orderId: string; current?: string; onDone?: () => void }) {
  const router = useRouter();
  const [days, setDays] = useState<Day[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [dayIndex, setDayIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const loadRequest = useRef(0);

  async function load(attempt = 0) {
    const request = ++loadRequest.current;
    setLoadError("");
    try {
      const res = await fetch("/api/slots", { cache: "no-store" });
      const data = (await res.json()) as { days?: Day[]; error?: string };
      if (request !== loadRequest.current) return;
      if (!res.ok || !data.days) {
        if (res.status === 503 && attempt < 2) {
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          if (request !== loadRequest.current) return;
          return load(attempt + 1);
        }
        throw new Error(data.error);
      }
      setDays(data.days);
      setLoadError("");
    } catch (err) {
      if (request !== loadRequest.current) return;
      setLoadError(err instanceof Error && err.message ? err.message : "We couldn't load available times.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function confirm() {
    if (!picked) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, startsAt: picked }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "We couldn't book that time.");
        setPicked(null);
        await load();
        return;
      }
      trackEvent("booking_complete", { condition: "pcos", page_type: "booking" });
      onDone?.();
      router.refresh();
    } catch {
      setError("We couldn't book that time. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <div className="stack" style={{ gap: 12 }}>
        <p className="alert" role="alert"><Icon name="alert" size={18} style={{ flex: "none" }} />{loadError}</p>
        <button type="button" className="btn btn--ghost" onClick={() => void load()}>
          <Icon name="refresh" /> Try again
        </button>
      </div>
    );
  }
  if (!days) return <p className="small" aria-live="polite">Loading available times…</p>;
  if (days.length === 0) {
    return <p className="small">No times are open right now. Please check back soon — new slots open every day.</p>;
  }

  const day = days[Math.min(dayIndex, days.length - 1)];
  return (
    <div className="picker">
      <div className="picker__days" role="tablist" aria-label="Choose a day">
        {days.map((d, i) => (
          <button
            key={d.date}
            type="button"
            role="tab"
            aria-selected={i === dayIndex}
            className="picker__day"
            onClick={() => {
              setDayIndex(i);
              setPicked(null);
            }}
          >
            <span>{dayParts(d.slots[0].startsAt)[0]}</span>
            <strong>{dayParts(d.slots[0].startsAt)[1]}</strong>
          </button>
        ))}
      </div>

      <p className="picker__label">{formatLongDay(day.slots[0].startsAt)} · times in IST</p>
      <div className="picker__slots" role="radiogroup" aria-label="Choose a time">
        {day.slots.map((s) => (
          <button
            key={s.startsAt}
            type="button"
            role="radio"
            aria-checked={picked === s.startsAt}
            className="picker__slot"
            disabled={s.startsAt === current}
            onClick={() => setPicked(s.startsAt)}
          >
            {formatTime(s.startsAt)}
          </button>
        ))}
      </div>

      {error && <p className="alert" role="alert"><Icon name="alert" size={18} style={{ flex: "none" }} />{error}</p>}

      <button type="button" className="btn btn--primary btn--block" disabled={!picked || saving} onClick={() => void confirm()}>
        {saving ? (
          <><span className="spinner" aria-hidden="true" /> Booking…</>
        ) : picked ? (
          <>{current ? "Move to" : "Book"} {formatDay(picked)}, {formatTime(picked)} <Icon name="arrow" /></>
        ) : (
          "Pick a time"
        )}
      </button>
    </div>
  );
}
