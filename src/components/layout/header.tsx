import Link from "next/link";
import { User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/layout/navigation";
import { MobileNav } from "@/components/layout/mobile-nav";
import { HeaderSearch } from "@/components/search/header-search";
import { MobileSearchSheet } from "@/components/search/mobile-search-sheet";
import { CartSheet } from "@/components/cart/cart-sheet";
import { WishlistSheet } from "@/components/wishlist/wishlist-sheet";
import { getCurrentUser } from "@/lib/auth/utils";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center gap-4 sm:h-18 lg:h-20">
        {/* Mobile hamburger — left of logo on small screens */}
        <MobileNav />

        {/* Logo — left on desktop, centered on mobile via flex-1 trick */}
        <Link
          href="/"
          className="font-display text-xl italic tracking-tight text-foreground sm:text-2xl lg:text-3xl"
          aria-label="Maison Noir — home"
        >
          Maison Noir
        </Link>

        {/* Spacer — pushes nav to center on desktop, icons right on mobile */}
        <div className="flex-1" />

        {/* Desktop nav — centered absolutely between logo and icons */}
        <Navigation />

        {/* Spacer — mirrors left side so nav stays centered */}
        <div className="flex-1" />

        {/* Icon cluster */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <HeaderSearch />
          <MobileSearchSheet />
          {user ? (
            <Button variant="ghost" size="icon" aria-label="My Account" asChild>
              <Link href="/account">
                <User className="h-[18px] w-[18px]" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" aria-label="Sign In" asChild>
              <Link href="/login">
                <User className="h-[18px] w-[18px]" />
              </Link>
            </Button>
          )}
          <WishlistSheet />
          <CartSheet />
        </div>
      </div>
    </header>
  );
}
