// Shared by the browser and the server: validation and the shape of a lead.
// Server-only settings (fee, site URL, booking link) live in lib/config.ts.

export const LEAD_STORAGE_KEY = "llx-lead";
export const PAID_ORDER_STORAGE_KEY = "llx-paid-order";

export const SYMPTOM_OPTIONS = [
  "acne",
  "hairgrowth",
  "hairthin",
  "weight",
  "fatigue",
  "mood",
  "sleep",
  "none",
] as const;

const SINGLE_ANSWERS: Record<string, readonly string[]> = {
  "1": ["regular", "irregular", "absent", "not-sure"],
  "3": ["confirmed", "suspected", "no", "not-sure"],
  "4": ["understand", "manage-symptoms", "conceive-plan", "weight-mgmt", "overall-health"],
  "5": ["diet", "supplements", "medication", "nothing"],
  "6": ["good", "low", "varies"],
  "7": ["good", "trouble", "irregular"],
  "8": ["yes", "no", "undecided"],
  "9": ["under-20", "20-29", "30-39", "40-plus"],
  "10": ["not-much", "some-extent", "quite-a-lot"],
};

export type LeadDraft = {
  assessmentId?: string;
  name: string;
  phone: string;
};

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

// Collapses whitespace and drops control characters; names go to Cashfree and Cal.com as-is.
export function cleanName(value: string) {
  return value
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isValidName(value: string) {
  const name = cleanName(value);
  return name.length >= 2 && name.length <= 80 && /\p{L}/u.test(name);
}

// An Indian mobile number as 10 digits, accepting +91, 91 or a leading 0. Null if it isn't one.
export function normalizePhone(value: string) {
  let digits = digitsOnly(value);
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function isValidPhone(value: string) {
  return normalizePhone(value) !== null;
}

export function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function parseAnswers(input: unknown, symptoms: string[]) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const source = input as Record<string, unknown>;
  const answers: Record<string, string | string[]> = {};

  // Every question is required; a partial or unknown answer rejects the whole assessment.
  for (const [step, allowed] of Object.entries(SINGLE_ANSWERS)) {
    const value = source[step];
    if (typeof value !== "string" || !allowed.includes(value)) return null;
    answers[step] = value;
  }

  answers["2"] = symptoms;
  return answers;
}

export function parseSymptoms(input: unknown) {
  if (!Array.isArray(input) || input.length === 0 || input.length > SYMPTOM_OPTIONS.length) {
    return null;
  }
  const symptoms = input.filter((item): item is string => typeof item === "string");
  if (symptoms.length !== input.length) return null;
  if (symptoms.some((item) => !SYMPTOM_OPTIONS.includes(item as (typeof SYMPTOM_OPTIONS)[number]))) {
    return null;
  }
  if (symptoms.includes("none") && symptoms.length > 1) return null;
  return Array.from(new Set(symptoms));
}
