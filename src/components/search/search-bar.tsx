"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { SearchSuggestions } from "@/lib/data/search";
import { cn } from "@/lib/utils";
import { SearchSuggestionsList } from "@/components/search/search-suggestions";

const EMPTY_SUGGESTIONS: SearchSuggestions = { products: [], categories: [] };
const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

interface SearchBarProps {
  className?: string;
  /** Autofocus the input on mount — used by `MobileSearchSheet`, where opening the sheet IS the intent to search. */
  autoFocus?: boolean;
  /** Called after a suggestion or "view all" is followed — lets the mobile sheet close itself. */
  onNavigate?: () => void;
}

/**
 * Debounced search input with a suggestions dropdown. Fetches
 * `/api/search/suggestions` only after typing pauses for
 * `DEBOUNCE_MS` and the query reaches `MIN_QUERY_LENGTH` — both
 * guard against firing a request (and a Mongo `$text` query) on
 * every keystroke of a fast typist.
 *
 * Pressing Enter (or submitting the form) navigates straight to the
 * full search results page (`/products?q=...`, the existing shop
 * page extended to support `q` — see `src/lib/data/products.ts`)
 * rather than requiring a suggestion click.
 */
export function SearchBar({
  className,
  autoFocus = false,
  onNavigate,
}: SearchBarProps) {
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [suggestions, setSuggestions] =
    React.useState<SearchSuggestions>(EMPTY_SUGGESTIONS);
  const [isLoading, setIsLoading] = React.useState(false);

  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);

  React.useEffect(() => {
    const trimmed = debouncedQuery.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions(EMPTY_SUGGESTIONS);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmed)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : EMPTY_SUGGESTIONS))
      .then((data: SearchSuggestions) => setSuggestions(data))
      .catch((error: unknown) => {
        const isAbort =
          error instanceof DOMException && error.name === "AbortError";
        if (!isAbort) {
          setSuggestions(EMPTY_SUGGESTIONS);
        }
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  // Close the dropdown on outside click.
  React.useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length === 0) return;

    router.push(`/products?q=${encodeURIComponent(trimmed)}`);
    setIsOpen(false);
    onNavigate?.();
  }

  function handleClear() {
    setQuery("");
    setSuggestions(EMPTY_SUGGESTIONS);
  }

  function handleNavigate() {
    setIsOpen(false);
    onNavigate?.();
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} role="search">
        <div className="relative flex items-center border-b border-foreground/30 focus-within:border-foreground">
          <Search
            className="pointer-events-none absolute left-0 h-4 w-4 text-foreground/40"
            aria-hidden="true"
          />
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <input
            id="site-search"
            type="search"
            value={query}
            autoFocus={autoFocus}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setIsOpen(false);
            }}
            placeholder="Search products, categories…"
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="search-suggestions-listbox"
            className="w-full bg-transparent py-3 pl-7 pr-7 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-0 flex h-7 w-7 items-center justify-center text-foreground/40 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {isOpen && query.trim().length > 0 && (
        <div
          id="search-suggestions-listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 border border-border bg-background shadow-lg"
        >
          <SearchSuggestionsList
            query={query}
            suggestions={suggestions}
            isLoading={isLoading}
            onNavigate={handleNavigate}
          />
        </div>
      )}
    </div>
  );
}
