"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import * as React from "react";

interface AdminSearchProps {
  placeholder?: string;
  paramName?: string;
}

/**
 * Debounced URL-driven search input for admin tables. Writes the
 * query into a URL search param so results are bookmarkable and
 * server-rendered — same pattern as the shop's search bar, adapted
 * for the admin context where a full-page navigation on each
 * keystroke is acceptable (server renders the filtered table).
 */
export function AdminSearch({
  placeholder = "Search…",
  paramName = "q",
}: AdminSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(
    searchParams.get(paramName) ?? "",
  );
  const debounced = useDebouncedValue(query, 350);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debounced) {
      params.set(paramName, debounced);
    } else {
      params.delete(paramName);
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }, [debounced, paramName, pathname, router, searchParams]);

  return (
    <div className="relative max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full border border-input bg-background pl-9 pr-3 text-sm text-foreground focus:border-foreground focus:outline-none"
      />
    </div>
  );
}
