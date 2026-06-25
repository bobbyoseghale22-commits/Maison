import { z } from "zod";
import { PRODUCT_SIZES } from "@/models/types";

/**
 * Cart-related Zod schemas, following the same validate-at-the-boundary
 * pattern as `src/lib/validations/auth.ts` and `product.ts`. Used by
 * the add-to-cart Server Action (`src/lib/actions/cart.ts`) so a
 * tampered or malformed client payload (e.g. a size that isn't a real
 * `ProductSize`) is rejected before it reaches Mongoose.
 */
export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  size: z.enum(PRODUCT_SIZES, {
    errorMap: () => ({ message: "Invalid size" }),
  }),
  color: z.string().trim().min(1, "Color is required"),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(10, "Quantity cannot exceed 10 per addition"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartItemSchema = z.object({
  itemId: z.string().min(1, "Cart item is required"),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(10, "Quantity cannot exceed 10"),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export const removeCartItemSchema = z.object({
  itemId: z.string().min(1, "Cart item is required"),
});

export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>;
