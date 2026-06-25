"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/helpers";
import { useCartContext } from "@/hooks/use-cart";

interface CartSummaryProps {
  onNavigate?: () => void;
}

/**
 * Subtotal + proceed-to-checkout CTA, fixed to the bottom of
 * CartSheet so it stays visible while the item list scrolls.
 */
export function CartSummary({ onNavigate }: CartSummaryProps) {
  const { cart } = useCartContext();
  if (!cart || cart.itemCount === 0) return null;

  return (
    <div className="border-t border-border px-6 py-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium text-foreground">
          {formatCurrency(cart.subtotal, { isWholeUnit: true })}
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Shipping and taxes calculated at checkout.
      </p>

      <Button
        asChild
        size="lg"
        className="mt-5 w-full gap-2 rounded-none"
        onClick={onNavigate}
      >
        <Link href="/checkout">
          Checkout
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>

      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mt-2 w-full text-label text-muted-foreground"
        onClick={onNavigate}
      >
        <Link href="/products">Continue Shopping</Link>
      </Button>
    </div>
  );
}
