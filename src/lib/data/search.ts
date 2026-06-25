import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import { Product, Category } from "@/models";

/**
 * Search suggestions data layer — distinct from
 * `src/lib/data/products.ts`'s `getProductList`, which powers the
 * full search *results* page (`/products?q=...`). Suggestions need
 * to be fast and minimal (typeahead, not a full filtered/paginated
 * grid), so this returns a small, flat shape and caps result counts
 * tightly rather than reusing the heavier `CardProduct`/facet
 * machinery.
 */

export interface ProductSuggestion {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
}

export interface CategorySuggestion {
  id: string;
  slug: string;
  name: string;
}

export interface SearchSuggestions {
  products: ProductSuggestion[];
  categories: CategorySuggestion[];
}

const SUGGESTION_PRODUCT_LIMIT = 5;
const SUGGESTION_CATEGORY_LIMIT = 3;

/**
 * Returns the top matching products and categories for a partial
 * search term, ranked by MongoDB's `$text` relevance score (via the
 * weighted indexes on `Product` and `Category` — name outranks
 * description, see `src/models/Product.ts` / `Category.ts`).
 *
 * Returns empty arrays for a blank query rather than the most
 * popular/recent products — an empty-but-focused search input
 * showing unrelated suggestions reads as a bug, not a feature.
 */
export async function getSearchSuggestions(
  query: string,
): Promise<SearchSuggestions> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { products: [], categories: [] };
  }

  await connectToDatabase();

  const [products, categories] = await Promise.all([
    Product.find({ $text: { $search: trimmed }, isActive: true })
      .select({
        slug: 1,
        name: 1,
        price: 1,
        images: 1,
        score: { $meta: "textScore" },
      })
      .sort({ score: { $meta: "textScore" } })
      .limit(SUGGESTION_PRODUCT_LIMIT)
      .lean(),
    Category.find({ $text: { $search: trimmed }, isActive: true })
      .select({ slug: 1, name: 1, score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(SUGGESTION_CATEGORY_LIMIT)
      .lean(),
  ]);

  return {
    products: products.map((product) => ({
      id: product._id.toString(),
      slug: product.slug,
      name: product.name,
      image: product.images[0]?.url ?? null,
      price: product.price,
    })),
    categories: categories.map((category) => ({
      id: category._id.toString(),
      slug: category.slug,
      name: category.name,
    })),
  };
}
