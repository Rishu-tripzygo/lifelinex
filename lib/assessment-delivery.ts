import "server-only";
import type { Assessment } from "@prisma/client";
import { describeAnswers } from "@/lib/assessment-questions";

export async function deliverAssessment(assessment: Assessment) {
  const endpoint = process.env.ASSESSMENT_WEBHOOK_URL?.trim();
  const secret = process.env.ASSESSMENT_WEBHOOK_SECRET?.trim();
  if (!endpoint || !secret) {
    console.warn("[assessment-delivery] webhook not configured — skipping Sheet and Gmail copy");
    return false;
  }

  const url = new URL(endpoint);
  url.searchParams.set("key", secret);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: assessment.id,
      condition: "PCOS / PCOD / PMOS",
      name: assessment.name,
      phone: assessment.phone,
      email: assessment.email ?? "",
      consentedAt: assessment.consentedAt?.toISOString() ?? "",
      submittedAt: assessment.createdAt.toISOString(),
      answers: describeAnswers(assessment.answers),
      sourcePage: "/pcos",
    }),
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Assessment webhook failed (${response.status})`);
  const result = (await response.json()) as { ok?: boolean; error?: string };
  if (!result.ok) throw new Error(`Assessment webhook rejected: ${result.error ?? "unknown error"}`);
  return true;
}
