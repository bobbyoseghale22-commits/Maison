import type { MetadataRoute } from "next";

import { connectToDatabase } from "@/lib/db/connect";
import { Product, Category } from "@/models";
import { env } from "@/config/env";

/**
 * Dynamic XML sitemap — generated at build time and revalidated every
 * 24 hours by the Next.js sitemap route segment.
 *
 * Includes:
 *  • Static pages (home, shop, about, etc.)
 *  • All active product detail pages
 *  • All active category pages (/products?category=slug)
 *
 * Excluded (robots.ts blocks crawlers too):
 *  • /admin/*, /checkout/*, /orders/*, /wishlist
 *  • API routes
 */
export const revalidate = 86400; // re-generate once per day

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${base}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Dynamic pages — best-effort; return statics only on DB failure
  try {
    await connectToDatabase();

    const [products, categories] = await Promise.all([
      Product.find({ isActive: true })
        .select("slug updatedAt")
        .sort({ updatedAt: -1 })
        .lean(),
      Category.find({ isActive: true })
        .select("slug updatedAt")
        .lean(),
    ]);

    const productPages: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${base}/products?category=${c.slug}`,
      lastModified: c.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...productPages, ...categoryPages];
  } catch {
    // DB unavailable during build — return static pages only.
    // The sitemap will be regenerated on the next revalidation cycle.
    return staticPages;
  }
}
