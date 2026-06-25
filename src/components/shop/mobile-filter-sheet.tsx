"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

import type { ProductListResult } from "@/lib/data/products";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterSidebar } from "@/components/shop/filter-sidebar";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface MobileFilterSheetProps {
  categories: CategoryOption[];
  facets: ProductListResult["facets"];
  activeCategorySlug?: string;
  /** Total result count, shown on the trigger and the "Show Results" button. */
  resultCount: number;
}

/**
 * Mobile filter entry point — below `lg`, the desktop sidebar
 * (`FilterSidebar` rendered inline in the shop page) is hidden in
 * favor of this trigger + `Sheet`, reusing the same `FilterSidebar`
 * component so filter logic only exists in one place.
 */
export function MobileFilterSheet({
  categories,
  facets,
  activeCategorySlug,
  resultCount,
}: MobileFilterSheetProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-none lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="flex w-[85vw] flex-col p-0 sm:max-w-sm"
      >
        <SheetHeader>
          <SheetTitle>Filter</SheetTitle>
          <SheetDescription className="sr-only">
            Refine the product grid by category, size, color, and price.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          <FilterSidebar
            categories={categories}
            facets={facets}
            activeCategorySlug={activeCategorySlug}
          />
        </div>

        <div className="border-t border-border px-6 py-4">
          <Button
            className="w-full rounded-none"
            onClick={() => setOpen(false)}
          >
            Show {resultCount} {resultCount === 1 ? "Result" : "Results"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
