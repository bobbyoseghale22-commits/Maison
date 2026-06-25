import "server-only";

import { stripe } from "@/lib/stripe/config";
import { connectToDatabase } from "@/lib/db/connect";
import { Cart, Order, Product, Coupon } from "@/models";
import { getCurrentUser } from "@/lib/auth/utils";
import { readGuestId } from "@/lib/cart/guest-id";
import { validateCoupon, computeTotals } from "@/lib/data/checkout";
import { generateOrderNumber } from "@/lib/helpers";
import { env } from "@/config/env";
import type { CheckoutInput } from "@/lib/validations/checkout";

const BASE_URL = env.NEXT_PUBLIC_APP_URL;

/**
 * Validates the cart, resolves coupon/totals, persists a pending Order
 * (status=pending, paymentStatus=unpaid), then creates a Stripe
 * Checkout Session tied to that order via `client_reference_id`.
 *
 * Stock is NOT decremented here — that only happens in the webhook
 * handler after Stripe confirms payment, so abandoned sessions don't
 * consume inventory.
 *
 * Returns the Stripe session URL to redirect the customer to.
 */
export async function createCheckoutSession(
  input: CheckoutInput,
): Promise<{ sessionUrl: string; orderNumber: string }> {
  await connectToDatabase();

  const user = await getCurrentUser();
  const guestId = user ? null : await readGuestId();

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

  if (!user && !input.guestEmail) {
    throw new Error("Email is required for guest checkout.");
  }

  // --- Validate items & build line items for Stripe ---
  const orderItems = [];
  const stripeLineItems = [];

  for (const item of cart.items) {
    const product = item.product as (typeof cart.items)[0]["product"];

    if (!product?.isActive) {
      throw new Error(`"${(product as { name?: string })?.name ?? "A product"}" is no longer available.`);
    }

    const variant = product.variants.find((v) => v.sku === item.sku);
    if (!variant || variant.stock < item.quantity) {
      throw new Error(
        `"${product.name}" (${item.size}/${item.color}) has insufficient stock.`,
      );
    }

    const unitPrice = item.priceAtAdd;

    orderItems.push({
      product: product._id.toString(),
      name: product.name,
      image: product.images[0]?.url ?? "",
      sku: item.sku,
      size: item.size,
      color: item.color,
      unitPrice,
      quantity: item.quantity,
    });

    stripeLineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: Math.round(unitPrice * 100), // Stripe expects cents
        product_data: {
          name: product.name,
          description: `${item.size} / ${item.color}`,
          images: product.images[0]?.url ? [product.images[0].url] : [],
        },
      },
      quantity: item.quantity,
    });
  }

  // --- Coupon ---
  let couponView = null;
  let couponDoc = null;
  let stripeCouponId: string | undefined;

  if (input.couponCode) {
    const subtotal = orderItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    couponView = await validateCoupon(input.couponCode, subtotal);
    couponDoc = await Coupon.findById(couponView.couponId);

    // Create a one-time Stripe coupon matching our computed discount
    const stripeCoupon = await stripe.coupons.create(
      couponView.type === "percentage"
        ? { percent_off: couponView.value, duration: "once" }
        : { amount_off: Math.round(couponView.discountAmount * 100), currency: "usd", duration: "once" },
    );
    stripeCouponId = stripeCoupon.id;
  }

  // --- Totals ---
  const subtotal = orderItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const totals = computeTotals(subtotal, couponView);

  // --- Create pending Order first so we have a reference ID ---
  let order = null;
  let attempts = 0;

  while (!order && attempts < 5) {
    attempts++;
    const orderNumber = generateOrderNumber();
    try {
      order = await Order.create({
        orderNumber,
        ...(user ? { user: user.id } : { guestEmail: input.guestEmail }),
        items: orderItems,
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress,
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
      const isMongoError = typeof err === "object" && err !== null && "code" in err;
      if (isMongoError && (err as { code: unknown }).code === 11000 && attempts < 5) continue;
      throw err;
    }
  }

  if (!order) throw new Error("Failed to generate a unique order number.");

  // --- Stripe Checkout Session ---
  const customerEmail = user?.email ?? input.guestEmail ?? undefined;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: stripeLineItems,
    // Shipping and tax handled by us, not Stripe (simpler; Stripe Tax
    // is a future enhancement). Add as a separate line item so the
    // receipt is accurate.
    ...(totals.shippingCost > 0 || totals.tax > 0
      ? {
          shipping_options: [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: {
                  amount: Math.round((totals.shippingCost + totals.tax) * 100),
                  currency: "usd",
                },
                display_name: "Shipping & Tax",
              },
            },
          ],
        }
      : {}),
    ...(stripeCouponId
      ? { discounts: [{ coupon: stripeCouponId }] }
      : {}),
    ...(customerEmail ? { customer_email: customerEmail } : {}),
    client_reference_id: order._id.toString(),
    success_url: `${BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/checkout/cancel?order=${order.orderNumber}`,
    metadata: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    },
  });

  // Persist session ID for webhook reconciliation
  await Order.updateOne(
    { _id: order._id },
    { stripeCheckoutSessionId: session.id },
  );

  if (!session.url) throw new Error("Stripe did not return a session URL.");

  return { sessionUrl: session.url, orderNumber: order.orderNumber };
}
