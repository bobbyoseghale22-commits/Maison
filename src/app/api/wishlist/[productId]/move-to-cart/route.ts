import { NextResponse, type NextRequest } from "next/server";

import { addToCartSchema } from "@/lib/validations/cart";
import { addItemToCart } from "@/lib/data/cart";
import { removeFromWishlist } from "@/lib/data/wishlist";
import { UnauthorizedError } from "@/lib/auth/utils";

/**
 * POST /api/wishlist/[productId]/move-to-cart
 *
 * Atomic "move" — adds the product variant to the cart then removes
 * it from the wishlist. The body must include the size and color the
 * user selected in the picker (wishlist items don't commit to a
 * variant at save time, only at move time).
 *
 * If adding to cart fails (out of stock, product removed), the
 * wishlist item is left untouched so the user doesn't lose their save.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = addToCartSchema.safeParse({ ...(body as object), productId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 422 },
    );
  }

  try {
    // Add to cart first — if this throws, the wishlist item is kept.
    const cart = await addItemToCart(parsed.data);

    // Cart add succeeded — now remove from wishlist.
    const wishlist = await removeFromWishlist(productId);

    return NextResponse.json({ cart, wishlist });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Failed to move item.";
    const status = message.includes("stock") || message.includes("unavailable") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
