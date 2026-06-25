"use client";

import * as React from "react";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCartContext } from "@/hooks/use-cart";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartEmptyState } from "@/components/cart/cart-empty-state";
import { CartSummary } from "@/components/cart/cart-summary";

/**
 * Cart drawer — triggered from the header's bag icon. Reads from the
 * shared CartContext so opening it costs no extra fetch; the hook
 * already loaded the cart on mount. Shows a live item count badge on
 * the trigger icon.
 */
export function CartSheet() {
  const [open, setOpen] = React.useState(false);
  const { cart, isLoading } = useCartContext();

  const count = cart?.itemCount ?? 0;

  function handleNavigate() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Cart${count > 0 ? ` — ${count} item${count === 1 ? "" : "s"}` : ""}`}
          className="relative"
        >
          <ShoppingBag className="h-[18px] w-[18px]" />
          {count > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center bg-foreground text-[10px] font-medium text-background"
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="flex items-center gap-2 font-display text-xl italic">
            Your Cart
            {count > 0 && (
              <span className="text-label text-foreground/40">
                ({count} {count === 1 ? "item" : "items"})
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Review and manage items in your cart before checkout.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable item list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-5 px-6 py-5">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-24 w-20 animate-pulse bg-secondary" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-3/4 animate-pulse bg-secondary" />
                    <div className="h-3 w-1/2 animate-pulse bg-secondary" />
                    <div className="h-3 w-1/4 animate-pulse bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <CartEmptyState />
          ) : (
            <ul className="divide-y divide-border px-6">
              {cart.items.map((item) => (
                <CartLineItem
                  key={item.itemId}
                  item={item}
                  onNavigate={handleNavigate}
                />
              ))}
            </ul>
          )}
        </div>

        <CartSummary onNavigate={handleNavigate} />
      </SheetContent>
    </Sheet>
  );
}
