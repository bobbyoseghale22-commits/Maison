"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  PRODUCT_SORT_OPTIONS,
  SORT_LABELS,
  type ProductSort,
} from "@/lib/validations/product";
import { withParam } from "@/lib/shop-url";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SortSelectProps {
  value: ProductSort;
}

/**
 * Sort dropdown. Navigates via `router.push` rather than a form
 * submit, so the result re-renders without a full page reload while
 * still being a real URL change (shareable, back-button-safe,
 * server-rendered on navigation).
 */
export function SortSelect({ value }: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(next: string) {
    router.push(`${pathname}${withParam(searchParams, "sort", next)}`);
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-[200px]" aria-label="Sort products">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {PRODUCT_SORT_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {SORT_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
