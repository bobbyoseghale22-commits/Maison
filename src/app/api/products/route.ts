import { NextResponse, type NextRequest } from "next/server";

import { parseShopQuery } from "@/lib/validations/product";
import { getProductList } from "@/lib/data/products";

/**
 * GET /api/products
 *
 * Filtered, sorted, paginated product listing — the same query the
 * shop/category page (`src/app/(shop)/products/page.tsx`) renders
 * server-side, exposed as a standalone JSON endpoint for any client
 * that isn't a Next.js page render (a future mobile app, a partner
 * integration, programmatic access, etc.).
 *
 * Query params (all optional): category, size, color, minPrice,
 * maxPrice, sort, page, featured, q — see
 * `src/lib/validations/product.ts` for the full schema. Malformed
 * values are coerced to defaults rather than rejected, matching the
 * page's behavior so a shared link never 400s.
 *
 * The page itself does NOT call this route (it queries
 * `getProductList` directly, which is faster and avoids a
 * same-origin network round trip) — this route exists for external
 * consumers, not as the page's own data source.
 */
export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const query = parseShopQuery(searchParams);

  try {
    const result = await getProductList(query);

    return NextResponse.json(
      {
        products: result.products,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
        category: result.category,
        facets: result.facets,
      },
      {
        headers: {
          // Listings change as inventory/products update — short
          // public cache with revalidation rather than no-store,
          // so repeated identical requests within the window don't
          // all hit Mongo.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json(
      { error: "Failed to load products." },
      { status: 500 },
    );
  }
}
