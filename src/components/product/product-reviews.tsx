import Link from "next/link";
import { CheckCircle } from "lucide-react";

import type { ReviewSummary } from "@/lib/data/product-detail";
import { formatDate } from "@/lib/helpers";
import { RatingStars } from "@/components/product/rating-stars";
import { ReviewSection } from "@/components/product/review-section";
import { cn } from "@/lib/utils";

interface ProductReviewsProps {
  productId: string;
  productSlug: string;
  summary: ReviewSummary;
  page: number;
  sort: string;
  existingReview?: { id: string; rating: number; title?: string; comment: string } | null;
}

const SORT_OPTIONS = [
  { value: "newest",  label: "Newest" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest",  label: "Lowest Rated" },
] as const;

/**
 * Server Component: rating summary, star distribution bars, sort
 * controls, the review list, and pagination links — all static per
 * request. The interactive pieces (write/delete form) are in the
 * `ReviewSection` client island at the bottom.
 */
export function ProductReviews({
  productId,
  productSlug,
  summary,
  page,
  sort,
  existingReview,
}: ProductReviewsProps) {
  function reviewUrl(params: { page?: number; sort?: string }) {
    const sp = new URLSearchParams();
    const p = params.page ?? page;
    const s = params.sort ?? sort;
    if (p > 1) sp.set("page", String(p));
    if (s && s !== "newest") sp.set("sort", s);
    const qs = sp.toString();
    return `/products/${productSlug}${qs ? `?${qs}` : ""}#reviews`;
  }

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="border-t border-border py-16 sm:py-20"
    >
      <div className="container">
        <h2
          id="reviews-heading"
          className="font-display text-3xl italic text-foreground sm:text-4xl"
        >
          Reviews
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[280px_1fr]">
          {/* ── Left column: summary + distribution + form ── */}
          <div>
            {/* Aggregate */}
            <div className="flex items-baseline gap-3">
              <span className="font-display text-5xl italic text-foreground">
                {summary.ratingAverage > 0
                  ? summary.ratingAverage.toFixed(1)
                  : "—"}
              </span>
              <div>
                <RatingStars rating={summary.ratingAverage} size="md" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {summary.ratingCount === 0
                    ? "No reviews yet"
                    : `${summary.ratingCount} ${summary.ratingCount === 1 ? "review" : "reviews"}`}
                </p>
              </div>
            </div>

            {/* Distribution bars */}
            {summary.ratingCount > 0 && (
              <div className="mt-6 space-y-2">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const count = summary.distribution[star];
                  const pct =
                    summary.ratingCount > 0
                      ? Math.round((count / summary.ratingCount) * 100)
                      : 0;
                  return (
                    <div
                      key={star}
                      className="flex items-center gap-3 text-xs text-muted-foreground"
                    >
                      <span className="w-3 shrink-0">{star}</span>
                      <div className="h-1 flex-1 bg-secondary">
                        <div
                          className="h-1 bg-foreground transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Write / delete form */}
            <ReviewSection
              productId={productId}
              productSlug={productSlug}
              existingReview={existingReview}
            />
          </div>

          {/* ── Right column: sort + list + pagination ── */}
          <div>
            {summary.ratingCount > 0 && (
              <div className="mb-6 flex items-center gap-3">
                <span className="text-label text-foreground/50 shrink-0">
                  Sort by
                </span>
                <div className="flex gap-2 flex-wrap">
                  {SORT_OPTIONS.map((opt) => (
                    <Link
                      key={opt.value}
                      href={reviewUrl({ sort: opt.value, page: 1 })}
                      className={cn(
                        "text-label border px-3 py-1 transition-colors",
                        sort === opt.value || (opt.value === "newest" && !sort)
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-foreground/60 hover:border-foreground hover:text-foreground",
                      )}
                    >
                      {opt.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {summary.reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No reviews yet — be the first to share your thoughts.
              </p>
            ) : (
              <>
                <ul className="space-y-8">
                  {summary.reviews.map((review) => (
                    <li
                      key={review.id}
                      className="border-b border-border pb-8 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <RatingStars rating={review.rating} />
                        <time
                          dateTime={
                            review.createdAt instanceof Date
                              ? review.createdAt.toISOString()
                              : String(review.createdAt)
                          }
                          className="text-xs text-muted-foreground shrink-0"
                        >
                          {formatDate(review.createdAt)}
                        </time>
                      </div>

                      {review.title && (
                        <h3 className="mt-3 font-display text-lg italic text-foreground">
                          {review.title}
                        </h3>
                      )}

                      <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                        {review.comment}
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {review.userName}
                        </p>
                        {review.isVerifiedPurchase && (
                          <span className="flex items-center gap-1 text-xs text-foreground/60">
                            <CheckCircle className="h-3 w-3" aria-hidden="true" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Pagination */}
                {summary.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Page {summary.page} of {summary.totalPages}
                    </span>
                    <div className="flex gap-2">
                      {summary.page > 1 && (
                        <Link
                          href={reviewUrl({ page: summary.page - 1 })}
                          className="border border-border px-4 py-1.5 text-label text-foreground/60 hover:border-foreground hover:text-foreground transition-colors"
                        >
                          ← Previous
                        </Link>
                      )}
                      {summary.page < summary.totalPages && (
                        <Link
                          href={reviewUrl({ page: summary.page + 1 })}
                          className="border border-border px-4 py-1.5 text-label text-foreground/60 hover:border-foreground hover:text-foreground transition-colors"
                        >
                          Next →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
