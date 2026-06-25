import { NextResponse, type NextRequest } from "next/server";
import { couponCodeSchema } from "@/lib/validations/checkout";
import { validateCoupon, computeTotals } from "@/lib/data/checkout";
import {
  couponLimiter,
  extractKey,
  rateLimitResponse,
  csrfGuard,
  handleApiError,
} from "@/lib/security";

/**
 * POST /api/checkout/coupon
 *
 * Validates a coupon code against a given subtotal and returns the
 * discount amount and updated totals — used by CouponField for instant
 * feedback without placing an order.
 *
 * Security: IP-rate-limited (30/10 min) + CSRF-guarded.
 * Does NOT increment usageCount; that only happens when the order is placed.
 */
export async function POST(request: NextRequest) {
  const key = extractKey(request, "ip", "coupon");
  const rl = couponLimiter.check(key);
  if (!rl.success) return rateLimitResponse(rl);

  const csrf = csrfGuard(request);
  if (csrf) return csrf;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const bodyObj = typeof body === "object" && body !== null ? body : {};
  const parsed = couponCodeSchema.safeParse(bodyObj);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid coupon code." },
      { status: 422 },
    );
  }

  const subtotal =
    "subtotal" in bodyObj &&
    typeof (bodyObj as Record<string, unknown>).subtotal === "number"
      ? (bodyObj as { subtotal: number }).subtotal
      : 0;

  try {
    const coupon = await validateCoupon(parsed.data.code, subtotal);
    const totals = computeTotals(subtotal, coupon);
    return NextResponse.json({ coupon, totals });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid coupon.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
