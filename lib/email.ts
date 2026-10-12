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
