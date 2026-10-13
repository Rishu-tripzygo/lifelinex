import "server-only";
import type { Assessment } from "@prisma/client";
import { describeAnswers } from "@/lib/assessment-questions";
import { sendAssessmentNotificationEmail } from "@/lib/email";
import { googleAccessToken } from "@/lib/google-service-account";

const SHEET_RANGE = "Sheet1!A:R";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function sheetRow(assessment: Assessment, described: { question: string; answer: string }[]) {
  const answer = (index: number) => described[index]?.answer ?? "—";
  return [
    assessment.createdAt.toISOString(),
    assessment.id,
    "PCOS / PCOD / PMOS",
    assessment.name,
    assessment.phone,
    assessment.email ?? "",
    assessment.consentedAt?.toISOString() ?? "",
    answer(0),
    answer(1),
    answer(2),
    answer(3),
    answer(4),
    answer(5),
    answer(6),
    answer(7),
    answer(8),
    answer(9),
    "/pcos",
  ];
}

async function appendAssessmentToSheet(assessment: Assessment, described: { question: string; answer: string }[]) {
  const spreadsheetId = process.env.GOOGLE_ASSESSMENT_SHEET_ID?.trim();
  if (!spreadsheetId) {
    console.warn("[assessment-sheet] GOOGLE_ASSESSMENT_SHEET_ID not configured — skipping append");
    return false;
  }
  const token = await googleAccessToken(SHEETS_SCOPE);
  if (!token) {
    console.warn("[assessment-sheet] Google service account not configured — skipping append");
    return false;
  }

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(SHEET_RANGE)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [sheetRow(assessment, described)] }),
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Google Sheets append failed (${response.status}): ${detail.slice(0, 200)}`);
  }
  return true;
}

export async function deliverAssessment(assessment: Assessment) {
  const described = describeAnswers(assessment.answers);
  const notifyEmail = process.env.ASSESSMENT_NOTIFY_EMAIL?.trim() || "lifelinex.doctor@gmail.com";
  const results = await Promise.allSettled([
    appendAssessmentToSheet(assessment, described),
    sendAssessmentNotificationEmail({
      to: notifyEmail,
      id: assessment.id,
      name: assessment.name,
      phone: assessment.phone,
      email: assessment.email ?? "",
      submittedAt: assessment.createdAt,
      answers: described,
    }),
  ]);
  for (const result of results) {
    if (result.status === "rejected") console.error("[assessment-delivery] failed", result.reason);
  }
}
