"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SearchBar } from "@/components/search/search-bar";

/**
 * Mobile search entry point — `HeaderSearch`'s inline-expand pattern
 * doesn't translate well to small screens (no room to overlay a full
 * search bar under a busy mobile header), so this uses the same
 * top-anchored `Sheet` pattern as `MobileFilterSheet`
 * (`src/components/shop/mobile-filter-sheet.tsx`) instead.
 */
export function MobileSearchSheet() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Search"
          className="sm:hidden"
        >
          <Search className="h-[18px] w-[18px]" />
        </Button>
      </SheetTrigger>

      <SheetContent side="top" className="p-0">
        <SheetHeader>
          <SheetTitle>Search</SheetTitle>
          <SheetDescription className="sr-only">
            Search for products and categories.
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-6 pt-2">
          {open && <SearchBar autoFocus onNavigate={() => setOpen(false)} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
