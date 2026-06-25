import { NextResponse, type NextRequest } from "next/server";

import { wishlistItemSchema } from "@/lib/validations/wishlist";
import { getWishlist, addToWishlist, removeFromWishlist } from "@/lib/data/wishlist";
import { UnauthorizedError } from "@/lib/auth/utils";

/**
 * GET /api/wishlist
 * Returns the authenticated user's full wishlist view with populated
 * product data. 401 for unauthenticated visitors.
 */
export async function GET() {
  try {
    const view = await getWishlist();
    return NextResponse.json(view);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[GET /api/wishlist]", err);
    return NextResponse.json({ error: "Failed to load wishlist." }, { status: 500 });
  }
}

/**
 * POST /api/wishlist
 * Adds a product to the wishlist. Idempotent — safe to call when the
 * product is already saved.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = wishlistItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 422 },
    );
  }

  try {
    const view = await addToWishlist(parsed.data.productId);
    return NextResponse.json(view, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Failed to add to wishlist.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}

/**
 * DELETE /api/wishlist
 * Removes a product from the wishlist. Idempotent.
 * Sends productId in the request body to match the POST shape.
 */
export async function DELETE(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = wishlistItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 422 },
    );
  }

  try {
    const view = await removeFromWishlist(parsed.data.productId);
    return NextResponse.json(view);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[DELETE /api/wishlist]", err);
    return NextResponse.json({ error: "Failed to remove from wishlist." }, { status: 500 });
  }
}
