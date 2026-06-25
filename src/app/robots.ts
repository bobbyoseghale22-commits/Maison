import type { MetadataRoute } from "next";
import { env } from "@/config/env";

/**
 * Robots.txt — controls crawler access.
 *
 * Allow: all public-facing shop pages.
 * Disallow: admin, checkout, orders, wishlist, API routes, and
 *   search result pages (thin content, no canonical value for indexing).
 */
export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_APP_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products", "/products/*"],
        disallow: [
          "/admin/",
          "/checkout/",
          "/orders/",
          "/wishlist",
          "/api/",
          "/products?*q=*",   // search results — noindex already set per-page
          "/_next/",
        ],
      },
      // Block AI training crawlers that don't respect standard robots.txt
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Google-Extended",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
          "Omgilibot",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
