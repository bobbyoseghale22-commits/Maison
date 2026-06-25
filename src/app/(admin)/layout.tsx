import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileHeader } from "@/components/admin/admin-mobile-header";

export const metadata: Metadata = {
  title: {
    default: "Admin — Maison Noir",
    template: "%s — Admin",
  },
};

/**
 * Admin route group layout. Completely replaces the shop's
 * Header/Footer with a sidebar navigation, so admin pages are visually
 * distinct from the customer-facing storefront. Route protection is
 * handled by auth.config.ts (ADMIN_PREFIXES) at the middleware layer —
 * no need to re-check auth here.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <AdminSidebar />

      {/* Content area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile-only top bar */}
        <AdminMobileHeader />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
