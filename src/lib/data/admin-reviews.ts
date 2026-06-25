import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import { Review } from "@/models";
import { requireAdmin } from "@/lib/auth/utils";

const PAGE_SIZE = 25;

export interface AdminReviewRow {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: Date;
}

export interface AdminReviewsResult {
  reviews: AdminReviewRow[];
  total: number;
  page: number;
  totalPages: number;
}

export async function adminGetReviews(
  page = 1,
  filter?: { approved?: boolean; rating?: number },
): Promise<AdminReviewsResult> {
  await requireAdmin();
  await connectToDatabase();

  const match: Record<string, unknown> = {};
  if (filter?.approved !== undefined) match.isApproved = filter.approved;
  if (filter?.rating) match.rating = filter.rating;

  const total = await Review.countDocuments(match);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const skip = (Math.min(page, totalPages) - 1) * PAGE_SIZE;

  const docs = await Review.find(match)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(PAGE_SIZE)
    .populate<{ product: { _id: { toString(): string }; name: string; slug: string } | null }>(
      "product",
      "name slug",
    )
    .populate<{ user: { _id: { toString(): string }; name: string } | null }>(
      "user",
      "name",
    )
    .lean();

  return {
    reviews: docs.map((r) => ({
      id: r._id.toString(),
      productId: r.product?._id?.toString() ?? "",
      productName: r.product?.name ?? "Deleted product",
      productSlug: r.product?.slug ?? "",
      userId: r.user?._id?.toString() ?? "",
      userName: r.user?.name ?? "Deleted user",
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isVerifiedPurchase: r.isVerifiedPurchase,
      isApproved: r.isApproved,
      createdAt: r.createdAt,
    })),
    total,
    page: Math.min(page, totalPages),
    totalPages,
  };
}

/** Approve or reject a review and sync the product's rating aggregate. */
export async function adminSetReviewApproval(
  reviewId: string,
  approved: boolean,
): Promise<void> {
  await requireAdmin();
  await connectToDatabase();

  // findOneAndUpdate triggers the post("findOneAndUpdate") hook in the
  // Review model, which calls syncProductRating automatically.
  await Review.findOneAndUpdate(
    { _id: reviewId },
    { isApproved: approved },
    { new: true },
  );
}

/** Hard-deletes a review and syncs the product's rating aggregate. */
export async function adminDeleteReview(reviewId: string): Promise<void> {
  await requireAdmin();
  await connectToDatabase();

  await Review.findOneAndDelete({ _id: reviewId });
}
