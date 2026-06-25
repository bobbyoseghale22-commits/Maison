import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment Cancelled",
  robots: { index: false, follow: false },
};

interface CancelPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/**
 * /checkout/cancel
 *
 * Stripe redirects here when the customer clicks "Back" or closes
 * the Stripe Checkout page. The pending Order created before the
 * redirect remains in the DB with status="pending" / paymentStatus=
 * "unpaid" — it can be expired/cleaned up by a scheduled job later.
 * The cart is also untouched so the customer can retry without
 * re-adding items.
 */
export default async function CheckoutCancelPage({ searchParams }: CancelPageProps) {
  const { order } = await searchParams;

  return (
    <div className="container flex flex-col items-center py-24 text-center sm:py-32">
      <div className="flex h-16 w-16 items-center justify-center border border-border">
        <XCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>

      <h1 className="mt-8 font-display text-4xl italic text-foreground sm:text-5xl">
        Payment Cancelled
      </h1>

      <p className="mt-4 max-w-sm text-muted-foreground">
        Your payment was not completed. Your cart has been preserved — you
        can return to checkout whenever you&rsquo;re ready.
      </p>

      {order && (
        <p className="mt-2 text-xs text-muted-foreground">
          Reference: #{order}
        </p>
      )}

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Button asChild className="rounded-none">
          <Link href="/checkout">Return to Checkout</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-none">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
