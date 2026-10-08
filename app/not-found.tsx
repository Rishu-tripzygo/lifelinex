import Link from "next/link";
import { Icon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="status-page">
      <header className="nav is-scrolled">
        <div className="container">
          <Link className="nav__brand" href="/" aria-label="LifelineX home">
            <img src="/assets/logo-horizontal.svg" alt="LifelineX" width={125} height={24} />
          </Link>
        </div>
      </header>
      <main id="main">
        <div className="status">
          <span className="status__mark status__mark--wait"><Icon name="alert" size={24} /></span>
          <h1>We couldn&apos;t find that page</h1>
          <p className="small" style={{ fontSize: 15.5 }}>The link may be old or mistyped.</p>
          <div className="status__actions">
            <Link className="btn btn--primary" href="/">
              Go to the home page <Icon name="arrow" />
            </Link>
            <Link className="btn btn--ghost" href="/pcos">
              PCOS consultation
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
