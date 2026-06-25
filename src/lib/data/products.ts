import "server-only";

import type { FilterQuery, PipelineStage } from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { Product, Category } from "@/models";
import type { ProductDocument } from "@/models/Product";
import type { CardProduct } from "@/lib/data/home";
import { DEFAULT_PAGE_SIZE, type ShopQuery } from "@/lib/validations/product";

/**
 * Shop/category page data layer. Unlike `src/lib/data/home.ts`, this
 * intentionally does NOT fall back to placeholder content on an empty
 * result — an empty shop grid is a legitimate, expected state (e.g. a
 * category with no products yet, or filters that match nothing) and
 * the page renders its own empty state for that. Falling back to fake
 * products here would make filters look broken ("I filtered by red,
 * why am I seeing placeholder coats?").
 *
 * A genuinely unreachable database still throws — callers (the page,
 * the API route) are responsible for their own error boundary/response,
 * since "DB down" and "no results" need different UI.
 */

export interface ProductListResult {
  products: CardProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** Resolved category document, if `query.category` matched one. */
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string;
  } | null;
  /** Available filter facets computed from the *unfiltered* category
   * scope, so checking one size doesn't make other sizes disappear
   * from the filter list. */
  facets: {
    sizes: string[];
    colors: { name: string; hex?: string }[];
    priceRange: { min: number; max: number };
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

function sortToMongoSort(sort: ShopQuery["sort"]): Record<string, 1 | -1> {
  switch (sort) {
    case "price-asc":
      return { price: 1 };
    case "price-desc":
      return { price: -1 };
    case "popular":
      return { ratingCount: -1, ratingAverage: -1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
}

/** Builds the Mongo filter shared by both the product query and the
 * facet aggregation, minus size/color so facets reflect what's
 * available within the category/price scope rather than the
 * already-narrowed result set.
 *
 * `searchCategoryIds` are category ids whose name/description text
 * matched `query.q` (resolved separately in `getProductList` via
 * `findCategoryIdsMatchingText`, since MongoDB's `$text` can't span a
 * reference/join) — when present, the filter becomes "text matches
 * name/description OR the product belongs to one of these
 * categories," so searching "outerwear" surfaces every product in
 * that category even when the word never appears in any single
 * product's own name/description. */
function buildBaseFilter(
  query: ShopQuery,
  categoryId: string | null,
  searchCategoryIds: string[] = [],
): FilterQuery<ProductDocument> {
  const filter: FilterQuery<ProductDocument> = { isActive: true };

  if (categoryId) {
    filter.category = categoryId;
  }

  if (query.featured) {
    filter.isFeatured = true;
  }

  if (query.q) {
    filter.$or =
      searchCategoryIds.length > 0
        ? [
            { $text: { $search: query.q } },
            { category: { $in: searchCategoryIds } },
          ]
        : [{ $text: { $search: query.q } }];
  }

  if (
    typeof query.minPrice === "number" ||
    typeof query.maxPrice === "number"
  ) {
    const priceFilter: { $gte?: number; $lte?: number } = {};
    if (typeof query.minPrice === "number") priceFilter.$gte = query.minPrice;
    if (typeof query.maxPrice === "number") priceFilter.$lte = query.maxPrice;
    filter.price = priceFilter;
  }

  return filter;
}

/** Adds size/color constraints on top of the base filter — kept
 * separate so `buildBaseFilter` alone can drive facet computation
 * (facets shouldn't shrink to match the user's own size/color picks). */
function applyVariantFilters(
  filter: FilterQuery<ProductDocument>,
  query: ShopQuery,
): FilterQuery<ProductDocument> {
  const variantConditions: FilterQuery<ProductDocument>[] = [];

  if (query.size && query.size.length > 0) {
    variantConditions.push({ "variants.size": { $in: query.size } });
  }
  if (query.color && query.color.length > 0) {
    variantConditions.push({ "variants.color": { $in: query.color } });
  }

  if (variantConditions.length === 0) return filter;

  return { ...filter, $and: variantConditions };
}

/** Resolves a category slug to its id. Products filed directly under
 * the matched category are returned; nested sub-category rollup is
 * intentionally out of scope here since the Category model's
 * parent/child depth isn't bounded — a future enhancement can widen
 * this to a `$graphLookup` once category trees are actually seeded.
 *
 * Exported as `getCategoryBySlug` for callers (e.g. the products
 * page's `generateMetadata`) that only need the category, not a full
 * `getProductList` call with its count/facet aggregations attached. */
export async function getCategoryBySlug(slug: string | undefined): Promise<{
  id: string;
  name: string;
  slug: string;
  description?: string;
} | null> {
  if (!slug) return null;

  await connectToDatabase();

  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) return null;

  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description,
  };
}

async function computeFacets(
  baseFilter: FilterQuery<ProductDocument>,
): Promise<ProductListResult["facets"]> {
  const pipeline: PipelineStage[] = [
    { $match: baseFilter },
    { $unwind: "$variants" },
    {
      $group: {
        _id: null,
        sizes: { $addToSet: "$variants.size" },
        colors: {
          $addToSet: {
            name: "$variants.color",
            hex: "$variants.colorHex",
          },
        },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
  ];

  const [result] = await Product.aggregate<{
    sizes: string[];
    colors: { name: string; hex?: string }[];
    minPrice: number;
    maxPrice: number;
  }>(pipeline);

  if (!result) {
    return { sizes: [], colors: [], priceRange: { min: 0, max: 0 } };
  }

  // De-dupe colors by name (colorHex may vary in casing across
  // variants of the same named color) and sort both facets for a
  // stable, predictable filter UI.
  const colorByName = new Map<string, string | undefined>();
  for (const c of result.colors) {
    if (!colorByName.has(c.name)) colorByName.set(c.name, c.hex);
  }

  return {
    sizes: [...result.sizes].sort(),
    colors: Array.from(colorByName.entries())
      .map(([name, hex]) => ({ name, hex }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    priceRange: { min: result.minPrice, max: result.maxPrice },
  };
}

/** Category ids whose name/description matched `q` via the text
 * index added to `src/models/Category.ts`. Returns an empty array for
 * an empty/whitespace query rather than running a query that would
 * match nothing useful. */
async function findCategoryIdsMatchingText(q: string | undefined): Promise<string[]> {
  if (!q) return [];

  const matches = await Category.find(
    { $text: { $search: q }, isActive: true },
    { _id: 1 },
  ).lean();

  return matches.map((c) => c._id.toString());
}

/**
 * Fetches a filtered, sorted, paginated product list plus the facet
 * data (available sizes/colors/price range) needed to render the
 * filter sidebar. Used by both the `/products` page (shop + category
 * page + search results, depending on which query params are set)
 * and the `/api/products` route.
 */
export async function getProductList(
  query: ShopQuery,
): Promise<ProductListResult> {
  await connectToDatabase();

  const [category, searchCategoryIds] = await Promise.all([
    getCategoryBySlug(query.category),
    findCategoryIdsMatchingText(query.q),
  ]);

  // A category slug was given but didn't resolve to anything active —
  // scope to an id no product can have, so the query legitimately
  // returns zero results instead of silently ignoring the filter.
  const categoryId = query.category
    ? (category?.id ?? "000000000000000000000000")
    : null;

  const baseFilter = buildBaseFilter(query, categoryId, searchCategoryIds);
  const filter = applyVariantFilters(baseFilter, query);

  const pageSize = DEFAULT_PAGE_SIZE;

  // `total` must be known before computing `skip` — clamping the
  // *reported* page after already querying with an out-of-range skip
  // would show "page 3 of 3" while rendering an empty grid (the query
  // ran with the original, unclamped page). Count and facets first,
  // then fetch the correctly-skipped page.
  const [total, facets] = await Promise.all([
    Product.countDocuments(filter),
    computeFacets(baseFilter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(query.page, totalPages);
  const skip = (page - 1) * pageSize;

  const items = await Product.find(filter)
    .sort(sortToMongoSort(query.sort))
    .skip(skip)
    .limit(pageSize)
    .select("slug name brand price compareAtPrice images")
    .lean();

  return {
    products: items.map(toCardProduct),
    total,
    page,
    pageSize,
    totalPages,
    category,
    facets,
  };
}

/** All active categories, for the filter sidebar's category list. */
export async function getCategoryFilterOptions(): Promise<
  { id: string; name: string; slug: string }[]
> {
  await connectToDatabase();

  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .select("name slug")
    .lean();

  return categories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
  }));
}
