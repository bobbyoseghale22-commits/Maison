import Link from "next/link";
import Image from "next/image";

import type { CardProduct } from "@/lib/data/home";
import { formatCurrency } from "@/lib/helpers";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: CardProduct;
  /** Eager-loads the image — pass true only for above-the-fold cards. */
  priority?: boolean;
  className?: string;
}

/**
 * Product card shared by every product rail (Featured, New Arrivals,
 * Best Sellers). Renders a typographic placeholder in place of a
 * photo when `product.hasImage` is false, so the catalog reads as
 * intentional editorial styling rather than a broken-image state
 * before real product photography exists.
 */
export function ProductCard({
  product,
  priority = false,
  className,
}: ProductCardProps) {
  const isDiscounted =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > product.price;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn("group block focus-visible:outline-none", className)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
        {product.hasImage && product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full flex-col items-center justify-center gap-3 border border-border/60 bg-gradient-to-br from-secondary to-background px-6 text-center"
          >
            <span className="font-display text-3xl italic text-foreground/25">
              MN
            </span>
            <span className="text-label text-foreground/30">
              {product.name}
            </span>
          </div>
        )}

        {isDiscounted && (
          <span className="text-label absolute left-3 top-3 bg-foreground px-2 py-1 text-background">
            Sale
          </span>
        )}

        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-500 ease-out group-hover:scale-x-100"
        />
      </div>

      <div className="mt-4 space-y-1">
        {product.label && (
          <p className="text-label text-foreground/40">{product.label}</p>
        )}
        <h3 className="font-display text-lg italic text-foreground">
          {product.name}
        </h3>
        <p className="flex items-baseline gap-2 text-sm">
          <span className={cn(isDiscounted && "text-foreground/50")}>
            {formatCurrency(product.price, { isWholeUnit: true })}
          </span>
          {isDiscounted && (
            <span className="text-foreground/40 line-through">
              {formatCurrency(product.compareAtPrice as number, {
                isWholeUnit: true,
              })}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
