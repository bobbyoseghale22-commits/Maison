import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import { Cart, Order, Coupon, Product } from "@/models";
import { getCurrentUser } from "@/lib/auth/utils";
import { readGuestId } from "@/lib/cart/guest-id";
import { generateOrderNumber } from "@/lib/helpers";
import type { AddressInput, CheckoutInput } from "@/lib/validations/checkout";
import type { CouponDocument } from "@/models/Coupon";

// ---------------------------------------------------------------------------
// Pricing constants — placeholder rates until real tax/shipping is wired.
// ---------------------------------------------------------------------------

/** Flat shipping rate in whole currency units (e.g. USD). Free above FREE_SHIPPING_THRESHOLD. */
const FLAT_SHIPPING = 12;
const FREE_SHIPPING_THRESHOLD = 200;
/** Tax rate as a decimal (8%). */
const TAX_RATE = 0.08;

// ---------------------------------------------------------------------------
// View models
// ---------------------------------------------------------------------------

export interface CouponView {
  couponId: string;
  code: string;
  description?: string;
  type: "percentage" | "fixed";
  value: number;
  /** Computed discount amount against the current subtotal. */
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

export interface OrderConfirmation {
  orderId: string;
  orderNumber: string;
  email: string;
  total: number;
  itemCount: number;
}

// ---------------------------------------------------------------------------
// Coupon validation
// ---------------------------------------------------------------------------

/**
 * Validates a coupon code against the current subtotal and (for
 * per-user limits) the current user's order history. Returns the
 * coupon view model on success, throws a descriptive Error on failure.
 *
 * Deliberately does NOT modify `usageCount` here — that happens only
 * when the order is actually created, so an abandoned checkout doesn't
 * consume a redemption.
 */
export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<CouponView> {
  await connectToDatabase();

  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    isActive: true,
  }).lean();

  if (!coupon) throw new Error("Coupon code not found.");

  const now = new Date();
  if (coupon.startsAt > now) throw new Error("Coupon is not yet active.");
  if (coupon.expiresAt < now) throw new Error("Coupon has expired.");

  if (
    typeof coupon.usageLimit === "number" &&
    coupon.usageCount >= coupon.usageLimit
  ) {
    throw new Error("Coupon has reached its usage limit.");
  }

  if (
    typeof coupon.minOrderAmount === "number" &&
    subtotal < coupon.minOrderAmount
  ) {
    throw new Error(
      `A minimum order of $${coupon.minOrderAmount.toFixed(2)} is required for this coupon.`,
    );
  }

  // Per-user limit check (skipped for guests since we can't track them).
  if (coupon.perUserLimit) {
    const user = await getCurrentUser();
    if (user) {
      const used = await Order.countDocuments({
        user: user.id,
        coupon: coupon._id,
      });
      if (used >= coupon.perUserLimit) {
        throw new Error("You have already used this coupon the maximum number of times.");
      }
    }
  }

  const discountAmount = computeDiscount(coupon, subtotal);

  return {
    couponId: coupon._id.toString(),
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: coupon.value,
    discountAmount,
  };
}

function computeDiscount(
  coupon: Pick<
    CouponDocument,
    "type" | "value" | "maxDiscountAmount"
  >,
  subtotal: number,
): number {
  if (coupon.type === "percentage") {
    const raw = (subtotal * coupon.value) / 100;
    return typeof coupon.maxDiscountAmount === "number"
      ? Math.min(raw, coupon.maxDiscountAmount)
      : raw;
  }
  // fixed
  return Math.min(coupon.value, subtotal);
}

// ---------------------------------------------------------------------------
// Totals computation
// ---------------------------------------------------------------------------

/**
 * Computes checkout totals for a given subtotal and optional coupon.
 * Pure — does not touch the database when no coupon code is supplied.
 */
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

// ---------------------------------------------------------------------------
// Order creation
// ---------------------------------------------------------------------------

/**
 * Resolves the current session's cart. Tries authenticated user first,
 * then guest cookie. Returns null if neither exists.
 */
async function resolveCart() {
  const user = await getCurrentUser();
  const filter = user
    ? { user: user.id }
    : (() => {
        // We can't await here inside a ternary, so the call below is
        // deferred to the async wrapper that calls resolveCart().
        return null;
      })();

  if (filter) {
    const cart = await Cart.findOne(filter).lean();
    return cart;
  }
  return null;
}

/**
 * Creates an Order from the current cart, then empties the cart.
 * Validates stock once more at creation time — items can go out of
 * stock between "add to cart" and "place order".
 *
 * Returns the order confirmation. Throws a descriptive Error on any
 * validation failure so the caller (the API route) can surface it.
 */
export async function createOrder(
  input: CheckoutInput,
): Promise<OrderConfirmation> {
  await connectToDatabase();

  const user = await getCurrentUser();
  const guestId = user ? null : await readGuestId();

  // --- Resolve cart ---
  const cartFilter = user ? { user: user.id } : guestId ? { guestId } : null;
  if (!cartFilter) throw new Error("No active cart found.");

  const cart = await Cart.findOne(cartFilter)
    .populate<{
      items: Array<{
        _id: unknown;
        product: {
          _id: { toString(): string };
          name: string;
          price: number;
          images: Array<{ url: string }>;
          variants: Array<{
            sku: string;
            stock: number;
            size: string;
            color: string;
            priceOverride?: number;
          }>;
          isActive: boolean;
        };
        sku: string;
        size: string;
        color: string;
        quantity: number;
        priceAtAdd: number;
      }>;
    }>({ path: "items.product", select: "name price images variants isActive" })
    .exec();

  if (!cart || cart.items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  // Guest checkout requires an email.
  if (!user && !input.guestEmail) {
    throw new Error("Email is required for guest checkout.");
  }

  // --- Validate stock & build order items ---
  const orderItems = [];

  for (const item of cart.items) {
    const product = item.product as (typeof cart.items)[0]["product"];

    if (!product || !product.isActive) {
      throw new Error(`"${(product as { name?: string }).name ?? "A product"}" is no longer available.`);
    }

    const variant = product.variants.find(
      (v) => v.sku === item.sku,
    );

    if (!variant || variant.stock < item.quantity) {
      throw new Error(
        `"${product.name}" (${item.size}/${item.color}) has insufficient stock.`,
      );
    }

    orderItems.push({
      product: product._id.toString(),
      name: product.name,
      image: product.images[0]?.url ?? "",
      sku: item.sku,
      size: item.size,
      color: item.color,
      unitPrice: item.priceAtAdd,
      quantity: item.quantity,
    });
  }

  // --- Coupon ---
  let couponView: CouponView | null = null;
  let couponDoc = null;

  if (input.couponCode) {
    const subtotalForCoupon = orderItems.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0,
    );
    couponView = await validateCoupon(input.couponCode, subtotalForCoupon);
    couponDoc = await Coupon.findById(couponView.couponId);
  }

  // --- Totals ---
  const subtotal = orderItems.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0,
  );
  const totals = computeTotals(subtotal, couponView);

  // --- Build billing address ---
  // The API accepts `billingAddress` as a separate field; the client
  // may copy shippingAddress into it when the user checks
  // "same as shipping" — either way the server just uses what arrives.
  const shippingAddress: AddressInput = input.shippingAddress;
  const billingAddress: AddressInput = input.billingAddress;

  // --- Decrement stock atomically ---
  for (const item of orderItems) {
    await Product.updateOne(
      { _id: item.product, "variants.sku": item.sku },
      { $inc: { "variants.$.stock": -item.quantity } },
    );
  }

  // --- Create Order ---
  let attempts = 0;
  let order = null;

  while (!order && attempts < 5) {
    attempts++;
    const orderNumber = generateOrderNumber();
    try {
      order = await Order.create({
        orderNumber,
        ...(user ? { user: user.id } : { guestEmail: input.guestEmail }),
        items: orderItems,
        shippingAddress,
        billingAddress,
        subtotal: totals.subtotal,
        shippingCost: totals.shippingCost,
        tax: totals.tax,
        discount: totals.discount,
        total: totals.total,
        ...(couponDoc ? { coupon: couponDoc._id } : {}),
        notes: input.notes ?? undefined,
        status: "pending",
        paymentStatus: "unpaid",
      });
    } catch (err: unknown) {
      // Retry on duplicate orderNumber (extremely unlikely but handle it).
      const isMongoError =
        typeof err === "object" &&
        err !== null &&
        "code" in err;
      if (isMongoError && (err as { code: unknown }).code === 11000 && attempts < 5) {
        continue;
      }
      throw err;
    }
  }

  if (!order) throw new Error("Failed to generate a unique order number.");

  // --- Increment coupon usage count ---
  if (couponDoc) {
    await Coupon.updateOne(
      { _id: couponDoc._id },
      { $inc: { usageCount: 1 } },
    );
  }

  // --- Clear cart ---
  await Cart.deleteOne({ _id: cart._id });

  const email =
    user?.email ?? input.guestEmail ?? "";

  return {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    email,
    total: totals.total,
    itemCount: orderItems.reduce((n, i) => n + i.quantity, 0),
  };
}
