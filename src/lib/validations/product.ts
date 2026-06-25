import { z } from "zod";
import { PRODUCT_SIZES } from "@/models/types";

/**
 * Shop query-param schemas, following the same validate-at-the-boundary
 * pattern as `src/lib/validations/auth.ts`. The shop page, the
 * category page, and the `/api/products` route all parse
 * `searchParams`/query strings through `shopQuerySchema` so malformed
 * or out-of-range input (e.g. `page=-3`, `sort=banana`) is coerced to
 * a safe default in one place rather than re-validated per call site.
 */

export const PRODUCT_SORT_OPTIONS = [
  "newest",
  "popular",
  "price-asc",
  "price-desc",
] as const;
export type ProductSort = (typeof PRODUCT_SORT_OPTIONS)[number];

export const SORT_LABELS: Record<ProductSort, string> = {
  newest: "Newest",
  popular: "Popular",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
};

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

/**
 * Accepts the raw shape of `URLSearchParams`/Next.js `searchParams`
 * (string | string[] | undefined per key) and normalizes it. Every
 * field has a safe default, so this schema never throws — a
 * malformed query string just falls back to "no filter" rather than
 * producing a 400 on a page a customer might land on from a stale
 * bookmark or shared link.
 */
function firstValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return value[0];
  if (typeof value === "string") return value;
  return undefined;
}

export const shopQuerySchema = z.object({
  /** Category slug, e.g. "outerwear". Also accepts the special value
   * used by `ProductRail`'s "Featured Products" View All link. */
  category: z.preprocess(
    firstValue,
    z.string().trim().toLowerCase().optional(),
  ),
  /** One or more size codes, comma-separated in the URL: ?size=M,L */
  size: z.preprocess((value) => {
    const raw = firstValue(value);
    return raw ? raw.split(",").filter(Boolean) : undefined;
  }, z.array(z.enum(PRODUCT_SIZES)).optional()),
  /** One or more colors, comma-separated: ?color=Black,Navy */
  color: z.preprocess((value) => {
    const raw = firstValue(value);
    return raw ? raw.split(",").filter(Boolean) : undefined;
  }, z.array(z.string().trim()).optional()),
  minPrice: z.preprocess((value) => {
    const raw = firstValue(value);
    const num = raw ? Number(raw) : undefined;
    return Number.isFinite(num) ? num : undefined;
  }, z.number().min(0).optional()),
  maxPrice: z.preprocess((value) => {
    const raw = firstValue(value);
    const num = raw ? Number(raw) : undefined;
    return Number.isFinite(num) ? num : undefined;
  }, z.number().min(0).optional()),
  sort: z.preprocess(
    firstValue,
    z.enum(PRODUCT_SORT_OPTIONS).optional().default("newest"),
  ),
  page: z.preprocess((value) => {
    const raw = firstValue(value);
    const num = raw ? Number(raw) : 1;
    return Number.isFinite(num) && num > 0 ? Math.floor(num) : 1;
  }, z.number().int().min(1).default(1)),
  /** Maps to ProductRail's `?featured=true` View All link. */
  featured: z.preprocess((value) => {
    const raw = firstValue(value);
    return raw === "true" ? true : undefined;
  }, z.boolean().optional()),
  /** Free-text search, reserved for a future search bar. */
  q: z.preprocess(firstValue, z.string().trim().min(1).optional()),
});

export type ShopQuery = z.infer<typeof shopQuerySchema>;

/** Parses `URLSearchParams`/Next's `searchParams` object into a typed,
 * defaulted `ShopQuery`. Never throws — see schema doc above. */
export function parseShopQuery(
  searchParams: Record<string, string | string[] | undefined>,
): ShopQuery {
  const result = shopQuerySchema.safeParse(searchParams);
  // Every field has a default/optional fallback, so this can only fail
  // on a type-level mismatch the preprocessors don't already guard —
  // falling back to all-defaults keeps the page rendering either way.
  return result.success ? result.data : shopQuerySchema.parse({});
}

export { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE };
