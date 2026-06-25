import { NextResponse, type NextRequest } from "next/server";
import { inventoryPatchSchema } from "@/lib/validations/product-admin";
import { adminUpdateVariantStock } from "@/lib/data/admin-products";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/utils";

/**
 * PATCH /api/admin/products/[productId]/inventory
 * Updates a single variant's stock. Used by the inventory page for
 * inline edits. Accepts { variantId, stock }.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = inventoryPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data." },
      { status: 422 },
    );
  }

  try {
    await adminUpdateVariantStock(productId, parsed.data);
    return NextResponse.json({ updated: true });
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof RangeError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update stock." }, { status: 500 });
  }
}
