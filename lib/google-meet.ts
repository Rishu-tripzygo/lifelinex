import "server-only";
import crypto from "node:crypto";

type ServiceAccount = {
  clientEmail: string;
  privateKey: string;
  calendarId: string;
};

function serviceAccount(): ServiceAccount | null {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim() || "primary";
  if (!clientEmail || !rawKey) return null;
  const privateKey = rawKey.replace(/\\n/g, "\n");
  return { clientEmail, privateKey, calendarId };
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

async function googleAccessToken(account: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: account.clientEmail,
      scope: "https://www.googleapis.com/auth/calendar.events",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(account.privateKey, "base64url");
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Google auth failed (${res.status})`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google auth returned no token");
  return data.access_token;
}

export async function createGoogleMeetLink(input: {
  summary: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  attendeeEmail?: string;
}) {
  const account = serviceAccount();
  if (!account) return null;

  const token = await googleAccessToken(account);
  const requestId = crypto.randomBytes(8).toString("hex");
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(account.calendarId)}/events?conferenceDataVersion=1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.startsAt.toISOString(), timeZone: "Asia/Kolkata" },
        end: { dateTime: input.endsAt.toISOString(), timeZone: "Asia/Kolkata" },
        attendees: input.attendeeEmail ? [{ email: input.attendeeEmail }] : undefined,
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
      signal: AbortSignal.timeout(15000),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Google Calendar event failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const event = (await res.json()) as {
    hangoutLink?: string;
    conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  };
  const meet =
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find((p) => p.entryPointType === "video")?.uri ||
    null;
  return meet;
}
