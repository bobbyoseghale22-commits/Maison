import { NextResponse } from "next/server";
import { getCart } from "@/lib/data/cart";
import { connectToDatabase } from "@/lib/db/connect";
import { Cart } from "@/models";
import { getCurrentUser } from "@/lib/auth/utils";
import { readGuestId, clearGuestId } from "@/lib/cart/guest-id";

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

/**
 * DELETE /api/cart
 * Clears the current user's or guest's cart. Called after successful
 * payment so the client can immediately reflect an empty cart without
 * waiting for the Stripe webhook to fire.
 */
export async function DELETE() {
  try {
    await connectToDatabase();
    const user = await getCurrentUser();

    if (user) {
      await Cart.deleteOne({ user: user.id });
    } else {
      const guestId = await readGuestId();
      if (guestId) {
        await Cart.deleteOne({ guestId });
        await clearGuestId();
      }
    }

    return NextResponse.json({ cartId: null, isGuest: !user, items: [], itemCount: 0, subtotal: 0 });
  } catch (err) {
    console.error("[DELETE /api/cart]", err);
    return NextResponse.json({ error: "Failed to clear cart." }, { status: 500 });
  }
}
