"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/db/connect";
import { Review, Order } from "@/models";
import { requireUser, getCurrentUser } from "@/lib/auth/utils";
import { submitReviewSchema } from "@/lib/validations/review";
import { sanitizeText } from "@/lib/security/sanitize";

export interface ReviewActionResult {
  success: boolean;
  message?: string;
  errors?: Partial<Record<"rating" | "title" | "comment", string[]>>;
}

/**
 * Submits a product review for the signed-in user.
 *
 * One review per user per product is enforced by the unique index on
 * `{ product, user }` in the Review model — surfaced here as a
 * friendly message rather than a raw MongoServerError.
 *
 * `isVerifiedPurchase` is determined server-side by checking for a
 * shipped/delivered order containing this product.
 *
 * `productSlug` is used only to target `revalidatePath` at the exact
 * product page that should show the new review.
 *
 * The Review model's post("save") hook automatically updates
 * `Product.ratingAverage` and `Product.ratingCount` after creation.
 */
export async function submitReview(
  input: unknown,
  productSlug: string,
): Promise<ReviewActionResult> {
  const parsed = submitReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { productId, rating, title, comment } = parsed.data;

  let user;
  try {
    user = await requireUser();
  } catch {
    return {
      success: false,
      message: "Please sign in to write a review.",
    };
  }

  await connectToDatabase();

  const existing = await Review.findOne({ product: productId, user: user.id })
    .select("_id")
    .lean();

  if (existing) {
    return {
      success: false,
      message: "You've already reviewed this product.",
    };
  }

  const verifiedOrder = await Order.findOne({
    user: user.id,
    "items.product": productId,
    status: { $in: ["delivered", "shipped", "paid"] },
  })
    .select("_id")
    .lean();

  // Sanitize user-supplied text fields before persisting — strips any
  // HTML tags so stored content is always plain text.
  const safeTitle = title ? sanitizeText(title, 120) : undefined;
  const safeComment = sanitizeText(comment, 2000);

  // Review.create triggers the post("save") hook → syncProductRating
  await Review.create({
    product: productId,
    user: user.id,
    order: verifiedOrder?._id ?? null,
    rating,
    title: safeTitle || undefined,
    comment: safeComment,
    isVerifiedPurchase: Boolean(verifiedOrder),
    isApproved: true,
  });

  revalidatePath(`/products/${productSlug}`);

  return { success: true };
}

/**
 * Deletes the signed-in user's own review for a product.
 * The Review model's post("findOneAndDelete") hook re-syncs the
 * product's rating aggregate automatically.
 */
export async function deleteReview(
  reviewId: string,
  productSlug: string,
): Promise<ReviewActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, message: "Please sign in." };
  }

  await connectToDatabase();

  const review = await Review.findOneAndDelete({
    _id: reviewId,
    user: user.id, // scope to owner — no one can delete another user's review
  });

  if (!review) {
    return { success: false, message: "Review not found." };
  }

  revalidatePath(`/products/${productSlug}`);
  return { success: true };
}

/**
 * Checks whether the current user has already reviewed a product.
 * Returns null when not signed in (no review possible either way).
 */
export async function getUserReviewForProduct(
  productId: string,
): Promise<{ id: string; rating: number; title?: string; comment: string } | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectToDatabase();

  const review = await Review.findOne({ product: productId, user: user.id })
    .select("rating title comment")
    .lean();

  if (!review) return null;

  return {
    id: review._id.toString(),
    rating: review.rating,
    title: review.title,
    comment: review.comment,
  };
}
