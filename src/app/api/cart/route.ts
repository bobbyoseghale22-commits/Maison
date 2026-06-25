import { NextResponse } from "next/server";
import { getCart } from "@/lib/data/cart";

/**
 * GET /api/cart
 * Returns the current session cart (authenticated user or guest).
 * Returns an empty CartView shape when no cart exists yet rather than
 * 404, so the client hook can initialise with a safe zero-state.
 */
export async function GET() {
  try {
    const cart = await getCart();
    return NextResponse.json(
      cart ?? { cartId: null, isGuest: true, items: [], itemCount: 0, subtotal: 0 },
    );
  } catch (err) {
    console.error("[GET /api/cart]", err);
    return NextResponse.json({ error: "Failed to load cart." }, { status: 500 });
  }
}
