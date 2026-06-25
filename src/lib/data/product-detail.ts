import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import { Product, Review } from "@/models";
import type { CardProduct } from "@/lib/data/home";
import type { ProductSize } from "@/models/types";
import type { SortOrder } from "mongoose";

/**
 * Product detail page data layer. Distinct from `lib/data/products.ts`
 * (which returns the flat `CardProduct` shape for grids/rails) — a
 * detail page needs the full variant matrix, stock per size/color
 * combination, and review aggregates, none of which a listing card
 * needs.
 */

export interface VariantOption {
  id: string;
  sku: string;
  size: ProductSize;
  color: string;
  colorHex?: string;
  stock: number;
  price: number;
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  description: string;
  category: { id: string; name: string; slug: string };
  images: { url: string; alt?: string }[];
  price: number;
  compareAtPrice?: number;
  variants: VariantOption[];
  /** Unique sizes/colors across all variants, in catalog order — drives the selector UI. */
  sizes: ProductSize[];
  colors: { name: string; hex?: string }[];
  totalStock: number;
  tags: string[];
}

/**
 * Fetches a single product by slug with the full variant matrix
 * needed for the size/color selectors and inventory display. Returns
 * `null` for a missing or inactive product — the page itself calls
 * Next.js's `notFound()` on a `null` result, keeping "not found" a
 * page-level concern rather than baked into the data layer.
 */
export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  await connectToDatabase();

  const product = await Product.findOne({ slug, isActive: true })
    .populate<{
      category: { _id: { toString(): string }; name: string; slug: string };
    }>("category", "name slug")
    .lean();

  if (!product) return null;

  const variants: VariantOption[] = product.variants.map((variant) => ({
    id: (variant as unknown as { _id?: { toString(): string } })._id?.toString() ?? variant.sku,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    colorHex: variant.colorHex,
    stock: variant.stock,
    price: variant.priceOverride ?? product.price,
  }));

  // Preserve first-seen order from the variant list (catalog order)
  // rather than alphabetizing — sizes/colors typically have a
  // merchandiser-intended order (S before M before L) that
  // `[...new Set()]` over the original array preserves and `.sort()`
  // would discard.
  const sizes = [...new Set(variants.map((v) => v.size))];
  const colorNames = [...new Set(variants.map((v) => v.color))];
  const colors = colorNames.map((name) => ({
    name,
    hex: variants.find((v) => v.color === name)?.colorHex,
  }));

  return {
    id: product._id.toString(),
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    description: product.description,
    category: {
      id: product.category._id.toString(),
      name: product.category.name,
      slug: product.category.slug,
    },
    images: product.images.map((img) => ({ url: img.url, alt: img.alt })),
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    variants,
    sizes,
    colors,
    totalStock: product.totalStock,
    tags: product.tags,
  };
}

function toCardProduct(product: {
  _id: { toString(): string };
  slug: string;
  name: string;
  brand?: string;
  price: number;
  compareAtPrice?: number;
  images: { url: string; alt?: string }[];
}): CardProduct {
  const primaryImage = product.images[0];
  return {
    id: product._id.toString(),
    slug: product.slug,
    name: product.name,
    label: product.brand ?? "Maison Noir",
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    hasImage: Boolean(primaryImage),
    imageUrl: primaryImage?.url,
    imageAlt: primaryImage?.alt ?? product.name,
  };
}

/** Same-category active products, excluding the current one. Falls
 * back to recent products from any category if the current product's
 * category doesn't have enough siblings, so the section never renders
 * with fewer than a handful of items (or none at all) on a thin
 * catalog. */
export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4,
): Promise<CardProduct[]> {
  await connectToDatabase();

  const sameCategory = await Product.find({
    _id: { $ne: productId },
    category: categoryId,
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("slug name brand price compareAtPrice images")
    .lean();

  if (sameCategory.length >= limit) {
    return sameCategory.map(toCardProduct);
  }

  const remaining = limit - sameCategory.length;
  const excludeIds = [
    productId,
    ...sameCategory.map((p) => p._id.toString()),
  ];

  const fallback = await Product.find({
    _id: { $nin: excludeIds },
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .limit(remaining)
    .select("slug name brand price compareAtPrice images")
    .lean();

  return [...sameCategory, ...fallback].map(toCardProduct);
}

export interface ReviewListItem {
  id: string;
  userName: string;
  userImage?: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
}

export interface ReviewSummary {
  reviews: ReviewListItem[];
  total: number;
  page: number;
  totalPages: number;
  /**
   * Computed live from approved reviews so the value is always
   * consistent with what's on screen. The Review model's post-save /
   * post-delete hooks also keep `Product.ratingAverage` in sync, so
   * listing pages can read it cheaply without recomputing.
   */
  ratingAverage: number;
  ratingCount: number;
  /** Count of approved reviews at each star rating, 1 through 5 —
   * computed across ALL approved reviews, not just the current page,
   * so the breakdown bars stay stable while paging. */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

const REVIEWS_PAGE_SIZE = 5;

/** Paginated, approved reviews for a product, plus the live rating
 * average/distribution. */
export async function getProductReviews(
  productId: string,
  page = 1,
  sort: "newest" | "highest" | "lowest" = "newest",
): Promise<ReviewSummary> {
  await connectToDatabase();

  const filter = { product: productId, isApproved: true };

  const sortOption: Record<string, SortOrder> =
    sort === "highest"
      ? { rating: -1, createdAt: -1 }
      : sort === "lowest"
        ? { rating: 1, createdAt: -1 }
        : { createdAt: -1 };

  const [total, distributionRows, reviews] = await Promise.all([
    Review.countDocuments(filter),
    Review.aggregate<{ _id: number; count: number }>([
      { $match: filter },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]),
    Review.find(filter)
      .sort(sortOption)
      .skip((page - 1) * REVIEWS_PAGE_SIZE)
      .limit(REVIEWS_PAGE_SIZE)
      .populate<{ user: { name: string; image?: string } }>(
        "user",
        "name image",
      )
      .lean(),
  ]);

  const distribution: ReviewSummary["distribution"] = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const row of distributionRows) {
    if (row._id >= 1 && row._id <= 5) {
      distribution[row._id as 1 | 2 | 3 | 4 | 5] = row.count;
    }
  }

  const ratingCount = total;
  const ratingAverage =
    ratingCount > 0
      ? Object.entries(distribution).reduce(
          (sum, [star, count]) => sum + Number(star) * count,
          0,
        ) / ratingCount
      : 0;

  const totalPages = Math.max(1, Math.ceil(total / REVIEWS_PAGE_SIZE));

  return {
    reviews: reviews.map((review) => ({
      id: review._id.toString(),
      userName: review.user?.name ?? "Anonymous",
      userImage: review.user?.image,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt,
    })),
    total,
    page: Math.min(page, totalPages),
    totalPages,
    ratingAverage,
    ratingCount,
    distribution,
  };
}
