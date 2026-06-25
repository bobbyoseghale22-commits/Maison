import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface FooterCtaLink {
  label: string;
  description: string;
  href: string;
}

const ctaLinks: FooterCtaLink[] = [
  {
    label: "Book a Fitting",
    description: "Private appointments at any of our ateliers.",
    href: "/stores",
  },
  {
    label: "Customer Care",
    description: "Sizing, shipping, and order questions.",
    href: "/support",
  },
  {
    label: "Our Craftsmanship",
    description: "How every piece is made, and by whom.",
    href: "/about/craftsmanship",
  },
];

/**
 * Closing call-to-action strip, between the page content and the
 * global `Footer` (rendered in `src/app/layout.tsx`). Distinct from
 * the footer itself — this is a brand-voice closing statement with
 * three deep links, not the sitemap/legal footer.
 */
export function FooterCta() {
  return (
    <section
      aria-labelledby="footer-cta-heading"
      className="border-t border-border"
    >
      <div className="container py-16 sm:py-20">
        <h2
          id="footer-cta-heading"
          className="max-w-2xl font-display text-3xl italic text-foreground sm:text-4xl"
        >
          Considered details, from first thread to final stitch.
        </h2>

        <ul className="mt-10 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
          {ctaLinks.map((link) => (
            <li key={link.href} className="bg-background">
              <Link
                href={link.href}
                className="group flex h-full flex-col justify-between gap-6 p-8 focus-visible:outline-none"
              >
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-5 w-5 text-foreground/40 transition-colors group-hover:text-accent"
                />
                <div>
                  <p className="font-display text-xl italic text-foreground">
                    {link.label}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {link.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
