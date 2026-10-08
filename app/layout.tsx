import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "LifelineX | Doctor-Led Online Health Consultations",
    template: "%s — LifelineX",
  },
  description:
    "Start with a structured assessment and consult a qualified doctor online for hormonal, metabolic and complex health concerns.",
  icons: { icon: "/assets/logo-icon.svg" },
  openGraph: {
    title: "LifelineX | Doctor-Led Online Health Consultations",
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
      </head>
      <body>{children}</body>
    </html>
  );
}
