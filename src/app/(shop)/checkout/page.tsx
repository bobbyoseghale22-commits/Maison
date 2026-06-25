import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getCart } from "@/lib/data/cart";
import { getCurrentUser } from "@/lib/auth/utils";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  // Checkout should not be indexed.
  robots: { index: false, follow: false },
};

/**
 * /checkout — works for both authenticated users and guests.
 *
 * Server Component: reads the cart and current user session, then
 * renders the `CheckoutForm` client island. Keeping the data fetch
 * here (rather than in the client) means the page arrives with the
 * cart pre-populated — no loading spinner, no layout shift.
 *
 * Redirects to the shop if the cart is empty so the user can't reach
 * a blank checkout form.
 */
export default async function CheckoutPage() {
  const [cart, user] = await Promise.all([getCart(), getCurrentUser()]);

  if (!cart || cart.itemCount === 0) {
    return (
      <div className="container flex flex-col items-center justify-center py-32 text-center">
        <p className="font-display text-3xl italic text-foreground">
          Your cart is empty.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Add something before checking out.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex items-center gap-2 text-sm text-foreground/60 underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-12 sm:py-16">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="font-display text-4xl italic text-foreground sm:text-5xl">
          Checkout
        </h1>
        <Link
          href="/products"
          className="hidden items-center gap-1.5 text-sm text-foreground/50 underline-offset-4 hover:text-foreground hover:underline sm:flex"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Continue Shopping
        </Link>
      </div>

      <CheckoutForm
        cart={cart}
        userEmail={user?.email ?? null}
      />
    </div>
  );
}
