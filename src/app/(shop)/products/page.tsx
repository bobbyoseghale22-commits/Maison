import type { Metadata } from "next";

import { parseShopQuery } from "@/lib/validations/product";
import {
  getProductList,
  getCategoryFilterOptions,
  getCategoryBySlug,
} from "@/lib/data/products";

import { FilterSidebar } from "@/components/shop/filter-sidebar";
import { ShopToolbar } from "@/components/shop/shop-toolbar";
import { ActiveFilters } from "@/components/shop/active-filters";
import { ProductGrid } from "@/components/shop/product-grid";
import { Pagination } from "@/components/shop/pagination";

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// ISR: shop listing data changes when products/categories are updated.
// 15 min is a good balance between freshness and edge-cache hit rate.
export const revalidate = 900;

/**
 * Serves both the "Shop" page (`/products`) and the "Category" page
 * (`/products?category=outerwear`) — one route, since every existing
 * link in the app (`config/nav.ts`, the home page's `ProductRail`
 * "View All" links, `FeaturedCategories`) already points at
 * `/products?category=...` / `/products?sort=...`. A separate
 * `/category/[slug]` route would orphan all of those rather than
 * reuse them.
 */
export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = parseShopQuery(params);

  if (query.q) {
    return {
      title: `Search results for "${query.q}"`,
      description: `Products matching "${query.q}" at Maison Noir.`,
      robots: { index: false, follow: true },
    };
  }

  if (!query.category) {
    return {
      title: "Shop All",
      description:
        "Browse the full Maison Noir collection — tailoring, outerwear, footwear, and accessories.",
      alternates: { canonical: "/products" },
      openGraph: {
        title: "Shop All | Maison Noir",
        description:
          "Browse the full Maison Noir collection — tailoring, outerwear, footwear, and accessories.",
        url: "/products",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "Shop All | Maison Noir",
        description:
          "Browse the full Maison Noir collection — tailoring, outerwear, footwear, and accessories.",
      },
    };
  }

  const category = await getCategoryBySlug(query.category);

  if (!category) {
    return { title: "Shop All", alternates: { canonical: "/products" } };
  }

  const description =
    category.description ??
    `Shop ${category.name} at Maison Noir — considered menswear, cut from the finest cloth.`;

  return {
    title: category.name,
    description,
    alternates: { canonical: `/products?category=${category.slug}` },
    openGraph: {
      title: `${category.name} | Maison Noir`,
      description,
      url: `/products?category=${category.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} | Maison Noir`,
      description,
    },
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const query = parseShopQuery(params);

  const [result, categories] = await Promise.all([
    getProductList(query),
    getCategoryFilterOptions(),
  ]);

  const pageTitle = query.q
    ? `Search results for "${query.q}"`
    : (result.category?.name ?? "Shop All");
  const pageDescription = query.q
    ? `${result.total} ${result.total === 1 ? "product" : "products"} found.`
    : (result.category?.description ??
      "Tailoring, outerwear, footwear, and accessories — built to last seasons, not trends.");
  const pageEyebrow = query.q ? "Search" : result.category ? "Category" : "Shop";

  return (
    <div className="container py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-label text-foreground/40">{pageEyebrow}</p>
        <h1 className="mt-2 font-display text-4xl italic text-foreground sm:text-5xl">
          {pageTitle}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {pageDescription}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <FilterSidebar
              categories={categories}
              facets={result.facets}
              activeCategorySlug={result.category?.slug}
            />
          </div>
        </aside>

        <div>
          <ShopToolbar
            total={result.total}
            sort={query.sort}
            categories={categories}
            facets={result.facets}
            activeCategorySlug={result.category?.slug}
          />

          <div className="mt-6">
            <ActiveFilters categoryName={result.category?.name} />
          </div>

          <div className="mt-8">
            <ProductGrid products={result.products} />
          </div>

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            pathname="/products"
            searchParams={params}
          />
        </div>
      </div>
    </div>
  );
}
