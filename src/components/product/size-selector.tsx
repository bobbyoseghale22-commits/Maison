"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ProductSize } from "@/models/types";

interface SizeOption {
  size: ProductSize;
  available: boolean;
}

interface SizeSelectorProps {
  sizes: SizeOption[];
  selected: ProductSize | null;
  onSelect: (size: ProductSize) => void;
  /** Shown as a secondary link next to the legend, per common PDP convention. */
  sizeGuideHref?: string;
}

/**
 * Size selector. Like `ColorSelector`, out-of-stock sizes (for the
 * currently selected color) stay visible but disabled rather than
 * disappearing — disappearing options make a grid of buttons
 * reshuffle unpredictably as the customer picks a color, which reads
 * as broken rather than informative.
 */
export function SizeSelector({
  sizes,
  selected,
  onSelect,
  sizeGuideHref,
}: SizeSelectorProps) {
  if (sizes.length === 0) return null;

  return (
    <fieldset>
      <div className="flex items-baseline justify-between">
        <legend className="text-label text-foreground/60">Size</legend>
        {sizeGuideHref && (
          <Link
            href={sizeGuideHref}
            className="text-label text-foreground/50 underline-offset-4 hover:text-foreground hover:underline"
          >
            Size Guide
          </Link>
        )}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {sizes.map(({ size, available }) => {
          const isSelected = size === selected;
          return (
            <button
              key={size}
              type="button"
              disabled={!available}
              onClick={() => onSelect(size)}
              aria-pressed={isSelected}
              aria-label={
                available ? `Size ${size}` : `Size ${size} — out of stock`
              }
              className={cn(
                "relative flex h-11 items-center justify-center border text-sm transition-colors",
                isSelected
                  ? "border-foreground bg-foreground text-background"
                  : "border-input text-foreground/80 hover:border-foreground",
                !available &&
                  "cursor-not-allowed border-border text-foreground/30 hover:border-border",
              )}
            >
              {size}
              {!available && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-foreground/20"
                />
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
