"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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

/**
 * Persistent left sidebar for the admin area. Desktop-only — the
 * mobile equivalent is AdminMobileHeader with a slide-out sheet.
 */
export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-background lg:flex lg:flex-col">
      {/* Wordmark */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link
          href="/admin"
          className="font-display text-lg italic tracking-tight text-foreground"
        >
          Maison Noir
        </Link>
        <span className="text-label ml-2 text-foreground/30">admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
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
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer links */}
      <div className="border-t border-border p-3 space-y-0.5">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground/40 hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          View Store
        </Link>
      </div>
    </aside>
  );
}
