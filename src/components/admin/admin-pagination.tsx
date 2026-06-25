import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  /** Base path, e.g. "/admin/products". Query params are appended. */
  basePath: string;
  currentParams?: Record<string, string>;
}

/** Simple prev/next pagination for admin tables. Reuses the same
 *  Link-based, server-navigable approach as the shop's Pagination. */
export function AdminPagination({
  page,
  totalPages,
  total,
  basePath,
  currentParams = {},
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  function href(p: number) {
    const params = new URLSearchParams({ ...currentParams, page: String(p) });
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Page {page} of {totalPages} · {total} total
      </span>
      <div className="flex gap-1">
        {page > 1 ? (
          <Link href={href(page - 1)} className="flex h-8 w-8 items-center justify-center border border-border hover:border-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span className={cn("flex h-8 w-8 items-center justify-center border border-border opacity-30")}>
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}
        {page < totalPages ? (
          <Link href={href(page + 1)} className="flex h-8 w-8 items-center justify-center border border-border hover:border-foreground transition-colors">
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={cn("flex h-8 w-8 items-center justify-center border border-border opacity-30")}>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}
