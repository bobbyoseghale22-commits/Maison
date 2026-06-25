"use client";

import * as React from "react";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useWishlistContext } from "@/hooks/use-wishlist";
import { WishlistItem } from "@/components/wishlist/wishlist-item";
import { WishlistEmptyState } from "@/components/wishlist/wishlist-empty-state";

/**
 * Wishlist drawer — triggered from the header's heart icon. Lazy-loads
 * wishlist data the first time the sheet opens so unauthenticated page
 * loads don't fire an extra /api/wishlist fetch.
 *
 * Mirrors CartSheet in src/components/cart/cart-sheet.tsx.
 */
export function WishlistSheet() {
  const [open, setOpen] = React.useState(false);
  const { wishlist, isLoading, ensureLoaded } = useWishlistContext();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) ensureLoaded();
  }

  const count = wishlist?.itemCount ?? 0;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={count > 0 ? `Wishlist (${count} items)` : "Wishlist"}
          className="relative hidden sm:inline-flex"
        >
          <Heart className="h-[18px] w-[18px]" />
          {count > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center bg-foreground font-sans text-[10px] font-medium text-background"
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display italic">Wishlist</SheetTitle>
          <SheetDescription className="sr-only">
            Saved products. Remove or move items to your cart.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-1 flex-col gap-4 px-6 py-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex gap-4 py-5">
                <div className="h-28 w-22 shrink-0 animate-pulse bg-secondary" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 w-3/4 animate-pulse bg-secondary" />
                  <div className="h-3 w-1/4 animate-pulse bg-secondary" />
                  <div className="h-3 w-1/3 animate-pulse bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : !wishlist || wishlist.itemCount === 0 ? (
          <WishlistEmptyState />
        ) : (
          <ul className="flex-1 overflow-y-auto px-6">
            {wishlist.items.map((item) => (
              <WishlistItem
                key={item.productId}
                item={item}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
