"use client";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export type MarketingEvent =
  | "cta_click"
  | "assessment_submit"
  | "checkout_start"
  | "payment_success"
  | "booking_complete";

// Sends privacy-safe marketing events to GTM. Never include names, phone numbers,
// email addresses, assessment answers, order IDs, or appointment details here.
export function trackEvent(event: MarketingEvent, parameters: Record<string, string | number | boolean> = {}) {
  window.dataLayer ??= [];
  window.dataLayer.push({ event, ...parameters });
}
