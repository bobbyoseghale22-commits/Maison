import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

interface ConfirmationPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/**
 * /checkout/confirmation
 *
 * Shown after a successful order submission. Reads the order number
 * and email from the URL query params set by CheckoutForm on redirect
 * — avoids a database re-fetch while still showing meaningful
 * confirmation details.
 *
 * When Stripe is integrated, this page will additionally verify the
 * PaymentIntent status before rendering the confirmed state.
 */
export default async function ConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const params = await searchParams;
  const orderNumber = params.order;
  const email = params.email;

  return (
    <div className="container flex flex-col items-center py-24 text-center sm:py-32">
      <div className="flex h-16 w-16 items-center justify-center border border-border">
        <CheckCircle
          className="h-8 w-8 text-foreground"
          aria-hidden="true"
        />
      </div>

      <h1 className="mt-8 font-display text-4xl italic text-foreground sm:text-5xl">
        Order Confirmed
      </h1>

      {orderNumber ? (
        <p className="mt-4 text-muted-foreground">
          Your order{" "}
          <span className="font-medium text-foreground">#{orderNumber}</span>{" "}
          has been placed.
        </p>
      ) : (
        <p className="mt-4 text-muted-foreground">
          Your order has been placed.
        </p>
      )}

      {email && (
        <p className="mt-2 text-sm text-muted-foreground">
          A confirmation will be sent to{" "}
          <span className="text-foreground">{email}</span>.
        </p>
      )}

      <p className="mt-4 max-w-sm text-sm text-muted-foreground">
        Payment will be collected once your order is processed. You will
        receive an update when your order ships.
      </p>

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
