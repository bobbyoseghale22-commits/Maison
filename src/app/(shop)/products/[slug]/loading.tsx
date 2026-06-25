/**
 * Route-level loading UI, shown automatically by Next.js while
 * `ProductPage`'s async data fetching resolves. Mirrors the real
 * page's two-column structure so there's no layout shift when
 * content arrives — same approach as
 * `src/app/(shop)/products/loading.tsx`.
 */
export default function ProductLoading() {
  return (
    <div className="container py-10 sm:py-14">
      <div className="h-3 w-32 animate-pulse bg-secondary" />

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="grid grid-cols-[64px_1fr] gap-4 sm:grid-cols-[80px_1fr]">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="aspect-[4/5] w-full animate-pulse bg-secondary"
              />
            ))}
          </div>
          <div className="aspect-[4/5] w-full animate-pulse bg-secondary" />
        </div>

        <div>
          <div className="h-3 w-24 animate-pulse bg-secondary" />
          <div className="mt-3 h-10 w-3/4 animate-pulse bg-secondary" />
          <div className="mt-4 h-6 w-24 animate-pulse bg-secondary" />

          <div className="mt-8 space-y-6">
            <div className="h-9 w-full animate-pulse bg-secondary" />
            <div className="h-11 w-full animate-pulse bg-secondary" />
          </div>

          <div className="mt-8 h-12 w-full animate-pulse bg-secondary" />
        </div>
      </div>
    </div>
  );
}
