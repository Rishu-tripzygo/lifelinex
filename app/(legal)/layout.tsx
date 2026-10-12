import { SiteFooter, SiteNav } from "@/components/site-chrome";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav cta={{ href: "/#concerns", label: "Start assessment" }} />
      <main id="main">
        <article className="legal container">{children}</article>
      </main>
      <SiteFooter />
    </>
  );
}
