import { NextResponse, type NextRequest } from "next/server";

import { searchSuggestionsQuerySchema } from "@/lib/validations/search";
import { getSearchSuggestions } from "@/lib/data/search";

/**
 * GET /api/search/suggestions?q=...
 *
 * Fast typeahead endpoint backing `SearchBar`'s debounced dropdown.
 * Deliberately separate from `GET /api/products` (the full,
 * filterable/paginated listing) — suggestions need a small, capped
 * payload and don't carry pagination, sort, or filter facets.
 *
 * An empty/missing `q` returns an empty result set with a 200 rather
 * than a 400 — the search input fires this on every keystroke once
 * debounced, including the moment it's cleared back to empty, and
 * that's a normal state, not a client error.
 */
export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q") ?? "";
  const parsed = searchSuggestionsQuerySchema.safeParse({ q: rawQuery });

  if (!parsed.success) {
    return NextResponse.json(
      { products: [], categories: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const suggestions = await getSearchSuggestions(parsed.data.q);

    return NextResponse.json(suggestions, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("[GET /api/search/suggestions]", error);
    return NextResponse.json(
      { error: "Failed to load suggestions." },
      { status: 500 },
    );
  }
}
