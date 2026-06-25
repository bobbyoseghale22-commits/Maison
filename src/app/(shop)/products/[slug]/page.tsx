import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getProductBySlug,
  getRelatedProducts,
  getProductReviews,
} from "@/lib/data/product-detail";
import { isProductInWishlist } from "@/lib/actions/wishlist";
import { getUserReviewForProduct } from "@/lib/actions/review";
import { formatCurrency } from "@/lib/helpers";
import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models";
import { env } from "@/config/env";

import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfo } from "@/components/product/product-info";
import { RelatedProducts } from "@/components/product/related-products";
import { ProductReviews } from "@/components/product/product-reviews";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

// ISR: revalidate every hour. Product data changes infrequently;
// caching keeps TTFB fast on Render's single-region deployment.
export const revalidate = 3600;

/**
 * generateStaticParams — pre-render the 50 most recently updated
 * active products at build time (ISR renders the rest on first visit).
 * This keeps cold-start TTFB fast for the highest-traffic pages
 * without blocking a full catalog build.
 */
export async function generateStaticParams() {
  try {
    await connectToDatabase();
    const products = await Product.find({ isActive: true })
      .sort({ updatedAt: -1 })
      .limit(50)
      .select("slug")
      .lean();
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const primaryImage = product.images[0];
  const url = `/products/${product.slug}`;
  const fullUrl = `${env.NEXT_PUBLIC_APP_URL}${url}`;

  // Build a rich description with brand, category, and price hint
  const description = [
    product.description.slice(0, 130),
    product.brand ? `By ${product.brand}.` : null,
    `From ${formatCurrency(product.price, { isWholeUnit: true })}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title: product.name,
    description,
    alternates: { canonical: url },

    openGraph: {
      type: "website", // "product" not in the Next.js union type yet
      title: `${product.name} | Maison Noir`,
      description,
      url,
      siteName: "Maison Noir",
      locale: "en_US",
      images: primaryImage
        ? [
            {
              url: primaryImage.url,
              width: 1200,
              height: 1500,
              alt: primaryImage.alt ?? product.name,
            },
          ]
        : undefined,
    },

    twitter: {
      card: "summary_large_image",
      site: "@maisonnoir",
      title: `${product.name} | Maison Noir`,
      description,
      images: primaryImage ? [primaryImage.url] : undefined,
    },

    // Don't index out-of-stock products that are still active
    ...(product.totalStock === 0
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}

/**
 * Product detail page. Reads `?page` and `?sort` from searchParams
 * so the review section is server-rendered and deep-linkable —
 * paging and sorting navigate to a real URL rather than fetching
 * client-side, which keeps the page fully cacheable and accessible.
 */
export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const reviewPage = Number(sp.page ?? "1");
  const reviewSort = (sp.sort ?? "newest") as "newest" | "highest" | "lowest";

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [relatedProducts, reviewSummary, inWishlist, existingReview] =
    await Promise.all([
      getRelatedProducts(product.id, product.category.id),
      getProductReviews(product.id, reviewPage, reviewSort),
      isProductInWishlist(product.id),
      getUserReviewForProduct(product.id),
    ]);

  // ---------- Product schema.org JSON-LD ----------
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url: `${env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(product.images.length > 0
      ? { image: product.images.map((img) => img.url) }
      : {}),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: product.price,
      highPrice: product.price,
      offerCount: product.variants.length,
      availability:
        product.totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Maison Noir" },
    },
    ...(reviewSummary.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewSummary.ratingAverage.toFixed(1),
            reviewCount: reviewSummary.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <div>
        <div className="container py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-label text-foreground/40">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/products" className="hover:text-foreground">
                  Shop
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="hover:text-foreground"
                >
                  {product.category.name}
                </Link>
              </li>
            </ol>
          </nav>

          <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
            <ProductGallery images={product.images} productName={product.name} />
            <ProductInfo product={product} initialIsInWishlist={inWishlist} />
          </div>
        </div>

        <RelatedProducts
          products={relatedProducts}
          categorySlug={product.category.slug}
        />

        <ProductReviews
          productId={product.id}
          productSlug={product.slug}
          summary={reviewSummary}
          page={reviewPage}
          sort={reviewSort}
          existingReview={existingReview}
        />
      </div>
    </>
  );
}
