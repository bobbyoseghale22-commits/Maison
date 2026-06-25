import Link from "next/link";

import type { CardProduct } from "@/lib/data/home";
import { ProductCard } from "@/components/sections/product-card";

interface ProductRailProps {
  /** Section id, used as the heading's anchor target for skip-links. */
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  viewAllHref: string;
  products: CardProduct[];
  /** First rail on the page gets priority image loading for its first card. */
  priority?: boolean;
}

/**
 * Shared layout for any "row of products with a heading" section —
 * Featured Products, New Arrivals, and Best Sellers all render through
 * this component with different data/copy, rather than three
 * near-identical files drifting apart over time.
 */
export function ProductRail({
  id,
  eyebrow,
  title,
  description,
  viewAllHref,
  products,
  priority = false,
}: ProductRailProps) {
  return (
    <section aria-labelledby={`${id}-heading`} className="py-16 sm:py-20">
      <div className="container">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-label text-foreground/40">{eyebrow}</p>
            <h2
              id={`${id}-heading`}
              className="mt-2 font-display text-3xl italic text-foreground sm:text-4xl"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <Link
            href={viewAllHref}
            className="text-label shrink-0 text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            View All
          </Link>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {products.map((product, index) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                priority={priority && index === 0}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
