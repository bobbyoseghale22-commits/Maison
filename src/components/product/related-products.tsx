import type { CardProduct } from "@/lib/data/home";
import { ProductRail } from "@/components/sections/product-rail";

interface RelatedProductsProps {
  products: CardProduct[];
  categorySlug: string;
}

/**
 * Thin wrapper around the existing `ProductRail` (built for the home
 * page's Featured/New/Best-Seller rails) — reused as-is here rather
 * than duplicated, since a related-products row is structurally
 * identical: heading, "View All", a row of `ProductCard`s.
 */
export function RelatedProducts({
  products,
  categorySlug,
}: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <ProductRail
      id="related-products"
      eyebrow="You May Also Like"
      title="Complete the Look"
      viewAllHref={`/products?category=${categorySlug}`}
      products={products}
    />
  );
}
