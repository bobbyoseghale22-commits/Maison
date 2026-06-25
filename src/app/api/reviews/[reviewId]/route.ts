import { NextResponse } from "next/server";
import { deleteReview } from "@/lib/actions/review";
import { connectToDatabase } from "@/lib/db/connect";
import { Review } from "@/models";
import { requireUser, UnauthorizedError } from "@/lib/auth/utils";

type Params = { params: Promise<{ reviewId: string }> };

/**
 * DELETE /api/reviews/[reviewId]
 *
 * Lets an authenticated user delete their own review. The Server
 * Action `deleteReview` scopes the findOneAndDelete to the current
 * user's id so this can never delete someone else's review.
 */
export async function DELETE(_req: Request, { params }: Params) {
  const { reviewId } = await params;

  try {
    await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  // Look up the product slug for cache revalidation
  await connectToDatabase();
  const review = await Review.findById(reviewId)
    .populate<{ product: { slug: string } | null }>("product", "slug")
    .lean();

  if (!review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  const productSlug = review.product?.slug ?? "";
  const result = await deleteReview(reviewId, productSlug);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 403 });
  }

  return NextResponse.json({ deleted: true });
}
