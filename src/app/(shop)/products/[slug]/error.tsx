"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary, mirroring
 * `src/app/(shop)/products/error.tsx` — catches a genuinely
 * unreachable database. A missing/inactive product is handled
 * separately via `notFound()` in the page itself
 * (`src/app/(shop)/products/[slug]/page.tsx`) and renders
 * `not-found.tsx`, not this boundary.
 */
export default function ProductError({
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
        Something went wrong loading this product.
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
