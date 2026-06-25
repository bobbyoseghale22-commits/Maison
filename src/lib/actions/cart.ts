"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/db/connect";
import { Cart, Product } from "@/models";
import { requireUser } from "@/lib/auth/utils";
import { addToCartSchema } from "@/lib/validations/cart";

export interface CartActionResult {
  success: boolean;
  message?: string;
  /** Updated total item count across the cart, for the header badge. */
  itemCount?: number;
}

/**
 * Adds an item to the signed-in user's cart, following the same
 * "validate -> auth -> mutate -> return discriminated result" shape
 * as `registerUser` (`src/lib/actions/auth.ts`). A Server Action
 * rather than a `/api/cart` route since this is invoked directly from
 * the product detail page's "Add to Cart" button — same-origin form
 * submission has no need for a network round trip through a REST
 * endpoint.
 *
 * Re-validates stock server-side against the live `Product` document
 * even though the client already disabled out-of-stock options — the
 * client's view can be stale (another shopper bought the last one
 * moments ago), so this is the actual authority, not a redundant
 * check.
 */
export async function addToCart(input: unknown): Promise<CartActionResult> {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid request.",
    };
  }

  const { productId, size, color, quantity } = parsed.data;

  let user;
  try {
    user = await requireUser();
  } catch {
    return {
      success: false,
      message: "Please sign in to add items to your cart.",
    };
  }

  await connectToDatabase();

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  })
    .select("price variants")
    .lean();

  if (!product) {
    return {
      success: false,
      message: "This product is no longer available.",
    };
  }

  const variant = product.variants.find(
    (v) => v.size === size && v.color === color,
  );

  if (!variant) {
    return {
      success: false,
      message: "This size and color is not available.",
    };
  }

  let cart = await Cart.findOne({ user: user.id });
  const existingItem = cart?.items.find((item) => item.sku === variant.sku);
  const requestedTotal = (existingItem?.quantity ?? 0) + quantity;

  if (requestedTotal > variant.stock) {
    const available = variant.stock - (existingItem?.quantity ?? 0);
    return {
      success: false,
      message:
        available > 0
          ? `Only ${available} more available in this size and color.`
          : "This size and color is out of stock.",
    };
  }

  const unitPrice = variant.priceOverride ?? product.price;

  if (!cart) {
    cart = new Cart({ user: user.id, items: [] });
  }

  if (existingItem) {
    existingItem.quantity = requestedTotal;
  } else {
    cart.items.push({
      product: productId,
      sku: variant.sku,
      size,
      color,
      quantity,
      priceAtAdd: unitPrice,
    });
  }

  await cart.save();

  // The cart icon/badge in the header reads cart state on every
  // navigation — revalidate the whole layout's data rather than a
  // single path, since the header is shared across all routes.
  revalidatePath("/", "layout");

  return {
    success: true,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
