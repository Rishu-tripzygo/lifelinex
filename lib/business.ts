// Public business facts shown in the footer, on the contact page and in the policy
// pages. Safe to import from client components — nothing here is a secret.
//
// ─────────────────────────────────────────────────────────────────────────────
//  FILL THESE IN BEFORE LAUNCH. Every value starting with TODO_ is a placeholder.
//  A production build fails while any remain (see assertBusinessConfigured below),
//  so these cannot reach a paying visitor by accident.
// ─────────────────────────────────────────────────────────────────────────────

export const BUSINESS = {
  /** Brand name shown in headings and the logo. */
  name: "LifelineX",

  /** Registered entity name, exactly as on the GST / incorporation certificate. */
  legalName: "TODO_LEGAL_ENTITY_NAME",

  /** Support inbox. Published in the footer and on every policy page. */
  email: "TODO_SUPPORT_EMAIL",

  /** Support phone in international format, e.g. "+91 98765 43210". */
  phone: "TODO_SUPPORT_PHONE",

  /** Registered office address, single line, including city, state and PIN. */
  address: "TODO_REGISTERED_ADDRESS",

  /** Grievance officer — a named person and a reachable address (IT Rules / DPDP). */
  grievance: {
    name: "TODO_GRIEVANCE_OFFICER_NAME",
    email: "TODO_GRIEVANCE_EMAIL",
  },

  /** When a human answers support. Shown beside the contact details. */
  hours: "Mon–Sat, 10am–7pm IST",

  /** Optional. Leave a value empty and its link is simply not rendered. */
  social: {
    instagram: "",
    facebook: "",
    youtube: "",
    linkedin: "",
  },
} as const;

/** Date the policy pages were last reviewed. Bump when you change their wording. */
export const POLICY_UPDATED = "12 October 2026";

export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refund", label: "Refund & Cancellation" },
  { href: "/contact", label: "Contact" },
] as const;

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** True while a field is still a placeholder, so UI can hide an unfilled value. */
export const isPlaceholder = (value: string) => value.startsWith("TODO_");

const PLACEHOLDER_FIELDS = (): string[] => {
  const { legalName, email, phone, address, grievance } = BUSINESS;
  return Object.entries({
    legalName,
    email,
    phone,
    address,
    "grievance.name": grievance.name,
    "grievance.email": grievance.email,
  })
    .filter(([, value]) => isPlaceholder(value))
    .map(([field]) => field);
};

/**
 * Fails a production build while contact details are still placeholders. Imported
 * by the root layout so it runs for every page, not only the ones under /contact.
 * Payment gateways and India's telemedicine and DPDP rules all expect a reachable
 * entity, so shipping TODO_ values would be worse than failing the build.
 */
export function assertBusinessConfigured() {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.ALLOW_PLACEHOLDER_BUSINESS_INFO === "1") return;
  const missing = PLACEHOLDER_FIELDS();
  if (missing.length === 0) return;
  throw new Error(
    `lib/business.ts still has placeholder values: ${missing.join(", ")}. ` +
      "Fill them in before building for production, or set " +
      "ALLOW_PLACEHOLDER_BUSINESS_INFO=1 to build a staging copy anyway.",
  );
}
