import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown when the wishlist has no items — mirrors CartEmptyState in
 * src/components/cart/cart-empty-state.tsx.
 */
export function WishlistEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center border border-border">
        <Heart className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <p className="font-display text-xl italic text-foreground">
          Your wishlist is empty.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Save pieces from the collection to revisit later.
        </p>
      </div>
      <Button asChild className="mt-2 rounded-none">
        <Link href="/products">Shop All</Link>
      </Button>
    </div>
  );
}
