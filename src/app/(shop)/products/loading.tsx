/**
 * Route-level loading UI, shown automatically by Next.js while
 * `ProductsPage`'s async data fetching resolves. Mirrors the real
 * page's grid structure so there's no layout shift when content
 * arrives.
 */
export default function ProductsLoading() {
  return (
    <div className="container py-12 sm:py-16">
      <div className="max-w-2xl">
        <div className="h-3 w-16 animate-pulse bg-secondary" />
        <div className="mt-3 h-10 w-64 animate-pulse bg-secondary" />
        <div className="mt-4 h-4 w-full max-w-md animate-pulse bg-secondary" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="space-y-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="h-6 w-full animate-pulse bg-secondary"
              />
            ))}
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between border-b border-border pb-6">
            <div className="h-4 w-20 animate-pulse bg-secondary" />
            <div className="h-9 w-[200px] animate-pulse bg-secondary" />
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <li key={i}>
                <div className="aspect-[4/5] animate-pulse bg-secondary" />
                <div className="mt-4 h-3 w-1/3 animate-pulse bg-secondary" />
                <div className="mt-2 h-5 w-2/3 animate-pulse bg-secondary" />
                <div className="mt-2 h-4 w-1/4 animate-pulse bg-secondary" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
