import "server-only";

import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { Product, Category } from "@/models";

export interface CardProduct {
  id: string;
  slug: string;
  name: string;
  label?: string;
  price: number;
  compareAtPrice?: number;
  hasImage: boolean;
  imageUrl?: string;
  imageAlt?: string;
}

export interface CardCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  hasImage: boolean;
  imageUrl?: string;
}

const FALLBACK_CATEGORIES: CardCategory[] = [
  {
    id: "fallback-tailoring",
    slug: "tailoring",
    name: "Tailoring",
    description: "Suits, blazers, and trousers cut to a precise line.",
    hasImage: false,
  },
  {
    id: "fallback-outerwear",
    slug: "outerwear",
    name: "Outerwear",
    description: "Overcoats and jackets built for the long season.",
    hasImage: false,
  },
  {
    id: "fallback-footwear",
    slug: "footwear",
    name: "Footwear",
    description: "Oxfords, derbies, and boots in full-grain leather.",
    hasImage: false,
  },
  {
    id: "fallback-accessories",
    slug: "accessories",
    name: "Accessories",
    description: "Leather goods, ties, and the smaller details.",
    hasImage: false,
  },
];

function fallbackProducts(prefix: string, count: number): CardProduct[] {
  const names = [
    "Wool Overcoat",
    "Tailored Blazer",
    "Oxford Shirt",
    "Merino Sweater",
    "Pleated Trouser",
    "Leather Derby",
    "Cashmere Scarf",
    "Chesterfield Coat",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    slug: `${prefix}-${i}`,
    name: names[i % names.length] as string,
    label: "Maison Noir",
    price: 290 + i * 45,
    hasImage: false,
  }));
}

/** Top-level, active categories for the "Featured Categories" grid. */
export const getFeaturedCategories = unstable_cache(
  async (limit = 4): Promise<CardCategory[]> => {
    try {
      await connectToDatabase();

      const categories = await Category.find({ isActive: true, parent: null })
        .sort({ sortOrder: 1 })
        .limit(limit)
        .lean();

      if (categories.length === 0) {
        return FALLBACK_CATEGORIES.slice(0, limit);
      }

      // For each category, resolve image: prefer category.image, fall back to
      // the first image of the most recent active product in that category.
      const results = await Promise.all(
        categories.map(async (category) => {
          let imageUrl: string | undefined = category.image || undefined;

          if (!imageUrl) {
            const product = await Product.findOne({
              isActive: true,
              category: category._id,
            })
              .sort({ createdAt: -1 })
              .select("images")
              .lean();

            imageUrl = product?.images?.[0]?.url || undefined;
          }

          return {
            id: category._id.toString(),
            slug: category.slug,
            name: category.name,
            description: category.description,
            hasImage: Boolean(imageUrl),
            imageUrl,
          };
        }),
      );

      return results;
    } catch {
      return FALLBACK_CATEGORIES.slice(0, limit);
    }
  },
  ["featured-categories"],
  { revalidate: 3600, tags: ["categories"] },
);

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

/** Hand-curated picks (`isFeatured: true`) for the "Featured Products" rail. */
export const getFeaturedProducts = unstable_cache(
  async (limit = 4): Promise<CardProduct[]> => {
    try {
      await connectToDatabase();

      const products = await Product.find({ isActive: true, isFeatured: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("slug name brand price compareAtPrice images")
        .lean();

      if (products.length === 0) {
        return fallbackProducts("featured", limit);
      }

      return products.map(toCardProduct);
    } catch {
      return fallbackProducts("featured", limit);
    }
  },
  ["featured-products"],
  { revalidate: 3600, tags: ["products"] },
);

/** Most recently added active products for the "New Arrivals" rail. */
export const getNewArrivals = unstable_cache(
  async (limit = 4): Promise<CardProduct[]> => {
    try {
      await connectToDatabase();

      const products = await Product.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("slug name brand price compareAtPrice images")
        .lean();

      if (products.length === 0) {
        return fallbackProducts("new", limit);
      }

      return products.map(toCardProduct);
    } catch {
      return fallbackProducts("new", limit);
    }
  },
  ["new-arrivals"],
  { revalidate: 3600, tags: ["products"] },
);

/** Highest rating-volume active products for the "Best Sellers" rail. */
export const getBestSellers = unstable_cache(
  async (limit = 4): Promise<CardProduct[]> => {
    try {
      await connectToDatabase();

      const products = await Product.find({ isActive: true })
        .sort({ ratingCount: -1, ratingAverage: -1 })
        .limit(limit)
        .select("slug name brand price compareAtPrice images")
        .lean();

      if (products.length === 0) {
        return fallbackProducts("bestseller", limit);
      }

      return products.map(toCardProduct);
    } catch {
      return fallbackProducts("bestseller", limit);
    }
  },
  ["best-sellers"],
  { revalidate: 3600, tags: ["products"] },
);
