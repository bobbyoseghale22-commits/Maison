import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Rendered when `getProductBySlug` returns `null` (missing, inactive,
 * or mistyped slug) and the page calls `notFound()`. Scoped to this
 * route segment, so it doesn't replace the root 404 for unrelated
 * pages.
 */
export default function ProductNotFound() {
  return (
    <div className="container flex flex-col items-center justify-center px-6 py-32 text-center">
      <p className="font-display text-4xl italic text-foreground">
        We couldn&rsquo;t find that piece.
      </p>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        It may have sold out or been removed from the collection.
      </p>
      <Button asChild className="mt-8 rounded-none">
        <Link href="/products">Back to Shop</Link>
      </Button>
    </div>
  );
}
