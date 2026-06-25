import type { ProductListResult } from "@/lib/data/products";
import type { ProductSort } from "@/lib/validations/product";
import { SortSelect } from "@/components/shop/sort-select";
import { MobileFilterSheet } from "@/components/shop/mobile-filter-sheet";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface ShopToolbarProps {
  total: number;
  sort: ProductSort;
  categories: CategoryOption[];
  facets: ProductListResult["facets"];
  activeCategorySlug?: string;
}

/**
 * Result count + mobile filter trigger + sort, in one row. A Server
 * Component itself — it only composes two client islands
 * (`MobileFilterSheet`, `SortSelect`) around a static count, rather
 * than being a client component wholesale.
 */
export function ShopToolbar({
  total,
  sort,
  categories,
  facets,
  activeCategorySlug,
}: ShopToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-6">
      <p className="text-sm text-muted-foreground">
        {total} {total === 1 ? "Result" : "Results"}
      </p>

      <div className="flex items-center gap-3">
        <MobileFilterSheet
          categories={categories}
          facets={facets}
          activeCategorySlug={activeCategorySlug}
          resultCount={total}
        />
        <SortSelect value={sort} />
      </div>
    </div>
  );
}
