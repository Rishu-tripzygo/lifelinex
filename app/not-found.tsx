import Link from "next/link";
import { Icon } from "@/components/icons";
import { SiteFooter, SiteNav } from "@/components/site-chrome";

export default function NotFound() {
  return (
    <>
      <SiteNav cta={{ href: "/#concerns", label: "Start assessment" }} />
      <main id="main">
        <section className="section notfound">
          <div className="container notfound__inner">
            <span className="eyebrow">404</span>
            <h1 className="display-l">We couldn&apos;t find that page</h1>
            <p className="lede">
              The link may be old or mistyped. Everything below is one click away, or start with the health concern
              closest to what you&apos;re experiencing.
            </p>
            <div className="notfound__actions">
              <Link className="btn btn--primary" href="/#concerns">
                Choose your health concern <Icon name="arrow" />
              </Link>
              <Link className="btn btn--ghost" href="/pcos">
                PCOS &amp; PCOD consultation
              </Link>
            </div>
            <ul className="notfound__links">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/contact">Contact us</Link>
              </li>
              <li>
                <Link href="/refund">Refund &amp; Cancellation</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
