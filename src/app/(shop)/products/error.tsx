"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary. `getProductList` (see
 * `src/lib/data/products.ts`) deliberately throws on a genuinely
 * unreachable database rather than silently falling back to
 * placeholder content the way the home page's data layer does — an
 * empty *filtered* result is a normal state here, but "the database
 * is down" is not, and conflating the two would make broken filters
 * indistinguishable from an outage. This boundary catches that throw.
 */
export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex flex-col items-center justify-center px-6 py-32 text-center">
      <p className="font-display text-3xl italic text-foreground">
        Something went wrong loading the shop.
      </p>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Please try again in a moment.
      </p>
      <Button onClick={reset} className="mt-8 rounded-none">
        Try Again
      </Button>
    </div>
  );
}
