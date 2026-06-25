import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/utils";
import { mergeGuestCartIntoUserCart } from "@/lib/data/cart";

/**
 * POST /api/cart/merge
 * Merges the guest cookie cart into the authenticated user's cart,
 * then clears the guest cookie. Safe to call even when no guest cart
 * exists — it is a no-op in that case. Called client-side immediately
 * after a successful sign-in.
 */
export async function POST() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    await mergeGuestCartIntoUserCart(user.id);
    return NextResponse.json({ merged: true });
  } catch (err) {
    console.error("[POST /api/cart/merge]", err);
    return NextResponse.json({ error: "Failed to merge cart." }, { status: 500 });
  }
}
