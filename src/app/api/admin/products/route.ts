import { NextResponse, type NextRequest } from "next/server";
import { productFormSchema } from "@/lib/validations/product-admin";
import { adminCreateProduct } from "@/lib/data/admin-products";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/utils";

/**
 * POST /api/admin/products
 * Creates a new product. Validates with productFormSchema, delegates
 * to adminCreateProduct which handles slug uniqueness and Cloudinary.
 */
export async function POST(request: NextRequest) {
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
    const result = await adminCreateProduct(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Failed to create product.";
    console.error("[POST /api/admin/products]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
