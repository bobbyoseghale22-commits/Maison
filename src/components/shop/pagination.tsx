import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { withParam, type SearchParamsInit } from "@/lib/shop-url";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  pathname: string;
  searchParams: SearchParamsInit;
}

/** Builds the compact page-number list with ellipses, e.g.
 * [1, "…", 4, 5, 6, "…", 12] — always shows first, last, and a
 * window around the current page so the control stays a fixed,
 * predictable width regardless of total page count. */
function buildPageList(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([
    1,
    2,
    totalPages - 1,
    totalPages,
    page - 1,
    page,
    page + 1,
  ]);

  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

interface PageLinkProps {
  href: string;
  current?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  "aria-label": string;
  "aria-current"?: "page";
}

function PageLink({
  href,
  current,
  disabled,
  children,
  ...aria
}: PageLinkProps) {
  const className = cn(
    "flex h-9 min-w-9 items-center justify-center border text-sm transition-colors",
    current
      ? "border-foreground bg-foreground text-background"
      : "border-border text-foreground/70 hover:border-foreground hover:text-foreground",
    disabled && "pointer-events-none opacity-30",
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled="true" {...aria}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className} {...aria}>
      {children}
    </Link>
  );
}

/**
 * Server Component — pure `<Link>`s with no client JS needed, so page
 * navigation is a real (and prefetchable, crawlable) URL change. Used
 * by the shop and category pages identically.
 */
export function Pagination({
  page,
  totalPages,
  pathname,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageList = buildPageList(page, totalPages);

  function hrefFor(targetPage: number): string {
    return `${pathname}${withParam(
      searchParams,
      "page",
      targetPage > 1 ? String(targetPage) : null,
    )}`;
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-16 flex items-center justify-center gap-2"
    >
      <PageLink
        href={hrefFor(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </PageLink>

      <ul className="flex items-center gap-2">
        {pageList.map((entry, index) =>
          entry === "…" ? (
            <li
              key={`ellipsis-${index}`}
              className="px-2 text-sm text-muted-foreground"
              aria-hidden="true"
            >
              …
            </li>
          ) : (
            <li key={entry}>
              <PageLink
                href={hrefFor(entry)}
                current={entry === page}
                aria-label={`Page ${entry}`}
                aria-current={entry === page ? "page" : undefined}
              >
                {entry}
              </PageLink>
            </li>
          ),
        )}
      </ul>

      <PageLink
        href={hrefFor(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}
