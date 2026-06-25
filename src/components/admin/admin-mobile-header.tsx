"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  BarChart2,
  Package,
  FolderOpen,
  ShoppingBag,
  MessageSquare,
  Users,
  Tag,
  ExternalLink,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS: Array<{
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}> = [
  { label: "Dashboard",    href: "/admin",                  icon: LayoutDashboard, exact: true },
  { label: "Analytics",   href: "/admin/analytics",         icon: BarChart2 },
  { label: "Products",    href: "/admin/products",          icon: Package },
  { label: "Categories",  href: "/admin/categories",        icon: FolderOpen },
  { label: "Orders",      href: "/admin/orders",            icon: ShoppingBag },
  { label: "Reviews",     href: "/admin/reviews",           icon: MessageSquare },
  { label: "Customers",   href: "/admin/customers",         icon: Users },
  { label: "Coupons",     href: "/admin/coupons",           icon: Tag },
  { label: "Upload Images", href: "/admin/products/upload", icon: ImagePlus },
];

/** Top bar + slide-down nav shown on mobile (below lg breakpoint). */
export function AdminMobileHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="lg:hidden">
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
        <Link href="/admin" className="font-display text-lg italic text-foreground">
          Maison Noir{" "}
          <span className="text-foreground/30 text-sm not-italic font-sans">admin</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {open && (
        <nav className="border-b border-border bg-background px-2 py-3">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ label, href, icon: Icon, exact = false }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                    isActive(href, exact)
                      ? "bg-foreground text-background"
                      : "text-foreground/60 hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground/40 hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                View Store
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
