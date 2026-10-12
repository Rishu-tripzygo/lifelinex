import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Measurement tags are allowed through the policy only when their IDs are actually
// configured, so a site with no analytics keeps the tighter policy. These must stay in
// step with components/consent.tsx, which injects the tags after the visitor consents.
const gaHosts = process.env.NEXT_PUBLIC_GA_ID?.trim()
  ? {
      script: ["https://www.googletagmanager.com"],
      connect: ["https://*.google-analytics.com", "https://*.analytics.google.com", "https://*.googletagmanager.com"],
    }
  : { script: [], connect: [] };

const pixelHosts = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
  ? { script: ["https://connect.facebook.net"], connect: ["https://www.facebook.com"] }
  : { script: [], connect: [] };

const analyticsScript = [...gaHosts.script, ...pixelHosts.script];
const analyticsConnect = [...gaHosts.connect, ...pixelHosts.connect];
const join = (hosts: string[]) => (hosts.length ? ` ${hosts.join(" ")}` : "");

// Cashfree's JS SDK loads from sdk.cashfree.com and may post or frame to its checkout
// domains (api/sandbox/payments.cashfree.com), so those are allowed explicitly.
// 'unsafe-inline' scripts are needed for Next's inline bootstrap without a nonce setup;
// 'unsafe-eval' only in development for React Refresh.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://sdk.cashfree.com${join(analyticsScript)}${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // https: already covers the analytics tracking pixels (google-analytics.com, facebook.com/tr).
  "img-src 'self' data: https:",
  `connect-src 'self' https://*.cashfree.com${join(analyticsConnect)}${isDev ? " ws: http://localhost:*" : ""}`,
  "frame-src https://*.cashfree.com",
  "form-action 'self' https://*.cashfree.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Keeps ?order_id=… from leaking to Cal.com or other sites via the Referer header.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://*.cashfree.com\")" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Payment status and API responses carry personal data: never cache them.
      { source: "/payment/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
