import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

export function SiteNav({
  links = [],
  cta,
  home = "/",
}: {
  links?: { href: string; label: string }[];
  cta?: { href: string; label: string };
  home?: string;
}) {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="nav" id="nav">
        <div className="container">
          <Link className="nav__brand" href={home} aria-label="LifelineX home">
            <img src="/assets/logo-horizontal.svg" alt="LifelineX" width={125} height={24} />
          </Link>
          {links.length > 0 && (
            <nav className="nav__links" aria-label="Sections">
              {links.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          )}
          {cta && (
            <a className="btn btn--dark btn--sm" href={cta.href}>
              {cta.label}
            </a>
          )}
        </div>
      </header>
    </>
  );
}

export function Faq({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className="accordion">
      {items.map((item) => (
        <details key={item.q}>
          <summary>
            {item.q}
            <span className="accordion__icon">
              <Icon name="plus" size={14} />
            </span>
          </summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function Dock({ title, detail, href, label }: { title: string; detail: string; href: string; label: string }) {
  return (
    <div className="dock" id="dock" aria-hidden="true">
      <div className="dock__text">
        <strong>{title}</strong>
        {detail}
      </div>
      <a className="btn btn--primary btn--sm" href={href} tabIndex={-1}>
        {label}
      </a>
    </div>
  );
}

export const DISCLAIMER =
  "LifelineX connects you with a licensed doctor (MBBS/MD) for an online consultation. This is a telemedicine service — your doctor will advise if an in-person examination or specialist referral is needed. If you are experiencing a medical emergency, contact your local emergency services immediately.";

// Published support contact. Shown in the footer of every page so there is always a
// way to reach a human — payment gateways and India's telemedicine rules expect one.
export const SUPPORT_EMAIL = "lifelinex.doctor@gmail.com";
export const SUPPORT_PHONE_DISPLAY = "+91 73037 81212";
export const SUPPORT_PHONE_HREF = "tel:+917303781212";
