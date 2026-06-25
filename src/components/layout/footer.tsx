import Link from "next/link";

import { Button } from "@/components/ui/button";

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

const footerColumns: FooterColumn[] = [
  {
    title: "Shop",
    links: [
      { label: "New Arrivals", href: "/products?sort=newest" },
      { label: "Tailoring", href: "/products?category=tailoring" },
      { label: "Outerwear", href: "/products?category=outerwear" },
      { label: "Footwear", href: "/products?category=footwear" },
      { label: "Accessories", href: "/products?category=accessories" },
    ],
  },
  {
    title: "Client Services",
    links: [
      { label: "Find a Store", href: "/stores" },
      { label: "Shipping & Returns", href: "/support/shipping" },
      { label: "Size Guide", href: "/support/sizing" },
      { label: "Contact Us", href: "/support" },
    ],
  },
  {
    title: "The House",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Craftsmanship", href: "/about/craftsmanship" },
      { label: "Sustainability", href: "/about/sustainability" },
      { label: "Careers", href: "/careers" },
    ],
  },
];

/**
 * Site footer. Hairline rules divide every region instead of card
 * backgrounds or shadows — keeps the same restrained, label-driven
 * vocabulary as the header (see `text-label` utility in globals.css).
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Newsletter — the most editorial block, given the most space */}
          <div className="lg:pr-8">
            <h2 className="font-display text-2xl italic text-foreground">
              Maison Noir
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Considered menswear, cut from the finest cloth. Join our list
              for early access to new collections and private appointments.
            </p>
            <form className="mt-6 flex max-w-xs items-stretch border-b border-foreground/30 focus-within:border-foreground">
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                required
                placeholder="Email address"
                className="w-full bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-label shrink-0 px-2"
              >
                Join
              </Button>
            </form>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-label text-foreground/50">
                {column.title}
              </h3>
              <ul className="mt-5 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col items-center gap-4 py-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Maison Noir. All rights
            reserved.
          </p>
          <nav aria-label="Legal" className="flex items-center gap-6">
            <Link
              href="/legal/privacy"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/legal/terms"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
