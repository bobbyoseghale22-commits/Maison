/**
 * Client-safe checkout utilities — no server-only imports.
 * Types and pure computation functions shared between the server
 * (lib/data/checkout.ts) and client (components/checkout/checkout-form.tsx).
 */

export interface CouponView {
  couponId: string;
  code: string;
  description?: string;
  type: "percentage" | "fixed";
  value: number;
  discountAmount: number;
}

export interface CheckoutTotals {
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  coupon: CouponView | null;
}

const FLAT_SHIPPING = 12;
const FREE_SHIPPING_THRESHOLD = 200;
const TAX_RATE = 0.08;

export function computeTotals(
  subtotal: number,
  coupon: CouponView | null,
): CheckoutTotals {
  const discount = coupon?.discountAmount ?? 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const shippingCost =
    afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const tax = parseFloat((afterDiscount * TAX_RATE).toFixed(2));
  const total = parseFloat((afterDiscount + shippingCost + tax).toFixed(2));
  return { subtotal, shippingCost, tax, discount, total, coupon };
}
