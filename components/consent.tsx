"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "llx-cookie-consent";
const CHANGE_EVENT = "llx-consent";

type Choice = "accepted" | "declined" | null;

const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim();
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

/** Nothing to ask about — or to load — unless at least one tag is configured. */
const MEASUREMENT_CONFIGURED = Boolean(GA_ID || PIXEL_ID);

function readChoice(): Choice {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "accepted" || value === "declined" ? value : null;
  } catch {
    // Private browsing with storage blocked: treat as undecided, ask again.
    return null;
  }
}

function writeChoice(choice: Exclude<Choice, null>) {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* ignore: the choice then applies to this page view only */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Subscribes to the stored choice, and to changes made in this or another tab. */
function useConsent() {
  const [choice, setChoice] = useState<Choice>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setChoice(readChoice());
    sync();
    setReady(true);
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { choice, ready };
}

function injectScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const el = document.createElement("script");
  el.id = id;
  el.async = true;
  el.src = src;
  document.head.appendChild(el);
}

function injectInline(id: string, code: string) {
  if (document.getElementById(id)) return;
  const el = document.createElement("script");
  el.id = id;
  el.textContent = code;
  document.head.appendChild(el);
}

/**
 * Loads GA4 and the Meta Pixel, but only after the visitor accepts the cookie
 * notice — assessment answers are health data, so measurement tags must not fire
 * before consent. Tag IDs come from NEXT_PUBLIC_GA_ID and NEXT_PUBLIC_META_PIXEL_ID;
 * with neither set, nothing loads at all. The content-security policy in
 * next.config.ts allows these hosts only when the matching ID is configured.
 */
export function Analytics() {
  const { choice } = useConsent();
  const pathname = usePathname();
  const onAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (choice !== "accepted" || onAdmin) return;

    if (GA_ID) {
      injectInline(
        "ga-init",
        `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}` +
          `gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`,
      );
      injectScript("ga-src", `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
    }

    if (PIXEL_ID) {
      injectInline(
        "fb-init",
        `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?` +
          `n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;` +
          `n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window,document);` +
          `fbq('init','${PIXEL_ID}');fbq('track','PageView');`,
      );
      injectScript("fb-src", "https://connect.facebook.net/en_US/fbevents.js");
    }
  }, [choice, onAdmin]);

  // Route changes: GA4 tracks them itself, the Pixel does not.
  useEffect(() => {
    if (choice !== "accepted" || onAdmin || !PIXEL_ID) return;
    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    fbq?.("track", "PageView");
  }, [pathname, choice, onAdmin, PIXEL_ID]);

  return null;
}

export function CookieNotice() {
  const { choice, ready } = useConsent();
  const pathname = usePathname();

  if (!MEASUREMENT_CONFIGURED) return null;
  if (!ready || choice !== null) return null;
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="cookie" role="dialog" aria-live="polite" aria-label="Cookie choices">
      <p>
        <strong>Cookies on LifelineX</strong>
        We always use the cookies the site needs to work. May we also use analytics and advertising cookies to see how
        people find us? Your assessment answers are never used for advertising — see our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
      <div className="cookie__actions">
        <button type="button" className="btn btn--dark btn--sm" onClick={() => writeChoice("accepted")}>
          Accept
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => writeChoice("declined")}>
          Only essential
        </button>
      </div>
    </div>
  );
}
