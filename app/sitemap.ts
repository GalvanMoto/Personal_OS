import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pos.techwithgalvan.in"
  const now = new Date()

  const routes: Array<{ url: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { url: `${base}/`, priority: 1, changeFrequency: "weekly" },
    { url: `${base}/privacy`, priority: 0.6, changeFrequency: "yearly" },
    { url: `${base}/terms`, priority: 0.6, changeFrequency: "yearly" },
    { url: `${base}/login`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${base}/signup`, priority: 0.5, changeFrequency: "monthly" },
  ]

  return routes.map((r) => ({
    url: r.url,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
