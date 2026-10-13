"use client";

import { useEffect } from "react";
import { trackEvent, type MarketingEvent } from "@/lib/client-analytics";

export function ConversionTracker({
  event,
  dedupeKey,
  parameters = {},
}: {
  event: Extract<MarketingEvent, "payment_success" | "booking_complete">;
  dedupeKey: string;
  parameters?: Record<string, string | number | boolean>;
}) {
  useEffect(() => {
    const key = `llx-marketing-${event}-${dedupeKey}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Tracking still works when storage is blocked; it may fire again on refresh.
    }
    trackEvent(event, parameters);
  }, [dedupeKey, event, parameters]);

  return null;
}
