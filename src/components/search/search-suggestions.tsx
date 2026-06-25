import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import type { SearchSuggestions as SearchSuggestionsData } from "@/lib/data/search";
import { formatCurrency } from "@/lib/helpers";

interface SearchSuggestionsProps {
  query: string;
  suggestions: SearchSuggestionsData;
  isLoading: boolean;
  /** Called whenever a suggestion (or "view all results") is followed, so the parent can close the dropdown. */
  onNavigate: () => void;
}

/**
 * Dropdown content for `SearchBar` — purely presentational, no data
 * fetching or debounce logic of its own (that lives in `SearchBar`),
 * so it can be reused identically by both the desktop popover and
 * `MobileSearchSheet`.
 */
export function SearchSuggestionsList({
  query,
  suggestions,
  isLoading,
  onNavigate,
}: SearchSuggestionsProps) {
  const hasQuery = query.trim().length > 0;
  const hasResults =
    suggestions.products.length > 0 || suggestions.categories.length > 0;

  if (!hasQuery) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Searching…</div>
    );
  }

  if (!hasResults) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        No results for &ldquo;{query}&rdquo;.
      </div>
    );
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto">
      {suggestions.categories.length > 0 && (
        <div className="border-b border-border p-4">
          <p className="text-label px-2 text-foreground/40">Categories</p>
          <ul className="mt-1">
            {suggestions.categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/products?category=${category.slug}`}
                  onClick={onNavigate}
                  className="block px-2 py-2 text-sm text-foreground/80 transition-colors hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.products.length > 0 && (
        <div className="p-4">
          <p className="text-label px-2 text-foreground/40">Products</p>
          <ul className="mt-1">
            {suggestions.products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.slug}`}
                  onClick={onNavigate}
                  className="flex items-center gap-3 px-2 py-2 transition-colors hover:bg-secondary"
                >
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-secondary">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-full w-full items-center justify-center font-display text-xs italic text-foreground/25"
                      >
                        MN
                      </div>
                    )}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">
                      {product.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatCurrency(product.price, { isWholeUnit: true })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`/products?q=${encodeURIComponent(query)}`}
        onClick={onNavigate}
        className="text-label flex items-center justify-between border-t border-border px-6 py-4 text-foreground/70 transition-colors hover:text-foreground"
      >
        View All Results for &ldquo;{query}&rdquo;
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
