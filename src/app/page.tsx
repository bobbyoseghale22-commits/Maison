import type { Metadata } from "next";

import {
  getFeaturedCategories,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
} from "@/lib/data/home";

import { HeroBanner } from "@/components/sections/hero-banner";
import { FeaturedCategories } from "@/components/sections/featured-categories";
import { ProductRail } from "@/components/sections/product-rail";
import { PromoBanner } from "@/components/sections/promo-banner";
import { NewsletterSignup } from "@/components/sections/newsletter-signup";
import { FooterCta } from "@/components/sections/footer-cta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maison Noir — Considered Menswear",
  description:
    "Tailored menswear cut from the finest cloth. Shop suiting, outerwear, footwear, and accessories built to last seasons, not trends.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Maison Noir — Considered Menswear",
    description:
      "Tailored menswear cut from the finest cloth. Shop suiting, outerwear, footwear, and accessories built to last seasons, not trends.",
    type: "website",
    url: "/",
    siteName: "Maison Noir",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@maisonnoir",
    title: "Maison Noir — Considered Menswear",
    description:
      "Tailored menswear cut from the finest cloth. Shop suiting, outerwear, footwear, and accessories.",
  },
};

/**
 * Home page. Server Component end-to-end except for the two small
 * interactive islands (`MobileNav` in the global header, and
 * `NewsletterSignup`'s submit state) — every section here is static
 * HTML on the server, so there's no client-side data fetching
 * waterfall and no layout shift while JS hydrates.
 *
 * Data for the four product/category sections is fetched in
 * parallel (`Promise.all`) rather than sequentially, so one slow
 * query doesn't block the others.
 */
export default async function HomePage() {
  const [featuredCategories, featuredProducts, newArrivals, bestSellers] =
    await Promise.all([
      getFeaturedCategories(),
      getFeaturedProducts(),
      getNewArrivals(),
      getBestSellers(),
    ]);

  return (
    <>
      <HeroBanner />

      <FeaturedCategories categories={featuredCategories} />

      <ProductRail
        id="featured-products"
        eyebrow="Curated"
        title="Featured Products"
        description="Hand-picked pieces from this season's collection."
        viewAllHref="/products?featured=true"
        products={featuredProducts}
        priority
      />

      <PromoBanner />

      <ProductRail
        id="new-arrivals"
        eyebrow="Just In"
        title="New Arrivals"
        description="The latest additions to the collection."
        viewAllHref="/products?sort=newest"
        products={newArrivals}
      />

      <ProductRail
        id="best-sellers"
        eyebrow="Most Loved"
        title="Best Sellers"
        description="The pieces our customers return for, again and again."
        viewAllHref="/products?sort=bestselling"
        products={bestSellers}
      />

      <NewsletterSignup />

      <FooterCta />
    </>
  );
}
