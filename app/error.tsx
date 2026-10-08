"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "@/components/icons";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="status-page">
      <main id="main">
        <div className="status">
          <span className="status__mark status__mark--fail"><Icon name="alert" size={24} /></span>
          <h1>Something went wrong</h1>
          <p className="small" style={{ fontSize: 15.5 }}>
            Please try again. If you were in the middle of paying, don&apos;t pay again until you&apos;ve checked your payment status.
          </p>
          {error.digest && <p className="small">Reference: {error.digest}</p>}
          <div className="status__actions">
            <button type="button" className="btn btn--primary" onClick={reset}>
              <Icon name="refresh" /> Try again
            </button>
            <Link className="btn btn--ghost" href="/">
              Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
