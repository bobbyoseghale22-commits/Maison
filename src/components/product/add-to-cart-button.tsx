"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import type { ProductSize } from "@/models/types";
import { useCartContext } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  productId: string;
  size: ProductSize | null;
  color: string | null;
  /** Stock for the currently selected size/color — caps the quantity stepper. */
  stock: number | null;
}

/**
 * Quantity stepper + "Add to Cart" button. Uses the shared
 * `CartContext` (provided by `CartProvider` in the root layout) so
 * the cart badge in the header updates immediately when an item is
 * added — no extra fetch, no page reload.
 *
 * Disabled until both size and color are selected, and again once
 * the selected combo's stock is exhausted.
 */
export function AddToCartButton({
  productId,
  size,
  color,
  stock,
}: AddToCartButtonProps) {
  const { addItem } = useCartContext();
  const [quantity, setQuantity] = React.useState(1);
  const [isPending, startTransition] = React.useTransition();

  const maxQuantity = Math.min(stock ?? 1, 10);
  const canAdd = Boolean(size && color) && (stock ?? 0) > 0;

  // Reset quantity when selection changes so stale qty can't exceed
  // the new variant's stock.
  React.useEffect(() => {
    setQuantity(1);
  }, [size, color]);

  function handleAdd() {
    if (!size || !color) return;

    startTransition(async () => {
      const ok = await addItem({ productId, size, color, quantity });
      if (ok) {
        toast.success("Added to cart", {
          description: `${quantity} × ${size}, ${color}`,
        });
      }
      // addItem already shows an error toast on failure
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex h-12 items-center border border-input">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
          className="flex h-full w-11 items-center justify-center text-foreground/60 transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span
          className="flex h-full w-10 items-center justify-center text-sm"
          aria-live="polite"
        >
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          disabled={quantity >= maxQuantity}
          aria-label="Increase quantity"
          className="flex h-full w-11 items-center justify-center text-foreground/60 transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <Button
        type="button"
        size="lg"
        onClick={handleAdd}
        disabled={!canAdd || isPending}
        className="flex-1 rounded-none"
      >
        {isPending
          ? "Adding…"
          : !size || !color
            ? "Select Size & Color"
            : (stock ?? 0) <= 0
              ? "Out of Stock"
              : "Add to Cart"}
      </Button>
    </div>
  );
}
