"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";

import type { WishlistItem as WishlistItemType } from "@/lib/data/wishlist";
import { formatCurrency } from "@/lib/helpers";
import { useWishlistContext } from "@/hooks/use-wishlist";
import { useCartContext } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WishlistItemProps {
  item: WishlistItemType;
  onNavigate?: () => void;
}

/**
 * One row in the wishlist — thumbnail, name, price, a remove button,
 * and a "Move to Cart" flow. Because wishlist saves a product rather
 * than a specific variant, moving to cart requires the user to first
 * pick a size and colour if the product has multiple. A compact
 * inline picker handles this without a separate modal.
 */
export function WishlistItem({ item, onNavigate }: WishlistItemProps) {
  const { removeItem, moveToCart, isMutating } = useWishlistContext();
  const { refresh: refreshCart } = useCartContext();

  const [removing, setRemoving] = React.useState(false);
  const [showPicker, setShowPicker] = React.useState(false);
  const [selectedSize, setSelectedSize] = React.useState<string>(
    item.sizes[0] ?? "",
  );
  const [selectedColor, setSelectedColor] = React.useState<string>(
    item.colors[0]?.name ?? "",
  );
  const [isMoving, setIsMoving] = React.useState(false);

  // When only one option exists for size or colour, it's pre-selected
  // and no picker needs to be shown — go straight to move.
  const needsPicker = item.sizes.length > 1 || item.colors.length > 1;

  async function handleRemove() {
    setRemoving(true);
    await removeItem(item.productId);
  }

  async function handleMoveToCart() {
    if (!selectedSize || !selectedColor) return;
    setIsMoving(true);

    const ok = await moveToCart({
      productId: item.productId,
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
    });

    if (ok) {
      // Refresh the cart context so the header badge updates immediately.
      await refreshCart();
    }
    setIsMoving(false);
    setShowPicker(false);
  }

  function handleMoveClick() {
    if (needsPicker) {
      setShowPicker((v) => !v);
    } else {
      void handleMoveToCart();
    }
  }

  return (
    <li className={cn("border-b border-border py-5 last:border-b-0", removing && "pointer-events-none opacity-50")}>
      <div className="flex gap-4">
        {/* Thumbnail */}
        <Link
          href={`/products/${item.slug}`}
          onClick={onNavigate}
          className="relative h-28 w-22 shrink-0 overflow-hidden bg-secondary"
          tabIndex={-1}
          aria-hidden="true"
        >
          {item.image ? (
            <Image src={item.image} alt="" fill sizes="88px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-sm italic text-foreground/25">
              MN
            </div>
          )}
        </Link>

        {/* Details */}
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/products/${item.slug}`}
              onClick={onNavigate}
              className="font-display italic text-foreground hover:text-foreground/70 truncate"
            >
              {item.name}
            </Link>
            <button
              type="button"
              onClick={handleRemove}
              aria-label={`Remove ${item.name} from wishlist`}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {item.brand && (
            <p className="text-label text-foreground/40">{item.brand}</p>
          )}

          <p className="text-sm text-foreground">
            {formatCurrency(item.price, { isWholeUnit: true })}
            {typeof item.compareAtPrice === "number" && item.compareAtPrice > item.price && (
              <span className="ml-2 text-muted-foreground line-through">
                {formatCurrency(item.compareAtPrice, { isWholeUnit: true })}
              </span>
            )}
          </p>

          {!item.inStock && (
            <p className="text-xs text-destructive">Out of stock</p>
          )}

          {item.inStock && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMoveClick}
              disabled={isMutating || isMoving}
              className="mt-2 w-fit gap-2 rounded-none text-xs"
            >
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
              {isMoving ? "Moving…" : "Move to Cart"}
            </Button>
          )}
        </div>
      </div>

      {/* Inline size/colour picker — shown only when needsPicker and the button was clicked */}
      {showPicker && item.inStock && (
        <div className="mt-4 space-y-3 rounded-none border border-border p-4">
          {item.sizes.length > 1 && (
            <div>
              <p className="text-label mb-2 text-foreground/60">Size</p>
              <div className="flex flex-wrap gap-2">
                {item.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={selectedSize === size}
                    className={cn(
                      "flex h-9 w-12 items-center justify-center border text-xs transition-colors",
                      selectedSize === size
                        ? "border-foreground bg-foreground text-background"
                        : "border-input text-foreground/70 hover:border-foreground",
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {item.colors.length > 1 && (
            <div>
              <p className="text-label mb-2 text-foreground/60">Color</p>
              <div className="flex flex-wrap gap-2">
                {item.colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color.name)}
                    aria-pressed={selectedColor === color.name}
                    title={color.name}
                    className={cn(
                      "relative h-8 w-8 rounded-full border-2 transition-all",
                      selectedColor === color.name
                        ? "border-foreground ring-1 ring-foreground ring-offset-2"
                        : "border-border hover:border-foreground/50",
                    )}
                    style={{ backgroundColor: color.hex ?? "transparent" }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleMoveToCart}
              disabled={!selectedSize || !selectedColor || isMoving}
              className="rounded-none"
            >
              {isMoving ? "Moving…" : "Confirm"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPicker(false)}
              className="rounded-none"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
