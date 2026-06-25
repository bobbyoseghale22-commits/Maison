import { NextResponse, type NextRequest } from "next/server";
import { checkoutSchema } from "@/lib/validations/checkout";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import {
  checkoutLimiter,
  extractKey,
  rateLimitResponse,
  csrfGuard,
  handleApiError,
} from "@/lib/security";

/**
 * POST /api/checkout
 *
 * Security layers (outer → inner):
 *  1. Rate limit: 20 submissions per 10 min per IP.
 *  2. CSRF: Origin header must match the app URL (production only).
 *  3. Zod validation: full checkoutSchema.
 *  4. Business logic: createCheckoutSession (stock, coupon, totals).
 */
export async function POST(request: NextRequest) {
  // 1. Rate limit
  const key = extractKey(request, "ip", "checkout");
  const rl = checkoutLimiter.check(key);
  if (!rl.success) return rateLimitResponse(rl);

  // 2. CSRF
  const csrf = csrfGuard(request);
  if (csrf) return csrf;

  // 3. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // 4. Validate
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid checkout data.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  // 5. Business logic
  try {
    const { sessionUrl, orderNumber } = await createCheckoutSession(parsed.data);
    return NextResponse.json({ sessionUrl, orderNumber }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    const clientErrors = ["stock", "cart", "coupon", "empty", "email", "available"];
    // Known business errors get 409 with their message (already safe to expose)
    if (clientErrors.some((k) => message.toLowerCase().includes(k))) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return handleApiError(err, "[POST /api/checkout]");
  }
}
