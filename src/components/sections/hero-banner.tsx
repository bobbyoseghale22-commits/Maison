"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    src: "https://res.cloudinary.com/duoo6ywtv/image/upload/v1782392777/samples/ecommerce/analog-classic.jpg",
    alt: "Analog classic — Autumn / Winter Collection",
  },
  {
    src: "https://res.cloudinary.com/duoo6ywtv/image/upload/v1782392782/samples/ecommerce/leather-bag-gray.jpg",
    alt: "Leather bag in grey — Autumn / Winter Collection",
  },
  {
    src: "https://res.cloudinary.com/duoo6ywtv/image/upload/v1782392782/samples/ecommerce/accessories-bag.jpg",
    alt: "Accessories bag — Autumn / Winter Collection",
  },
];

const INTERVAL_MS = 5000;

export function HeroBanner() {
  const [current, setCurrent] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = React.useCallback((index: number) => {
    setCurrent(index);
  }, []);

  React.useEffect(() => {
    timerRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, INTERVAL_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current]);

  return (
    <section
      aria-label="Featured collection"
      className="relative flex min-h-[85svh] items-end overflow-hidden bg-foreground text-background sm:min-h-[90svh]"
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          aria-hidden={i !== current}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            i === current ? "opacity-100" : "opacity-0",
          )}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="100vw"
            className="object-cover"
            priority={i === 0}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-foreground/20"
          />
        </div>
      ))}

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

        <div className="mt-8 flex gap-2" role="tablist" aria-label="Slideshow controls">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => advance(i)}
              className={cn(
                "h-px transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background",
                i === current ? "w-8 bg-background" : "w-4 bg-background/40 hover:bg-background/70",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
