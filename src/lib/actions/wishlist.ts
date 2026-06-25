"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { Wishlist, Product } from "@/models";
import { requireUser } from "@/lib/auth/utils";
import { wishlistItemSchema } from "@/lib/validations/wishlist";

export interface WishlistActionResult {
  success: boolean;
  message?: string;
  /** Whether the product is in the wishlist after this action ran. */
  isInWishlist?: boolean;
}

/**
 * Toggles a product in the signed-in user's wishlist — adds it if
 * absent, removes it if present. A single toggle action (rather than
 * separate add/remove actions) matches the UI: one heart button whose
 * state flips, so the action's own contract mirrors that.
 */
export async function toggleWishlistItem(
  input: unknown,
): Promise<WishlistActionResult> {
  const parsed = wishlistItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid request.",
    };
  }

  const { productId } = parsed.data;

  let user;
  try {
    user = await requireUser();
  } catch {
    return {
      success: false,
      message: "Please sign in to save items to your wishlist.",
    };
  }

  await connectToDatabase();

  const product = await Product.findOne({ _id: productId, isActive: true })
    .select("_id")
    .lean();

  if (!product) {
    return {
      success: false,
      message: "This product is no longer available.",
    };
  }

  let wishlist = await Wishlist.findOne({ user: user.id });

  if (!wishlist) {
    wishlist = new Wishlist({ user: user.id, items: [] });
  }

  const existingIndex = wishlist.items.findIndex(
    (item) => item.product.toString() === productId,
  );

  let isInWishlist: boolean;

  if (existingIndex >= 0) {
    wishlist.items.splice(existingIndex, 1);
    isInWishlist = false;
  } else {
    wishlist.items.push({ product: new Types.ObjectId(productId), addedAt: new Date() });
    isInWishlist = true;
  }

  await wishlist.save();

  revalidatePath("/", "layout");

  return { success: true, isInWishlist };
}

/** Returns whether a product is in the current user's wishlist, or
 * `false` (never throws) for a signed-out visitor — used to set the
 * heart button's initial state on page load. */
export async function isProductInWishlist(
  productId: string,
): Promise<boolean> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return false;
  }

  await connectToDatabase();

  const wishlist = await Wishlist.findOne({
    user: user.id,
    "items.product": productId,
  })
    .select("_id")
    .lean();

  return Boolean(wishlist);
}
