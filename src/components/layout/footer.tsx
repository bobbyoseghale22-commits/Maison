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

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-white">
      {/* Main footer content */}
      <div className="container py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Newsletter */}
          <div className="lg:pr-8">
            <h2 className="font-display text-2xl italic text-white">
              Maison Noir
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
              Considered menswear, cut from the finest cloth. Join our list
              for early access to new collections and private appointments.
            </p>
            <form className="mt-6 flex max-w-xs items-stretch border-b border-white/30 focus-within:border-white">
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                required
                placeholder="Email address"
                className="w-full bg-transparent py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-label shrink-0 px-2 text-white hover:text-white/70 hover:bg-transparent"
              >
                Join
              </Button>
            </form>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-label text-white/40 tracking-widest text-xs uppercase">
                {column.title}
              </h3>
              <ul className="mt-5 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 transition-colors hover:text-white"
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

      {/* Legal bar */}
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center gap-4 py-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Maison Noir. All rights reserved.
          </p>
          <nav aria-label="Legal" className="flex items-center gap-6">
            <Link
              href="/legal/privacy"
              className="text-xs text-white/40 transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              href="/legal/terms"
              className="text-xs text-white/40 transition-colors hover:text-white"
            >
              Terms of Service
            </Link>
          </nav>
        </div>
      </div>

      {/* Big wordmark — centered, scaled to fit viewport */}
      <div className="overflow-hidden border-t border-white/10 select-none">
        <p
          aria-hidden="true"
          className="font-display italic font-semibold leading-none text-white text-center w-full"
          style={{ fontSize: "clamp(3rem, 11vw, 10rem)" }}
        >
          Maison Noir
        </p>
      </div>
    </footer>
  );
}
