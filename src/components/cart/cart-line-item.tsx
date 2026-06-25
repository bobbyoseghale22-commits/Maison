"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X, AlertCircle } from "lucide-react";

import type { CartLineItem as CartLineItemType } from "@/lib/data/cart";
import { formatCurrency } from "@/lib/helpers";
import { useCartContext } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

interface CartLineItemProps {
  item: CartLineItemType;
  onNavigate?: () => void;
}

/**
 * One row in the cart drawer. Renders the product thumbnail, name,
 * size/colour, a quantity stepper, a remove button, and the line
 * total. Shows a subtle price-change warning when the stored add-time
 * price differs from the current live price.
 */
export function CartLineItem({ item, onNavigate }: CartLineItemProps) {
  const { updateQuantity, removeItem } = useCartContext();
  const [removing, setRemoving] = React.useState(false);

  async function handleRemove() {
    setRemoving(true);
    await removeItem(item.itemId);
  }

  function handleQtyChange(delta: number) {
    const next = item.quantity + delta;
    if (next < 1 || next > item.maxQuantity) return;
    updateQuantity(item.itemId, next);
  }

  return (
    <li className={cn("flex gap-4 py-5", removing && "pointer-events-none opacity-50")}>
      {/* Thumbnail */}
      <Link
        href={`/products/${item.slug}`}
        onClick={onNavigate}
        className="relative h-24 w-20 shrink-0 overflow-hidden bg-secondary"
        tabIndex={-1}
        aria-hidden="true"
      >
        {item.image ? (
          <Image
            src={item.image}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-sm italic text-foreground/25">
            MN
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${item.slug}`}
            onClick={onNavigate}
            className="font-display italic text-foreground hover:text-foreground/70"
          >
            {item.name}
          </Link>
          <button
            type="button"
            onClick={handleRemove}
            aria-label={`Remove ${item.name}`}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-label text-foreground/50">
          {item.size} / {item.color}
        </p>

        {item.priceChanged && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            Price updated — now {formatCurrency(item.currentPrice, { isWholeUnit: true })}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between">
          {/* Quantity stepper */}
          <div className="flex items-center border border-input">
            <button
              type="button"
              onClick={() => handleQtyChange(-1)}
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
              className="flex h-7 w-7 items-center justify-center text-foreground/60 transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="flex h-7 w-7 items-center justify-center text-xs" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQtyChange(1)}
              disabled={item.quantity >= item.maxQuantity}
              aria-label="Increase quantity"
              className="flex h-7 w-7 items-center justify-center text-foreground/60 transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Line total */}
          <span className="text-sm font-medium text-foreground">
            {formatCurrency(item.lineTotal, { isWholeUnit: true })}
          </span>
        </div>
      </div>
    </li>
  );
}
