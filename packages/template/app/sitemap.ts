import type { MetadataRoute } from "next";
import { pool } from "@/lib/db";
import config from "@/site.config";

const BASE = config.url;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* Static pages */
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/events`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/posts`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/education`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/donate`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/donate/daf`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/donate/employer-match`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/photos`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/map`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/media`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/brand`, changeFrequency: "yearly", priority: 0.3 },
  ];

  /* Dynamic blog posts */
  let postPages: MetadataRoute.Sitemap = [];
  try {
    const { rows } = await pool.query(
      `SELECT slug, updated_at FROM posts WHERE status = 'published' AND (published_at IS NULL OR published_at <= now()) ORDER BY created_at DESC`,
    );
    postPages = rows.map((row) => ({
      url: `${BASE}/posts/${row.slug}`,
      lastModified: new Date(row.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    /* DB unavailable at build time — static pages only */
  }

  /* Dynamic event pages */
  let eventPages: MetadataRoute.Sitemap = [];
  try {
    const { rows } = await pool.query(
      `SELECT slug, updated_at FROM events WHERE status = 'published' ORDER BY start_at DESC`,
    );
    eventPages = rows.map((row) => ({
      url: `${BASE}/events/${row.slug}`,
      lastModified: new Date(row.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    /* DB unavailable at build time — static pages only */
  }

  return [...staticPages, ...postPages, ...eventPages];
}
