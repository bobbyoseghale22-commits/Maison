import { NextResponse } from "next/server";

import { getProductBySlug } from "@/lib/data/product-detail";

/**
 * GET /api/products/[slug]
 *
 * Full product detail (variant matrix, sizes, colors, stock) as a
 * standalone JSON endpoint, mirroring `getProductBySlug` — the same
 * function the product detail page
 * (`src/app/(shop)/products/[slug]/page.tsx`) calls directly for its
 * own server render. This route exists for external consumers (a
 * future mobile app, programmatic access), not as the page's own
 * data source.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const product = await getProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { product },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error(`[GET /api/products/${slug}]`, error);
    return NextResponse.json(
      { error: "Failed to load product." },
      { status: 500 },
    );
  }
}
