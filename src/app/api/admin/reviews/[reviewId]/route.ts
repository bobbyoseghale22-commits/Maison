import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminSetReviewApproval, adminDeleteReview } from "@/lib/data/admin-reviews";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/utils";

type Params = { params: Promise<{ reviewId: string }> };

function authGuard(err: unknown) {
  if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 });
  }
  return null;
}

const patchSchema = z.object({
  isApproved: z.boolean(),
});

/**
 * PATCH /api/admin/reviews/[reviewId]
 * Toggle approval status. { isApproved: boolean }
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { reviewId } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "isApproved (boolean) is required." }, { status: 422 });
  }

  try {
    await adminSetReviewApproval(reviewId, parsed.data.isApproved);
    return NextResponse.json({ updated: true });
  } catch (err) {
    return authGuard(err) ?? NextResponse.json({ error: "Failed to update review." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/reviews/[reviewId]
 * Hard-deletes a review and re-syncs the product rating.
 */
export async function DELETE(_req: Request, { params }: Params) {
  const { reviewId } = await params;

  try {
    await adminDeleteReview(reviewId);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return authGuard(err) ?? NextResponse.json({ error: "Failed to delete review." }, { status: 500 });
  }
}
