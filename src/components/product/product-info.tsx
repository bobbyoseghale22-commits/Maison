"use client";

import * as React from "react";

import type { ProductDetail } from "@/lib/data/product-detail";
import type { ProductSize } from "@/models/types";
import { formatCurrency } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { ColorSelector } from "@/components/product/color-selector";
import { SizeSelector } from "@/components/product/size-selector";
import { InventoryStatus } from "@/components/product/inventory-status";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { AddToWishlistButton } from "@/components/product/add-to-wishlist-button";

interface ProductInfoProps {
  product: ProductDetail;
  initialIsInWishlist: boolean;
}

/**
 * The interactive "purchase box": price, color/size selection,
 * inventory status, and the Add to Cart / Add to Wishlist actions.
 * A single Client Component because every piece here depends on the
 * same `selectedSize`/`selectedColor` state — splitting it further
 * would mean lifting that state back up to a parent anyway.
 *
 * Defaults to the first available color, and a size only once a
 * color with stock is chosen — auto-selecting a likely-unavailable
 * combination would just produce an immediate "out of stock" message
 * before the customer has done anything.
 */
export function ProductInfo({
  product,
  initialIsInWishlist,
}: ProductInfoProps) {
  const firstAvailableColor = product.colors.find((c) =>
    product.variants.some((v) => v.color === c.name && v.stock > 0),
  );

  const [selectedColor, setSelectedColor] = React.useState<string | null>(
    firstAvailableColor?.name ?? null,
  );
  const [selectedSize, setSelectedSize] = React.useState<ProductSize | null>(
    null,
  );

  const colorOptions = product.colors.map((color) => ({
    ...color,
    available: product.variants.some(
      (v) => v.color === color.name && v.stock > 0,
    ),
  }));

  const sizeOptions = product.sizes.map((size) => ({
    size,
    available: selectedColor
      ? product.variants.some(
          (v) => v.size === size && v.color === selectedColor && v.stock > 0,
        )
      : product.variants.some((v) => v.size === size && v.stock > 0),
  }));

  const selectedVariant =
    selectedSize && selectedColor
      ? product.variants.find(
          (v) => v.size === selectedSize && v.color === selectedColor,
        )
      : undefined;

  const displayPrice = selectedVariant?.price ?? product.price;
  const isDiscounted =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > displayPrice;

  function handleSelectColor(color: string) {
    setSelectedColor(color);
    // A previously-chosen size may not exist in the new color — clear
    // it rather than silently keeping an invalid combo selected.
    if (
      selectedSize &&
      !product.variants.some(
        (v) => v.size === selectedSize && v.color === color && v.stock > 0,
      )
    ) {
      setSelectedSize(null);
    }
  }

  return (
    <div>
      <p className="text-label text-foreground/40">
        {product.brand ?? "Maison Noir"}
      </p>
      <h1 className="mt-2 font-display text-3xl italic text-foreground sm:text-4xl">
        {product.name}
      </h1>

      <p className="mt-4 flex items-baseline gap-3 text-xl">
        <span className={cn(isDiscounted && "text-foreground/50")}>
          {formatCurrency(displayPrice, { isWholeUnit: true })}
        </span>
        {isDiscounted && (
          <span className="text-base text-foreground/40 line-through">
            {formatCurrency(product.compareAtPrice as number, {
              isWholeUnit: true,
            })}
          </span>
        )}
      </p>

      <div className="mt-8 space-y-6">
        <ColorSelector
          colors={colorOptions}
          selected={selectedColor}
          onSelect={handleSelectColor}
        />

        <SizeSelector
          sizes={sizeOptions}
          selected={selectedSize}
          onSelect={setSelectedSize}
          sizeGuideHref="/support/sizing"
        />

        <InventoryStatus stock={selectedVariant?.stock ?? null} />
      </div>

      <div className="mt-8 space-y-3">
        <AddToCartButton
          productId={product.id}
          size={selectedSize}
          color={selectedColor}
          stock={selectedVariant?.stock ?? null}
        />
        <AddToWishlistButton
          productId={product.id}
          initialIsInWishlist={initialIsInWishlist}
        />
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
      </div>
    </div>
  );
}
