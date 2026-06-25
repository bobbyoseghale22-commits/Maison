import { NextResponse, type NextRequest } from "next/server";

import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models";
import { getProductReviews } from "@/lib/data/product-detail";
import { requireUser, UnauthorizedError } from "@/lib/auth/utils";
import { submitReview } from "@/lib/actions/review";
import {
  reviewLimiter,
  extractKey,
  rateLimitResponse,
  csrfGuard,
  handleApiError,
} from "@/lib/security";

/**
 * GET /api/products/[slug]/reviews?page=1
 * Paginated, approved reviews + rating distribution.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const pageParam = request.nextUrl.searchParams.get("page");
  const page = pageParam && /^\d+$/.test(pageParam) ? Number(pageParam) : 1;

  try {
    await connectToDatabase();

    const product = await Product.findOne({ slug, isActive: true })
      .select("_id")
      .lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const summary = await getProductReviews(product._id.toString(), page);

    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    return handleApiError(err, `[GET /api/products/${slug}/reviews]`);
  }
}

/**
 * POST /api/products/[slug]/reviews
 * Security: rate-limited (5/hour per IP) + CSRF-guarded.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Rate limit
  const key = extractKey(request, "ip", "review");
  const rl = reviewLimiter.check(key);
  if (!rl.success) return rateLimitResponse(rl);

  // CSRF
  const csrf = csrfGuard(request);
  if (csrf) return csrf;

  try {
    await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  await connectToDatabase();

  const product = await Product.findOne({ slug, isActive: true })
    .select("_id")
    .lean();

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await submitReview(
    { ...(body as object), productId: product._id.toString() },
    slug,
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.message ?? "Invalid review.", errors: result.errors },
      { status: result.errors ? 422 : 400 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
