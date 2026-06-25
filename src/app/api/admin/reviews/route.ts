import { NextResponse, type NextRequest } from "next/server";
import { adminGetReviews } from "@/lib/data/admin-reviews";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/utils";

/**
 * GET /api/admin/reviews?page=1&approved=true&rating=1
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = Number(sp.get("page") ?? "1");
  const approvedParam = sp.get("approved");
  const ratingParam = sp.get("rating");

  const filter: { approved?: boolean; rating?: number } = {};
  if (approvedParam === "true") filter.approved = true;
  if (approvedParam === "false") filter.approved = false;
  if (ratingParam) filter.rating = Number(ratingParam);

  try {
    const result = await adminGetReviews(page, filter);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load reviews." }, { status: 500 });
  }
}
