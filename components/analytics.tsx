"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/client-analytics";

function pageType(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/booking/")) return "booking";
  if (pathname.startsWith("/payment/")) return "payment";
  return "condition";
}

function classifyCta(element: HTMLElement) {
  const text = (element.textContent || "").toLowerCase();
  const href = element instanceof HTMLAnchorElement ? element.getAttribute("href") || "" : "";

  if (href.startsWith("tel:")) return "phone";
  if (href.startsWith("mailto:")) return "email";
  if (/pay|checkout/.test(text)) return "checkout";
  if (/assessment/.test(text) || href === "#assessment") return "assessment";
  if (/book|consultation|consult/.test(text) || href === "#book") return "consultation";
  if (href.startsWith("/#concerns") || href === "#concerns" || /^\/[a-z0-9-]+$/i.test(href)) return "health_concern";
  if (element.getAttribute("aria-expanded") !== null) return "faq";
  return "navigation";
}

export function Analytics() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    // The admin area contains patient records and must never load analytics.
    if (pathname.startsWith("/admin")) return;

    if (previousPath.current && previousPath.current !== pathname) {
      window.dataLayer ??= [];
      window.dataLayer.push({ event: "virtual_page_view", page_type: pageType(pathname) });
      window.fbq?.("track", "PageView");
    }
    previousPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("a, button") : null;
      if (!target || target.closest("[data-analytics-ignore]")) return;
      trackEvent("cta_click", {
        cta_type: classifyCta(target),
        page_type: pageType(window.location.pathname),
      });
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [pathname]);

  return null;
}
