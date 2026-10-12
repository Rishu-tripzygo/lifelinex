import type { Metadata, Viewport } from "next";
import { JsonLd } from "@/components/json-ld";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LifelineX — Doctor-Led Online Health Consultations",
    template: "%s — LifelineX",
  },
  description:
    "Start with a structured assessment and consult a qualified doctor online for hormonal, metabolic and complex health concerns.",
  openGraph: {
    title: "LifelineX — Doctor-Led Online Health Consultations",
    description:
      "Start with a structured assessment and consult a qualified doctor online for hormonal, metabolic and complex health concerns.",
    images: ["/assets/consult-call.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#F5FAFB",
  width: "device-width",
  initialScale: 1,
};

const ORGANISATION = {
  "@context": "https://schema.org",
  "@type": "MedicalOrganization",
  name: "LifelineX",
  url: SITE_URL,
  logo: `${SITE_URL}/assets/logo-icon.svg`,
  image: `${SITE_URL}/assets/consult-call.jpg`,
  description:
    "Start with a structured assessment and consult a qualified doctor online for hormonal, metabolic and complex health concerns.",
  areaServed: { "@type": "Country", name: "India" },
  medicalSpecialty: ["Endocrine", "PrimaryCare"],
  availableService: {
    "@type": "MedicalTherapy",
    name: "Online doctor consultation",
    availableChannel: { "@type": "ServiceChannel", serviceType: "Telemedicine", serviceUrl: SITE_URL },
  },
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
      <body>{children}</body>
    </html>
  );
}
