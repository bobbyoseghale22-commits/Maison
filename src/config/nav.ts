/**
 * Primary navigation structure, shared between the desktop nav
 * (`navigation.tsx`) and the mobile nav (`mobile-nav.tsx`) so both
 * stay in sync from a single source instead of two hand-maintained
 * link lists.
 *
 * Static for now — no pages exist yet to link to beyond placeholders,
 * and category-driven navigation (pulling from the `Category` model)
 * is a future data-fetching concern, not a layout-chrome concern.
 */
export interface NavLink {
  label: string;
  href: string;
  /** Short description shown in the mobile nav under the label. */
  description?: string;
}

export const mainNav: NavLink[] = [
  { label: "Shop", href: "/products?sort=newest" },
  { label: "Tailoring", href: "/products?category=tailoring" },
  { label: "Outerwear", href: "/products?category=outerwear" },
  { label: "Footwear", href: "/products?category=footwear" },
  { label: "Accessories", href: "/products?category=accessories" },
];

export const utilityNav: NavLink[] = [
  { label: "Find a Store", href: "/stores" },
  { label: "Customer Care", href: "/support" },
];
