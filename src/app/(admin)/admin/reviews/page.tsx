import type { Metadata } from "next";
import Link from "next/link";

import { adminGetReviews } from "@/lib/data/admin-reviews";
import { formatDate } from "@/lib/helpers";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { RatingStars } from "@/components/product/rating-stars";
import { ReviewApprovalToggle } from "@/components/admin/review-approval-toggle";
import { ReviewDeleteButton } from "@/components/admin/review-delete-button";
import type { AdminReviewRow } from "@/lib/data/admin-reviews";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reviews" };

interface AdminReviewsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminReviewsPage({
  searchParams,
}: AdminReviewsPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const approvedParam = params.approved;
  const ratingParam = params.rating;

  const filter: { approved?: boolean; rating?: number } = {};
  if (approvedParam === "true") filter.approved = true;
  if (approvedParam === "false") filter.approved = false;
  if (ratingParam) filter.rating = Number(ratingParam);

  const result = await adminGetReviews(page, filter);

  const filterLinks = [
    { label: "All", params: {} },
    { label: "Approved", params: { approved: "true" } },
    { label: "Hidden", params: { approved: "false" } },
    { label: "⭐⭐⭐⭐⭐ 5", params: { rating: "5" } },
    { label: "⭐ 1–2", params: { rating: "1" } },
  ];

  function href(p: Record<string, string>) {
    const sp = new URLSearchParams(p);
    return `/admin/reviews?${sp.toString()}`;
  }

  function isActiveFilter(p: Record<string, string>) {
    return Object.entries(p).every(([k, v]) => params[k] === v) &&
      Object.keys(p).length === Object.keys(params).length - (params.page ? 1 : 0);
  }

  return (
    <div className="p-6 sm:p-10 space-y-8">
      <div>
        <p className="text-label text-foreground/40">Moderation</p>
        <h1 className="mt-1 font-display text-4xl italic text-foreground">
          Reviews
        </h1>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {filterLinks.map(({ label, params: p }) => (
          <Link
            key={label}
            href={href(p as Record<string, string>)}
            className={cn(
              "text-label border px-4 py-1.5 transition-colors",
              isActiveFilter(p as Record<string, string>)
                ? "border-foreground bg-foreground text-background"
                : "border-border text-foreground/60 hover:border-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      <AdminTable<AdminReviewRow>
        rows={result.reviews}
        emptyMessage="No reviews found."
        columns={[
          {
            key: "product",
            header: "Product",
            render: (row) => (
              <div className="min-w-0">
                {row.productSlug ? (
                  <Link
                    href={`/products/${row.productSlug}`}
                    target="_blank"
                    className="text-sm font-medium text-foreground hover:underline underline-offset-4 line-clamp-1"
                  >
                    {row.productName}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {row.productName}
                  </span>
                )}
                <p className="text-xs text-muted-foreground">{row.userName}</p>
              </div>
            ),
          },
          {
            key: "rating",
            header: "Rating",
            render: (row) => <RatingStars rating={row.rating} />,
          },
          {
            key: "review",
            header: "Review",
            className: "max-w-xs",
            render: (row) => (
              <div className="space-y-0.5">
                {row.title && (
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {row.title}
                  </p>
                )}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {row.comment}
                </p>
              </div>
            ),
          },
          {
            key: "verified",
            header: "Verified",
            render: (row) => (
              <span className={`text-label ${row.isVerifiedPurchase ? "text-foreground" : "text-foreground/30"}`}>
                {row.isVerifiedPurchase ? "Yes" : "No"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <ReviewApprovalToggle
                reviewId={row.id}
                isApproved={row.isApproved}
              />
            ),
          },
          {
            key: "date",
            header: "Date",
            className: "text-muted-foreground whitespace-nowrap",
            render: (row) => formatDate(row.createdAt),
          },
          {
            key: "actions",
            header: "",
            render: (row) => (
              <ReviewDeleteButton reviewId={row.id} />
            ),
          },
        ]}
      />

      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        basePath="/admin/reviews"
        currentParams={Object.fromEntries(
          Object.entries(params).filter(([k]) => k !== "page"),
        ) as Record<string, string>}
      />
    </div>
  );
}
