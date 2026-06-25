"use client";

import { X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { toggleArrayParam, withParam, clearAllFilters } from "@/lib/shop-url";
import { formatCurrency } from "@/lib/helpers";

interface ActiveFiltersProps {
  /** Display name for the active category chip (slug alone isn't human-readable). */
  categoryName?: string;
}

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * Row of removable chips reflecting the current filter state, read
 * directly from the URL so it can never drift from what
 * `FilterSidebar` shows as checked. Renders nothing when no filters
 * are active.
 */
export function ActiveFilters({ categoryName }: ActiveFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(query: string) {
    router.push(`${pathname}${query}`);
  }

  const chips: Chip[] = [];

  const category = searchParams.get("category");
  if (category) {
    chips.push({
      key: "category",
      label: categoryName ?? category,
      onRemove: () => navigate(withParam(searchParams, "category", null)),
    });
  }

  for (const size of (searchParams.get("size") ?? "")
    .split(",")
    .filter(Boolean)) {
    chips.push({
      key: `size-${size}`,
      label: `Size: ${size}`,
      onRemove: () => navigate(toggleArrayParam(searchParams, "size", size)),
    });
  }

  for (const color of (searchParams.get("color") ?? "")
    .split(",")
    .filter(Boolean)) {
    chips.push({
      key: `color-${color}`,
      label: `Color: ${color}`,
      onRemove: () =>
        navigate(toggleArrayParam(searchParams, "color", color)),
    });
  }

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice || maxPrice) {
    const min = minPrice
      ? formatCurrency(Number(minPrice), { isWholeUnit: true })
      : null;
    const max = maxPrice
      ? formatCurrency(Number(maxPrice), { isWholeUnit: true })
      : null;
    chips.push({
      key: "price",
      label:
        min && max
          ? `${min} – ${max}`
          : min
            ? `From ${min}`
            : `Up to ${max}`,
      onRemove: () => {
        const params = new URLSearchParams(searchParams);
        params.delete("minPrice");
        params.delete("maxPrice");
        params.delete("page");
        const query = params.toString();
        navigate(query ? `?${query}` : "?");
      },
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="text-label flex items-center gap-2 border border-border px-3 py-1.5 text-foreground/70 transition-colors hover:border-foreground hover:text-foreground"
        >
          {chip.label}
          <X className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => navigate(clearAllFilters(searchParams))}
        className="text-label text-foreground/40 underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        Clear All
      </button>
    </div>
  );
}
