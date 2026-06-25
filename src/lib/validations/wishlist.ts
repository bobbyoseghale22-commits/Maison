import { z } from "zod";

/**
 * Wishlist-related Zod schemas, following the same pattern as
 * `cart.ts`. Used by the wishlist Server Actions
 * (`src/lib/actions/wishlist.ts`).
 */
export const wishlistItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
});

export type WishlistItemInput = z.infer<typeof wishlistItemSchema>;
