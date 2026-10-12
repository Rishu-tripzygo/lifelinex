import { POLICY_UPDATED } from "@/lib/business";

/** Shared title block for the policy pages. */
export function LegalHead({ title, intro }: { title: string; intro: string }) {
  return (
    <header className="legal__head">
      <span className="eyebrow">Legal</span>
      <h1 className="display-l">{title}</h1>
      <p className="lede">{intro}</p>
      <p className="legal__meta">Last updated {POLICY_UPDATED}</p>
    </header>
  );
}
