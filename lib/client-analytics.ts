"use client";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    fbq?: (...args: unknown[]) => void;
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

  if (typeof window.fbq !== "function") return;

  // Meta receives only broad conversion signals. Never forward health-condition,
  // assessment, contact, appointment, or order-level details.
  if (event === "assessment_submit") window.fbq("track", "Lead");
  if (event === "checkout_start") {
    window.fbq("track", "InitiateCheckout", { currency: "INR", value: Number(parameters.value) || 999 });
  }
  if (event === "payment_success") {
    window.fbq("track", "Purchase", { currency: "INR", value: Number(parameters.value) || 999 });
  }
  if (event === "booking_complete") window.fbq("track", "Schedule");
}
