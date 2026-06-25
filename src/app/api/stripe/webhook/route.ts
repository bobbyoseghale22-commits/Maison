import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/config";
import { env } from "@/config/env";
import { connectToDatabase } from "@/lib/db/connect";
import { Order, Product, Cart, Coupon } from "@/models";

/**
 * POST /api/stripe/webhook
 *
 * Receives signed Stripe events. Only `checkout.session.completed` is
 * acted upon — the canonical "payment succeeded" signal for Sessions.
 *
 * On success:
 *  1. Order → status "paid", paymentStatus "paid".
 *  2. Decrement variant stock for each line item.
 *  3. Increment coupon usageCount if applied.
 *  4. Delete the authenticated user's cart document.
 *
 * Idempotent: if `paymentStatus` is already "paid" we return early
 * rather than double-processing. Stripe retries on non-2xx.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    console.error("[webhook] signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutSessionCompleted(
      event.data.object as Stripe.Checkout.Session,
    );
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  const orderId =
    session.client_reference_id ?? session.metadata?.orderId ?? null;

  if (!orderId) {
    console.error("[webhook] checkout.session.completed: no orderId in session");
    return;
  }

  await connectToDatabase();

  const order = await Order.findById(orderId);
  if (!order) {
    console.error(`[webhook] order ${orderId} not found`);
    return;
  }

  if (order.paymentStatus === "paid") return; // idempotency guard

  order.status = "paid";
  order.paymentStatus = "paid";
  order.stripeCheckoutSessionId = session.id;
  if (session.payment_intent) {
    order.stripePaymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent.id;
  }
  await order.save();

  for (const item of order.items) {
    await Product.updateOne(
      { _id: item.product, "variants.sku": item.sku },
      { $inc: { "variants.$.stock": -item.quantity } },
    );
  }

  if (order.coupon) {
    await Coupon.updateOne({ _id: order.coupon }, { $inc: { usageCount: 1 } });
  }

  if (order.user) {
    await Cart.deleteOne({ user: order.user });
  }
}
