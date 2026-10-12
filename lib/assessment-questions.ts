// The PCOS assessment questions, shared by the quiz and the admin panel.

export const SYMPTOMS: [string, string][] = [
  ["acne", "Acne / oily skin"],
  ["hairgrowth", "Extra hair growth (face/body)"],
  ["hairthin", "Hair thinning"],
  ["weight", "Weight changes"],
  ["fatigue", "Fatigue"],
  ["mood", "Mood swings"],
  ["sleep", "Trouble sleeping"],
  ["none", "None of these"],
];

export const QUESTIONS: Record<number, { title: string; cols?: 2; options: [string, string][] }> = {
  1: {
    title: "How are your periods these days?",
    options: [
      ["regular", "Regular"],
      ["irregular", "Irregular or unpredictable"],
      ["absent", "Haven't come for several months"],
      ["not-sure", "Not sure"],
    ],
  },
  3: {
    title: "Has a doctor ever mentioned PCOS or PCOD to you before?",
    options: [
      ["confirmed", "Yes, I'm diagnosed"],
      ["suspected", "It was suspected, but never confirmed"],
      ["no", "No"],
      ["not-sure", "Not sure"],
    ],
  },
  4: {
    title: "What's your biggest goal right now?",
    options: [
      ["understand", "Understanding what's going on"],
      ["manage-symptoms", "Managing symptoms"],
      ["conceive-plan", "Planning to conceive"],
      ["weight-mgmt", "Weight management"],
      ["overall-health", "Overall health"],
    ],
  },
  5: {
    title: "Have you tried anything before this?",
    options: [
      ["diet", "Diet changes"],
      ["supplements", "Supplements"],
      ["medication", "Medication"],
      ["nothing", "Nothing yet"],
    ],
  },
  6: {
    title: "How's your energy level most days?",
    options: [
      ["good", "Good"],
      ["low", "Low"],
      ["varies", "Varies a lot"],
    ],
  },
  7: {
    title: "How's your sleep?",
    options: [
      ["good", "Good"],
      ["trouble", "Trouble falling or staying asleep"],
      ["irregular", "Very irregular"],
    ],
  },
  8: {
    title: "Are you planning to conceive in the next year?",
    options: [
      ["yes", "Yes"],
      ["no", "No"],
      ["undecided", "Haven't decided yet"],
    ],
  },
  9: {
    title: "Which age group are you in?",
    cols: 2,
    options: [
      ["under-20", "Under 20"],
      ["20-29", "20–29"],
      ["30-39", "30–39"],
      ["40-plus", "40+"],
    ],
  },
  10: {
    title: "How much does this affect your day-to-day life?",
    options: [
      ["not-much", "Not much"],
      ["some-extent", "To some extent"],
      ["quite-a-lot", "Quite a lot"],
    ],
  },
};

export function labelFor(step: number, value: string | undefined) {
  return QUESTIONS[step]?.options.find(([v]) => v === value)?.[1] ?? "";
}

export const symptomLabel = (key: string) => SYMPTOMS.find(([k]) => k === key)?.[1] ?? key;

// Ordered question/answer pairs for display, from a stored `answers` JSON object.
export function describeAnswers(answers: unknown): { question: string; answer: string }[] {
  const source = (answers && typeof answers === "object" ? answers : {}) as Record<string, unknown>;
  const rows: { question: string; answer: string }[] = [];
  for (let step = 1; step <= 10; step++) {
    const value = source[String(step)];
    if (step === 2) {
      const list = Array.isArray(value) ? value.map(String) : [];
      rows.push({ question: "Which of these have you noticed?", answer: list.map(symptomLabel).join(", ") || "—" });
      continue;
    }
    const q = QUESTIONS[step];
    if (q) rows.push({ question: q.title, answer: labelFor(step, typeof value === "string" ? value : undefined) || "—" });
  }
  return rows;
}
