import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Promotional banner — a single full-bleed editorial strip, distinct
 * from the hero (inverted to a light surface with a dark accent
 * border, rather than repeating the hero's dark-field treatment) so
 * the two don't read as the same section twice on the page.
 */
export function PromoBanner() {
  return (
    <section
      aria-label="Current offer"
      className="border-y border-border bg-secondary"
    >
      <div className="container flex flex-col items-center gap-6 py-16 text-center sm:py-20">
        <p className="text-label text-accent">Private Sale</p>
        <h2 className="max-w-2xl font-display text-3xl italic text-foreground sm:text-4xl lg:text-5xl">
          Complimentary tailoring on all suiting, this week only.
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Every suit and blazer includes a complimentary fitting at checkout
          — in-store or by appointment.
        </p>
        <Button asChild size="lg" className="mt-2 rounded-none">
          <Link href="/products?category=tailoring">Shop Tailoring</Link>
        </Button>
      </div>
    </section>
  );
}
