import "server-only";
import nodemailer from "nodemailer";

type ConsultationMail = {
  to: string;
  name: string;
  startsAt: Date;
  endsAt: Date;
  meetingUrl: string;
  orderId: string;
};

type AssessmentMail = {
  to: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  submittedAt: Date;
  answers: { question: string; answer: string }[];
};

function mailTransport() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || user;
  const port = Number(process.env.SMTP_PORT ?? "587");
  if (!host || !user || !pass || !from) return null;
  return {
    from,
    transport: nodemailer.createTransport({
      host,
      port: Number.isFinite(port) ? port : 587,
      secure: port === 465,
      auth: { user, pass },
    }),
  };
}

function formatIstRange(startsAt: Date, endsAt: Date) {
  const fmt = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const timeFmt = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${fmt.format(startsAt)}, ${timeFmt.format(startsAt)} – ${timeFmt.format(endsAt)} IST`;
}

export async function sendConsultationEmail(input: ConsultationMail) {
  const mail = mailTransport();
  if (!mail) {
    console.warn("[email] SMTP not configured — skipping send to", input.to);
    return false;
  }

  const when = formatIstRange(input.startsAt, input.endsAt);
  const subject = "Your LifelineX consultation — Google Meet link";
  const text = [
    `Hi ${input.name},`,
    "",
    "Your online doctor consultation is confirmed.",
    "",
    `When: ${when}`,
    `Join: ${input.meetingUrl}`,
    "",
    "Please join a few minutes early. Use the same link if you need to rejoin.",
    "",
    `Booking reference: ${input.orderId}`,
    "",
    "— LifelineX",
  ].join("\n");

  try {
    await mail.transport.sendMail({
      from: `LifelineX <${mail.from}>`,
      to: input.to,
      subject,
      text,
      html: `
        <p>Hi ${input.name},</p>
        <p>Your online doctor consultation is confirmed.</p>
        <p><strong>When:</strong> ${when}<br/>
        <strong>Join:</strong> <a href="${input.meetingUrl}">${input.meetingUrl}</a></p>
        <p>Please join a few minutes early. Use the same link if you need to rejoin.</p>
        <p style="color:#666;font-size:13px">Booking reference: ${input.orderId}</p>
        <p>— LifelineX</p>
      `,
    });
    return true;
  } catch (error) {
    console.error("[email] send failed", error);
    return false;
  }
}

export async function sendAssessmentNotificationEmail(input: AssessmentMail) {
  const mail = mailTransport();
  if (!mail) {
    console.warn("[assessment-email] SMTP not configured — skipping notification");
    return false;
  }

  const submitted = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  }).format(input.submittedAt);
  const subject = `New PCOS assessment — ${input.name}`;
  const answerText = input.answers.map((row) => `${row.question}: ${row.answer}`).join("\n");
  const answerHtml = input.answers
    .map(
      (row) =>
        `<tr><td style="padding:8px;border:1px solid #d9e7ec;font-weight:600;vertical-align:top">${escapeHtml(row.question)}</td><td style="padding:8px;border:1px solid #d9e7ec;vertical-align:top">${escapeHtml(row.answer)}</td></tr>`,
    )
    .join("");

  try {
    await mail.transport.sendMail({
      from: `LifelineX <${mail.from}>`,
      to: input.to,
      subject,
      text: [
        "A new PCOS / PCOD / PMOS assessment has been submitted.",
        "",
        `Name: ${input.name}`,
        `Phone: +91 ${input.phone}`,
        `Email: ${input.email}`,
        `Submitted: ${submitted}`,
        `Assessment ID: ${input.id}`,
        "",
        answerText,
      ].join("\n"),
      html: `
        <h2 style="color:#063b5c">New PCOS assessment</h2>
        <p><strong>Name:</strong> ${escapeHtml(input.name)}<br/>
        <strong>Phone:</strong> +91 ${escapeHtml(input.phone)}<br/>
        <strong>Email:</strong> ${escapeHtml(input.email)}<br/>
        <strong>Submitted:</strong> ${escapeHtml(submitted)}<br/>
        <strong>Assessment ID:</strong> ${escapeHtml(input.id)}</p>
        <table style="border-collapse:collapse;width:100%;max-width:760px">${answerHtml}</table>
        <p style="color:#667085;font-size:12px">This email contains confidential health information. Keep it within the authorised LifelineX clinical team.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error("[assessment-email] send failed", error);
    return false;
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}
