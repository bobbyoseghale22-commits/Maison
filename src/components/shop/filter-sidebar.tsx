"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import type { ProductListResult } from "@/lib/data/products";
import {
  toggleArrayParam,
  readArrayParam,
  clearAllFilters,
} from "@/lib/shop-url";
import { formatCurrency } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface FilterSidebarProps {
  categories: CategoryOption[];
  facets: ProductListResult["facets"];
  /** The currently-resolved category, if any — used to highlight the active category link. */
  activeCategorySlug?: string;
}

function categoryHref(
  searchParams: URLSearchParams,
  pathname: string,
  slug: string | null,
): string {
  const params = new URLSearchParams(searchParams);
  if (slug) {
    params.set("category", slug);
  } else {
    params.delete("category");
  }
  params.delete("page");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * Filter sidebar: Category, Size, Color, Price Range. A Client
 * Component because every control needs to read the current URL and
 * push a new one — but it does no data fetching itself, it only
 * builds `href`s/navigates, so the actual filtering still happens
 * server-side on the next render of `/products`.
 *
 * Shared between the desktop sidebar layout and `MobileFilterSheet`
 * (passed the same props inside a `Sheet` on small screens).
 */
export function FilterSidebar({
  categories,
  facets,
  activeCategorySlug,
}: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedSizes = readArrayParam(searchParams, "size");
  const selectedColors = readArrayParam(searchParams, "color");

  const minPrice = facets.priceRange.min;
  const maxPrice = facets.priceRange.max;
  const hasPriceRange = maxPrice > minPrice;

  const currentMin = Number(searchParams.get("minPrice") ?? minPrice);
  const currentMax = Number(searchParams.get("maxPrice") ?? maxPrice);

  const [priceDraft, setPriceDraft] = React.useState<[number, number]>([
    currentMin,
    currentMax,
  ]);

  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");

  // Keep the local slider draft in sync if the URL changes elsewhere
  // (e.g. "Clear all filters" or browser back/forward).
  React.useEffect(() => {
    setPriceDraft([
      Number(minPriceParam ?? minPrice),
      Number(maxPriceParam ?? maxPrice),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPriceParam, maxPriceParam]);

  function navigate(query: string) {
    router.push(`${pathname}${query}`);
  }

  function commitPriceRange([min, max]: [number, number]) {
    const params = new URLSearchParams(searchParams);

    if (min > minPrice) params.set("minPrice", String(min));
    else params.delete("minPrice");

    if (max < maxPrice) params.set("maxPrice", String(max));
    else params.delete("maxPrice");

    params.delete("page");
    const query = params.toString();
    navigate(query ? `?${query}` : "?");
  }

  const hasActiveFilters =
    Boolean(activeCategorySlug) ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    searchParams.has("minPrice") ||
    searchParams.has("maxPrice");

  return (
    <div className="w-full">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-label text-foreground">Filter</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => navigate(clearAllFilters(searchParams))}
            className="text-label text-foreground/50 underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      <Accordion
        type="multiple"
        defaultValue={["category", "size", "color", "price"]}
      >
        {categories.length > 0 && (
          <AccordionItem value="category">
            <AccordionTrigger>Category</AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-3">
                <li>
                  <Link
                    href={categoryHref(searchParams, pathname, null)}
                    className={cn(
                      "text-sm transition-colors hover:text-foreground",
                      !activeCategorySlug
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    All Products
                  </Link>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={categoryHref(
                        searchParams,
                        pathname,
                        category.slug,
                      )}
                      className={cn(
                        "text-sm transition-colors hover:text-foreground",
                        activeCategorySlug === category.slug
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {facets.sizes.length > 0 && (
          <AccordionItem value="size">
            <AccordionTrigger>Size</AccordionTrigger>
            <AccordionContent>
              <ul className="grid grid-cols-4 gap-2">
                {facets.sizes.map((size) => {
                  const checked = selectedSizes.includes(size);
                  return (
                    <li key={size}>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            toggleArrayParam(searchParams, "size", size),
                          )
                        }
                        aria-pressed={checked}
                        className={cn(
                          "flex h-9 w-full items-center justify-center border text-xs transition-colors",
                          checked
                            ? "border-foreground bg-foreground text-background"
                            : "border-input text-foreground/70 hover:border-foreground",
                        )}
                      >
                        {size}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {facets.colors.length > 0 && (
          <AccordionItem value="color">
            <AccordionTrigger>Color</AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-3">
                {facets.colors.map((color) => {
                  const checked = selectedColors.includes(color.name);
                  const inputId = `color-${color.name}`;
                  return (
                    <li key={color.name} className="flex items-center gap-3">
                      <Checkbox
                        id={inputId}
                        checked={checked}
                        onCheckedChange={() =>
                          navigate(
                            toggleArrayParam(
                              searchParams,
                              "color",
                              color.name,
                            ),
                          )
                        }
                      />
                      {color.hex && (
                        <span
                          aria-hidden="true"
                          className="h-3 w-3 shrink-0 rounded-full border border-border"
                          style={{ backgroundColor: color.hex }}
                        />
                      )}
                      <label
                        htmlFor={inputId}
                        className="cursor-pointer text-sm text-foreground/80"
                      >
                        {color.name}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {hasPriceRange && (
          <AccordionItem value="price">
            <AccordionTrigger>Price</AccordionTrigger>
            <AccordionContent>
              <div className="px-1 pt-2">
                <Slider
                  min={minPrice}
                  max={maxPrice}
                  step={5}
                  value={priceDraft}
                  onValueChange={(value) =>
                    setPriceDraft(value as [number, number])
                  }
                  onValueCommit={(value) =>
                    commitPriceRange(value as [number, number])
                  }
                  aria-label="Price range"
                />
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {formatCurrency(priceDraft[0], { isWholeUnit: true })}
                  </span>
                  <span>
                    {formatCurrency(priceDraft[1], { isWholeUnit: true })}
                  </span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
