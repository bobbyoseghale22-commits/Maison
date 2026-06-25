import type { CardProduct } from "@/lib/data/home";
import { ProductCard } from "@/components/sections/product-card";

interface ProductGridProps {
  products: CardProduct[];
}

/**
 * Server Component — renders the filtered/sorted/paginated product
 * grid using the same `ProductCard` as the home page rails, so a
 * product looks identical whether discovered via "New Arrivals" on
 * the home page or via the shop grid.
 */
export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center border border-dashed border-border px-6 py-24 text-center"
      >
        <p className="font-display text-2xl italic text-foreground">
          No products match these filters.
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Try removing a filter or browsing a different category.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
