import Link from "next/link";
import Image from "next/image";

import type { CardCategory } from "@/lib/data/home";
import { cn } from "@/lib/utils";

interface FeaturedCategoriesProps {
  categories: CardCategory[];
}

/**
 * Featured categories grid. Mirrors `ProductCard`'s typographic
 * placeholder treatment when a category has no image yet, so the
 * section reads consistently with the rest of the catalog rather
 * than mixing a "finished" look with a "needs content" look.
 *
 * Text color flips per-category (dark text on the plain placeholder
 * tile, light text over a photo + gradient) since both tile types
 * render side by side in the same grid.
 */
export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="categories-heading" className="py-16 sm:py-20">
      <div className="container">
        <div className="max-w-xl">
          <p className="text-label text-foreground/40">Shop by Category</p>
          <h2
            id="categories-heading"
            className="mt-2 font-display text-3xl italic text-foreground sm:text-4xl"
          >
            Every piece, by purpose.
          </h2>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const hasImage = category.hasImage && Boolean(category.imageUrl);

            return (
              <li key={category.id} className="bg-background">
                <Link
                  href={`/products?category=${category.slug}`}
                  className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden p-6 focus-visible:outline-none"
                >
                  {hasImage ? (
                    <>
                      <Image
                        src={category.imageUrl as string}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent"
                      />
                    </>
                  ) : (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-br from-secondary to-background"
                    />
                  )}

                  <span
                    className={cn(
                      "relative font-display text-2xl italic transition-colors",
                      hasImage
                        ? "text-background group-hover:text-accent"
                        : "text-foreground group-hover:text-accent",
                    )}
                  >
                    {category.name}
                  </span>
                  {category.description && (
                    <span
                      className={cn(
                        "relative mt-1 max-w-[22ch] text-xs",
                        hasImage ? "text-background/70" : "text-muted-foreground",
                      )}
                    >
                      {category.description}
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className="relative mt-4 h-px w-8 bg-accent transition-all duration-300 group-hover:w-12"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
