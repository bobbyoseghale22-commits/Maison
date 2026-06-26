"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { mainNav } from "@/config/nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Mobile navigation, shown below `lg` in place of `Navigation`'s
 * inline links (see `header.tsx`). Closes itself on link tap so the
 * drawer doesn't linger over the destination page.
 */
export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex w-[85vw] flex-col p-0">
        <SheetHeader>
          <SheetTitle>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="font-display text-xl italic tracking-tight"
            >
              Maison Noir
            </Link>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation menu
          </SheetDescription>
        </SheetHeader>

        <nav className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
          <ul className="flex flex-col">
            {mainNav.map((item) => (
              <li
                key={item.href}
                className="border-b border-border last:border-b-0"
              >
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-4 font-display text-2xl italic text-foreground transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

        </nav>

        <div className="border-t border-border px-6 py-5">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="text-label block text-center text-foreground/70 transition-colors hover:text-foreground"
          >
            Sign In / Register
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
