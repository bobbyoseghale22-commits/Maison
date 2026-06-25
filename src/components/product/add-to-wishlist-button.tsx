"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { toggleWishlistItem } from "@/lib/actions/wishlist";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddToWishlistButtonProps {
  productId: string;
  /** Initial state, resolved server-side in the page so there's no
   * flash-of-wrong-state on load (see `isProductInWishlist` in
   * `src/lib/actions/wishlist.ts`). */
  initialIsInWishlist: boolean;
}

/**
 * Heart toggle. Optimistically flips state immediately on click (the
 * action is a simple boolean toggle, so an optimistic update is safe
 * to roll back on failure) rather than waiting for the server round
 * trip, since wishlist-add is a low-stakes, frequent interaction
 * where latency would feel sluggish.
 */
export function AddToWishlistButton({
  productId,
  initialIsInWishlist,
}: AddToWishlistButtonProps) {
  const router = useRouter();
  const [isInWishlist, setIsInWishlist] = React.useState(initialIsInWishlist);
  const [isPending, startTransition] = React.useTransition();

  function handleToggle() {
    const optimisticNext = !isInWishlist;
    setIsInWishlist(optimisticNext);

    startTransition(async () => {
      const result = await toggleWishlistItem({ productId });

      if (!result.success) {
        setIsInWishlist(!optimisticNext); // roll back
        if (result.message?.includes("sign in")) {
          toast.error(result.message, {
            action: {
              label: "Sign In",
              onClick: () => router.push("/login"),
            },
          });
        } else {
          toast.error(result.message ?? "Couldn't update your wishlist.");
        }
        return;
      }

      // Reconcile with the server's actual result in case of a race
      // (e.g. toggled twice quickly).
      setIsInWishlist(result.isInWishlist ?? optimisticNext);
      toast.success(
        result.isInWishlist ? "Added to wishlist" : "Removed from wishlist",
      );
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={isInWishlist}
      className="gap-2 rounded-none"
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          isInWishlist && "fill-foreground text-foreground",
        )}
      />
      {isInWishlist ? "Saved" : "Add to Wishlist"}
    </Button>
  );
}
