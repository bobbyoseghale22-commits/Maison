"use client";

import * as React from "react";
import { useWishlistContext } from "@/hooks/use-wishlist";
import { WishlistItem } from "@/components/wishlist/wishlist-item";
import { WishlistEmptyState } from "@/components/wishlist/wishlist-empty-state";

/**
 * Client-side content for /wishlist. Uses WishlistContext so if the
 * user already opened the WishlistSheet (which loads the data), this
 * page renders instantly from cache rather than re-fetching.
 */
export function WishlistPageContent() {
  const { wishlist, isLoading, ensureLoaded } = useWishlistContext();

  React.useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  if (isLoading || !wishlist) {
    return (
      <ul className="divide-y divide-border">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="flex gap-4 py-5">
            <div className="h-28 w-20 shrink-0 animate-pulse bg-secondary" />
            <div className="flex flex-1 flex-col gap-2 py-1">
              <div className="h-5 w-2/3 animate-pulse bg-secondary" />
              <div className="h-3 w-1/4 animate-pulse bg-secondary" />
              <div className="h-4 w-1/3 animate-pulse bg-secondary" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (wishlist.itemCount === 0) {
    return <WishlistEmptyState />;
  }

  return (
    <ul className="divide-y divide-border">
      {wishlist.items.map((item) => (
        <WishlistItem key={item.productId} item={item} />
      ))}
    </ul>
  );
}
