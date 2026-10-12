import type { MetadataRoute } from "next";

// Resolved against NEXT_PUBLIC_APP_URL, which must be the site's canonical origin.
const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pcos`, lastModified, changeFrequency: "weekly", priority: 0.9 },
  ];
}
