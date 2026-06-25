import { NextResponse, type NextRequest } from "next/server";
import { addToCartSchema } from "@/lib/validations/cart";
import { addItemToCart } from "@/lib/data/cart";
import {
  cartLimiter,
  extractKey,
  rateLimitResponse,
  csrfGuard,
  handleApiError,
} from "@/lib/security";

/**
 * POST /api/cart/items
 *
 * Security: IP-rate-limited (60/min) + CSRF-guarded.
 */
export async function POST(request: NextRequest) {
  const key = extractKey(request, "ip", "cart");
  const rl = cartLimiter.check(key);
  if (!rl.success) return rateLimitResponse(rl);

  const csrf = csrfGuard(request);
  if (csrf) return csrf;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = addToCartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 422 },
    );
  }

  try {
    const cart = await addItemToCart(parsed.data);
    return NextResponse.json(cart, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("not found") || message.includes("unavailable")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("stock") || message.includes("cart")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return handleApiError(err, "[POST /api/cart/items]");
  }
}
