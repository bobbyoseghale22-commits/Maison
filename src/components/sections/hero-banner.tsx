import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Hero banner. No product photography exists yet (see
 * `src/lib/data/home.ts`), so this leans fully into the typographic
 * signature — an oversized italic display headline on a near-black
 * field — rather than a generic image-behind-text hero with a gap
 * where a photo should be.
 *
 * `<h1>` lives here, the only one on the page, satisfying both SEO
 * and the single-page-heading accessibility convention.
 */
export function HeroBanner() {
  return (
    <section
      aria-label="Featured collection"
      className="relative flex min-h-[85svh] items-end overflow-hidden bg-foreground text-background sm:min-h-[90svh]"
    >
      {/* Quiet ambient texture — a single hairline frame, not a photo */}
      <div
        aria-hidden="true"
        className="absolute inset-6 border border-background/10 sm:inset-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-accent/10 blur-3xl"
      />

      <div className="container relative pb-16 pt-32 sm:pb-24">
        <p className="text-label text-background/60">
          Autumn / Winter Collection
        </p>

        <h1 className="mt-6 max-w-3xl font-display text-5xl italic leading-[1.05] text-background sm:text-7xl lg:text-8xl">
          Tailored for the long season ahead.
        </h1>

        <p className="mt-6 max-w-md text-base leading-relaxed text-background/70">
          Considered menswear cut from the finest cloth — built to be worn
          for years, not seasons.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="rounded-none bg-background text-foreground hover:bg-background/90"
          >
            <Link href="/products?sort=newest">Shop New Arrivals</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-none border-background/40 bg-transparent text-background hover:bg-background/10 hover:text-background"
          >
            <Link href="/products">Explore The Collection</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
