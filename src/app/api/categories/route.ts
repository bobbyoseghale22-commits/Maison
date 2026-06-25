import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db/connect";
import { Category } from "@/models";

/**
 * GET /api/categories
 *
 * Active categories, sorted for display. Powers the same data the
 * shop page's filter sidebar uses (`getCategoryFilterOptions` in
 * `src/lib/data/products.ts`) as a standalone endpoint, for any
 * external consumer that needs the category list without rendering a
 * full page (e.g. a mega-menu data source, a partner integration).
 */
export async function GET() {
  try {
    await connectToDatabase();

    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select("name slug description image parent")
      .lean();

    return NextResponse.json(
      {
        categories: categories.map((category) => ({
          id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          description: category.description ?? null,
          image: category.image ?? null,
          parent: category.parent ? category.parent.toString() : null,
        })),
      },
      {
        headers: {
          // Categories change rarely — cache longer than the
          // products listing.
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return NextResponse.json(
      { error: "Failed to load categories." },
      { status: 500 },
    );
  }
}
