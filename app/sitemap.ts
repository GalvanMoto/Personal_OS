import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pos.techwithgalvan.in"
  // Use file mtimes so lastmod reflects real content change (not deploy time)
  return [
    { url: `${base}/`, lastModified: new Date("2026-08-27") },
    { url: `${base}/privacy`, lastModified: new Date("2026-08-27") },
    { url: `${base}/terms`, lastModified: new Date("2026-08-27") },
  ]
}
