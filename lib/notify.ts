import "server-only";
import { orderNotifyUrl } from "@/lib/config";

// Posts a one-line message to the team's Slack-compatible webhook, if configured.
// Never throws: a notification failure must not break a payment or booking.
export async function notifyTeam(text: string) {
  const url = orderNotifyUrl();
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.error("[notify] team notification failed", error);
  }
}
