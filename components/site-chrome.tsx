import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { BUSINESS, LEGAL_LINKS, telHref } from "@/lib/business";

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

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  linkedin: "LinkedIn",
};

/**
 * The one footer every page uses. It carries the policy links, the registered
 * entity and a reachable support contact, which payment gateways and India's
 * telemedicine rules expect on every page — so pages must not hand-roll their own.
 */
export function SiteFooter({
  concerns = [],
  links = [],
}: {
  /** Optional "Health concerns" column. */
  concerns?: { label: string; href?: string }[];
  /** Optional page-specific links (same-page anchors are fine). */
  links?: { href: string; label: string }[];
}) {
  const social = Object.entries(BUSINESS.social).filter(([, href]) => href);
  return (
    <footer className="footer">
      <div className="container">
        <div className={`footer__cols${concerns.length > 0 ? "" : " footer__cols--lean"}`}>
          <div className="footer__brand">
            <Link href="/">
              <img src="/assets/logo-horizontal.svg" alt="LifelineX home" width={115} height={22} />
            </Link>
            <p>{DISCLAIMER}</p>
          </div>

          {concerns.length > 0 && (
            <div>
              <h3>Health concerns</h3>
              <ul>
                {concerns.map((c) =>
                  c.href ? (
                    <li key={c.label}>
                      <Link href={c.href}>{c.label}</Link>
                    </li>
                  ) : (
                    <li className="soon" key={c.label}>
                      {c.label}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          <div>
            <h3>Legal</h3>
            <ul>
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Contact</h3>
            <ul>
              <li>
                <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
              </li>
              <li>
                <a href={telHref(BUSINESS.phone)}>{BUSINESS.phone}</a>
              </li>
              <li className="soon">{BUSINESS.hours}</li>
              <li>
                <Link href="/contact">Grievance contact</Link>
              </li>
            </ul>
            {social.length > 0 && (
              <ul className="footer__social">
                {social.map(([key, href]) => (
                  <li key={key}>
                    <a href={href} rel="noopener noreferrer" target="_blank">
                      {SOCIAL_LABELS[key] ?? key}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="footer__base">
          <p>
            © {new Date().getFullYear()} {BUSINESS.legalName}. All rights reserved.
          </p>
          <p>{BUSINESS.address}</p>
        </div>
      </div>
    </footer>
  );
}
