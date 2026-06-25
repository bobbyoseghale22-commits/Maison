import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value`, updating only after `delayMs`
 * has passed without `value` changing again. Used by `SearchBar` so
 * suggestions don't fire a request on every keystroke — only once
 * typing pauses.
 *
 * @example
 * const debouncedQuery = useDebouncedValue(query, 250);
 * useEffect(() => { fetchSuggestions(debouncedQuery); }, [debouncedQuery]);
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
