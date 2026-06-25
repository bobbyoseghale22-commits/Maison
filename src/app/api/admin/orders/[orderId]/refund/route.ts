import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models";
import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/auth/utils";

/**
 * POST /api/admin/orders/[orderId]/refund
 * Issues a full Stripe refund and marks the order refunded.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;

  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  await connectToDatabase();
  const order = await Order.findById(orderId);

  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.paymentStatus === "refunded") {
    return NextResponse.json({ error: "Order already refunded." }, { status: 409 });
  }

  try {
    let paymentIntentId = order.stripePaymentIntentId;

    if (!paymentIntentId && order.stripeCheckoutSessionId) {
      const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
      paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
    }

    if (!paymentIntentId) {
      return NextResponse.json({ error: "No Stripe PaymentIntent found." }, { status: 422 });
    }

    await stripe.refunds.create({ payment_intent: paymentIntentId });

    order.paymentStatus = "refunded";
    order.status = "cancelled";
    order.cancelledAt = new Date();
    await order.save();

    return NextResponse.json({ refunded: true });
  } catch (err) {
    console.error("[POST /api/admin/orders/:id/refund]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refund failed." },
      { status: 500 },
    );
  }
}
