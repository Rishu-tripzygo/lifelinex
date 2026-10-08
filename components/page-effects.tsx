"use client";

import { useEffect } from "react";

// Nav border on scroll, scroll reveals, the "heard before" strike-through, and the mobile dock.
// The dock appears once `heroId` scrolls away and hides while any `hideDockOn` section is on screen.
export function PageEffects({ heroId = "top", hideDockOn = "" }: { heroId?: string; hideDockOn?: string }) {
  useEffect(() => {
    const nav = document.getElementById("nav");
    const onScroll = () => nav?.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal, #heard-list li").forEach((el) => el.classList.add("is-in"));
      return () => window.removeEventListener("scroll", onScroll);
    }

    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            reveal.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );
    document.querySelectorAll(".reveal").forEach((el) => reveal.observe(el));

    const timers: number[] = [];
    const strike = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const siblings = Array.from(e.target.parentNode?.children ?? []);
          const i = siblings.indexOf(e.target);
          timers.push(window.setTimeout(() => e.target.classList.add("is-in"), 250 + i * 180));
          strike.unobserve(e.target);
        }),
      { threshold: 0.8 },
    );
    document.querySelectorAll("#heard-list li").forEach((el) => strike.observe(el));

    const observers: IntersectionObserver[] = [reveal, strike];
    const dock = document.getElementById("dock");
    const hero = document.getElementById(heroId);
    if (dock && hero) {
      let heroGone = false;
      const blocking = new Set<Element>();
      const update = () => {
        const on = heroGone && blocking.size === 0;
        dock.classList.toggle("is-on", on);
        dock.setAttribute("aria-hidden", String(!on));
        const link = dock.querySelector("a");
        if (link) link.tabIndex = on ? 0 : -1;
      };
      const heroObs = new IntersectionObserver((entries) => {
        heroGone = !entries[0].isIntersecting;
        update();
      });
      heroObs.observe(hero);
      const hide = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? blocking.add(e.target) : blocking.delete(e.target)));
        update();
      });
      hideDockOn
        .split(",")
        .filter(Boolean)
        .forEach((id) => {
          const el = document.getElementById(id);
          if (el) hide.observe(el);
        });
      observers.push(heroObs, hide);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      observers.forEach((o) => o.disconnect());
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [heroId, hideDockOn]);

  return null;
}
