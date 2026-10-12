import type { MetadataRoute } from "next";

// Resolved against the canonical host, so NEXT_PUBLIC_APP_URL must be the apex
// origin (https://lifelinex.in) — not the www alias, which 301s to it.
const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pcos`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/contact`, lastModified, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/refund`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
