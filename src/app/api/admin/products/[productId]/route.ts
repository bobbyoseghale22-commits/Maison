import { NextResponse, type NextRequest } from "next/server";
import { productFormSchema } from "@/lib/validations/product-admin";
import {
  adminGetProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from "@/lib/data/admin-products";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/utils";

type Params = { params: Promise<{ productId: string }> };

function authError(err: unknown) {
  if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 });
  }
  return null;
}

/** GET /api/admin/products/[productId] */
export async function GET(_req: Request, { params }: Params) {
  const { productId } = await params;
  try {
    const product = await adminGetProduct(productId);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err) {
    return authError(err) ?? NextResponse.json({ error: "Failed to load product." }, { status: 500 });
  }
}

/** PATCH /api/admin/products/[productId] — full replacement update */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { productId } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = productFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product data.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    await adminUpdateProduct(productId, parsed.data);
    return NextResponse.json({ updated: true });
  } catch (err) {
    return authError(err) ?? NextResponse.json({
      error: err instanceof Error ? err.message : "Failed to update product.",
    }, { status: 500 });
  }
}

/** DELETE /api/admin/products/[productId] — also deletes Cloudinary images */
export async function DELETE(_req: Request, { params }: Params) {
  const { productId } = await params;
  try {
    await adminDeleteProduct(productId);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return authError(err) ?? NextResponse.json({ error: "Failed to delete product." }, { status: 500 });
  }
}
