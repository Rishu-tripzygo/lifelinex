import Link from "next/link";
import type { ReactNode } from "react";

const TONE: Record<string, string> = {
  CONFIRMED: "info",
  COMPLETED: "ok",
  CANCELLED: "muted",
  NO_SHOW: "warn",
  PAID: "ok",
  CREATED: "muted",
  FAILED: "bad",
  EXPIRED: "muted",
};
const LABEL: Record<string, string> = {
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
  PAID: "Paid",
  CREATED: "Started",
  FAILED: "Failed",
  EXPIRED: "Expired",
};

export function Badge({ status }: { status: string }) {
  return <span className={`badge badge--${TONE[status] ?? "muted"}`}>{LABEL[status] ?? status}</span>;
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <header className="ahead">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="ahead__actions">{children}</div>}
    </header>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="aempty">{children}</p>;
}

// Filter chips that keep the other query params.
export function Filters({
  base,
  param,
  value,
  options,
  keep = {},
}: {
  base: string;
  param: string;
  value: string;
  options: [string, string][];
  keep?: Record<string, string | undefined>;
}) {
  return (
    <div className="chips" role="group" aria-label="Filter">
      {options.map(([v, label]) => {
        const qs = new URLSearchParams();
        for (const [k, kv] of Object.entries(keep)) if (kv) qs.set(k, kv);
        qs.set(param, v);
        return (
          <Link key={v} href={`${base}?${qs}`} className="chip" aria-current={v === value ? "true" : undefined}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export function Pager({ base, page, hasMore, keep = {} }: { base: string; page: number; hasMore: boolean; keep?: Record<string, string | undefined> }) {
  if (page <= 1 && !hasMore) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(keep)) if (v) qs.set(k, v);
    qs.set("page", String(p));
    return `${base}?${qs}`;
  };
  return (
    <div className="pager">
      {page > 1 ? <Link className="btn btn--ghost btn--xs" href={href(page - 1)}>← Newer</Link> : <span />}
      <span>Page {page}</span>
      {hasMore ? <Link className="btn btn--ghost btn--xs" href={href(page + 1)}>Older →</Link> : <span />}
    </div>
  );
}

export const PAGE_SIZE = 25;
export function pageFrom(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1;
}
export function one(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.slice(0, 100);
}
