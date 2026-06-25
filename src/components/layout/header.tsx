import Link from "next/link";
import { User } from "lucide-react";

import { utilityNav } from "@/config/nav";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/layout/navigation";
import { MobileNav } from "@/components/layout/mobile-nav";
import { HeaderSearch } from "@/components/search/header-search";
import { MobileSearchSheet } from "@/components/search/mobile-search-sheet";
import { CartSheet } from "@/components/cart/cart-sheet";
import { WishlistSheet } from "@/components/wishlist/wishlist-sheet";

/**
 * Site header. Two-tier structure:
 *   1. A thin utility bar (hidden on mobile) for secondary links —
 *      the "find a store / customer care" register of a flagship
 *      menswear site, kept visually quiet (text-label, low contrast).
 *   2. The main bar: mobile menu trigger (left, below `lg`) / nav
 *      (left, `lg` and up) — centered wordmark — action icons (right).
 *
 * The centered wordmark with flanking nav is the deliberate signature
 * layout choice here (see design rationale in globals.css), distinct
 * from a conventional left-aligned-logo SaaS navbar.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Utility bar */}
      <div className="hidden border-b border-border lg:block">
        <div className="container flex h-9 items-center justify-end gap-6">
          {utilityNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-label text-foreground/60 transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main bar */}
      <div className="container grid h-20 grid-cols-3 items-center">
        <div className="flex items-center justify-start gap-2">
          <MobileNav />
          <Navigation />
        </div>

        <div className="flex justify-center">
          <Link
            href="/"
            className="font-display text-2xl italic tracking-tight text-foreground sm:text-3xl"
            aria-label="Maison Noir — home"
          >
            Maison Noir
          </Link>
        </div>

        <div className="flex items-center justify-end gap-1">
          <HeaderSearch />
          <MobileSearchSheet />
          <Button variant="ghost" size="icon" aria-label="Account" asChild>
            <Link href="/login">
              <User className="h-[18px] w-[18px]" />
            </Link>
          </Button>
          <WishlistSheet />
          <CartSheet />
        </div>
      </div>
    </header>
  );
}
