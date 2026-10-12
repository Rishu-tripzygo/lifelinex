import type { Metadata, Viewport } from "next";
import { Analytics, CookieNotice } from "@/components/consent";
import { JsonLd } from "@/components/json-ld";
import { assertBusinessConfigured, BUSINESS } from "@/lib/business";
import "./globals.css";

// Stops a build that still carries TODO_ contact details from reaching production.
assertBusinessConfigured();

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DESCRIPTION =
  "Start with a structured assessment and consult a qualified doctor online for hormonal, metabolic and complex health concerns.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // One separator pattern across the site: "<page> — LifelineX".
    default: "LifelineX — Doctor-Led Online Health Consultations",
    template: "%s — LifelineX",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "LifelineX",
    locale: "en_IN",
    title: "LifelineX — Doctor-Led Online Health Consultations",
    description: DESCRIPTION,
    // Resolved against metadataBase, so it must be the canonical host.
    images: ["/assets/consult-call.jpg"],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#F5FAFB",
  width: "device-width",
  initialScale: 1,
};

const ORGANISATION = {
  "@context": "https://schema.org",
  "@type": "MedicalOrganization",
  name: BUSINESS.name,
  legalName: BUSINESS.legalName,
  url: SITE_URL,
  logo: `${SITE_URL}/assets/logo-icon.svg`,
  image: `${SITE_URL}/assets/consult-call.jpg`,
  description: DESCRIPTION,
  email: BUSINESS.email,
  telephone: BUSINESS.phone,
  address: { "@type": "PostalAddress", streetAddress: BUSINESS.address, addressCountry: "IN" },
  areaServed: { "@type": "Country", name: "India" },
  medicalSpecialty: ["Endocrine", "PrimaryCare"],
  availableService: {
    "@type": "MedicalTherapy",
    name: "Online doctor consultation",
    availableChannel: { "@type": "ServiceChannel", serviceType: "Telemedicine", serviceUrl: SITE_URL },
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: BUSINESS.email,
    telephone: BUSINESS.phone,
    areaServed: "IN",
    availableLanguage: ["en", "hi"],
  },
  sameAs: Object.values(BUSINESS.social).filter(Boolean),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="no-js" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.remove('no-js')" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Plus+Jakarta+Sans:wght@400..700&display=swap"
        />
        <JsonLd data={ORGANISATION} />
      </head>
      <body>
        {children}
        <CookieNotice />
        <Analytics />
      </body>
    </html>
  );
}
