import { after, NextResponse } from "next/server";
import { cleanName, isValidName, normalizeEmail, normalizePhone, parseAnswers, parseSymptoms } from "@/lib/lead";
import { deliverAssessment } from "@/lib/assessment-delivery";
import { prisma } from "@/lib/prisma";
import { jsonError, readGuardedJson } from "@/lib/request-guard";

export async function POST(request: Request) {
  const read = await readGuardedJson(request, { route: "assessments", limit: 10, windowMs: 10 * 60 * 1000 });
  if ("response" in read) return read.response;
  const payload = read.body;

  const name = typeof payload.name === "string" ? cleanName(payload.name) : "";
  const phone = typeof payload.phone === "string" ? normalizePhone(payload.phone) : null;
  const email = typeof payload.email === "string" ? normalizeEmail(payload.email) : null;
  const symptoms = parseSymptoms(payload.symptoms);
  const answers = symptoms ? parseAnswers(payload.answers, symptoms) : null;

  if (payload.consent !== true) {
    return jsonError("Please agree to share your answers with our clinical team.", 400);
  }
  if (!isValidName(name) || !phone || !email || !symptoms || !answers) {
    return jsonError("Check the name, phone number, email, and answers.", 400);
  }

  try {
    const assessment = await prisma.assessment.create({
      data: { name, phone, email, symptoms, answers, consentedAt: new Date() },
    });
    after(() => deliverAssessment(assessment));
    return NextResponse.json({ id: assessment.id });
  } catch (error) {
    console.error("[assessments] save failed", error);
    return jsonError("We couldn't save your answers right now. You can still book your consultation.", 503);
  }
}
