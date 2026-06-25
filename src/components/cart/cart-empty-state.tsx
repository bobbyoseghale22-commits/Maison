import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown inside CartSheet when the cart has no items.
 */
export function CartEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center border border-border">
        <ShoppingBag className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <p className="font-display text-xl italic text-foreground">
          Your cart is empty.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add something from the collection.
        </p>
      </div>
      <Button asChild className="mt-2 rounded-none">
        <Link href="/products">Shop All</Link>
      </Button>
    </div>
  );
}
