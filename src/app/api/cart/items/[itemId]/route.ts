import { NextResponse, type NextRequest } from "next/server";
import { updateCartItem, removeCartItem } from "@/lib/data/cart";

/**
 * PATCH /api/cart/items/[itemId]   – update quantity
 * DELETE /api/cart/items/[itemId]  – remove item
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const quantity = typeof body === "object" && body !== null && "quantity" in body
    ? Number((body as Record<string, unknown>).quantity)
    : NaN;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    return NextResponse.json(
      { error: "Quantity must be an integer between 1 and 10." },
      { status: 422 },
    );
  }

  try {
    const cart = await updateCartItem(itemId, quantity);
    return NextResponse.json(cart);
  } catch (err) {
    if (err instanceof RangeError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[PATCH /api/cart/items/:id]", err);
    return NextResponse.json({ error: "Failed to update item." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;

  try {
    const cart = await removeCartItem(itemId);
    return NextResponse.json(cart);
  } catch (err) {
    if (err instanceof RangeError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[DELETE /api/cart/items/:id]", err);
    return NextResponse.json({ error: "Failed to remove item." }, { status: 500 });
  }
}
