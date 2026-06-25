"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/search-bar";

/**
 * Desktop search entry point in the header — toggles between a quiet
 * icon button (matching the other header actions) and a full-width
 * `SearchBar` anchored beneath the header bar, rather than navigating
 * to a separate search page just to start typing.
 *
 * Positioned `absolute` relative to `<header>` (which is `sticky`,
 * and therefore already a positioning context) so it overlays the
 * page content directly below the header rather than pushing it down.
 */
export function HeaderSearch() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={isOpen ? "Close search" : "Search"}
        aria-expanded={isOpen}
        className="hidden sm:inline-flex"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? (
          <X className="h-[18px] w-[18px]" />
        ) : (
          <Search className="h-[18px] w-[18px]" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute inset-x-0 top-full hidden border-b border-border bg-background shadow-md sm:block">
          <div className="container py-5">
            <SearchBar autoFocus onNavigate={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
