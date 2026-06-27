import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle } from "lucide-react";

import { stripe } from "@/lib/stripe/config";
import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/helpers";
import { ClearCartEffect } from "@/components/checkout/clear-cart-effect";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

interface SuccessPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/**
 * /checkout/success
 *
 * Stripe redirects here after successful payment with
 * ?session_id={CHECKOUT_SESSION_ID}. We verify the session with
 * Stripe and look up the associated order to show a meaningful
 * confirmation screen.
 *
 * The webhook may not have fired yet when the browser lands here
 * (race condition between redirect and webhook delivery), so we
 * show confirmation based on the Stripe session status rather than
 * the Order's paymentStatus.
 */
export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/");
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    redirect("/");
  }

  if (session.payment_status !== "paid") {
    redirect(`/checkout/cancel`);
  }

  // Look up the order from our DB
  const orderId = session.client_reference_id ?? session.metadata?.orderId;
  let order = null;

  if (orderId) {
    await connectToDatabase();
    order = await Order.findById(orderId).select("orderNumber total itemCount").lean();
  }

  const orderNumber = order?.orderNumber ?? session.metadata?.orderNumber ?? null;
  const email = session.customer_details?.email ?? null;
  const total = session.amount_total ? session.amount_total / 100 : null;

  return (
    <div className="container flex flex-col items-center py-24 text-center sm:py-32">
      <ClearCartEffect />
      <div className="flex h-16 w-16 items-center justify-center border border-border">
        <CheckCircle className="h-8 w-8 text-foreground" aria-hidden="true" />
      </div>

      <h1 className="mt-8 font-display text-4xl italic text-foreground sm:text-5xl">
        Payment Confirmed
      </h1>

      {orderNumber && (
        <p className="mt-4 text-muted-foreground">
          Order{" "}
          <span className="font-medium text-foreground">#{orderNumber}</span>{" "}
          has been placed.
        </p>
      )}

      {email && (
        <p className="mt-2 text-sm text-muted-foreground">
          Confirmation sent to <span className="text-foreground">{email}</span>.
        </p>
      )}

      {total !== null && (
        <p className="mt-2 text-sm text-muted-foreground">
          Total charged:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(total, { isWholeUnit: true })}
          </span>
        </p>
      )}

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Button asChild className="rounded-none">
          <Link href="/products">Continue Shopping</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-none">
          <Link href="/orders">View Orders</Link>
        </Button>
      </div>
    </div>
  );
}
