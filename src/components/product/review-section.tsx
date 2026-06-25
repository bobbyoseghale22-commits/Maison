"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/product/review-form";
import { deleteReview } from "@/lib/actions/review";

interface ExistingReview {
  id: string;
  rating: number;
  title?: string;
  comment: string;
}

interface ReviewSectionProps {
  productId: string;
  productSlug: string;
  /** Passed from the Server Component if the current user already has a review. */
  existingReview?: ExistingReview | null;
}

/**
 * Client island at the bottom of the reviews panel.
 *
 * Three states:
 *  1. User has an existing review → show it with a delete button.
 *  2. User has no review and form is hidden → show "Write a Review" button.
 *  3. User has no review and form is open → show ReviewForm + Cancel.
 */
export function ReviewSection({
  productId,
  productSlug,
  existingReview,
}: ReviewSectionProps) {
  const router = useRouter();
  const [showForm, setShowForm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // If the user already left a review, show it and let them delete it.
  if (existingReview) {
    return (
      <div className="mt-8 border-t border-border pt-6 space-y-3">
        <h3 className="text-label text-foreground">Your Review</h3>
        <div className="border border-border p-4 space-y-1">
          {existingReview.title && (
            <p className="font-display italic text-foreground">
              {existingReview.title}
            </p>
          )}
          <p className="text-sm text-foreground/80">{existingReview.comment}</p>
        </div>
        <button
          type="button"
          disabled={isDeleting}
          onClick={async () => {
            setIsDeleting(true);
            const result = await deleteReview(existingReview.id, productSlug);
            if (result.success) {
              toast.success("Review deleted.");
              router.refresh();
            } else {
              toast.error(result.message ?? "Could not delete review.");
              setIsDeleting(false);
            }
          }}
          className="flex items-center gap-1.5 text-label text-destructive hover:text-destructive/70 transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {isDeleting ? "Deleting…" : "Delete review"}
        </button>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="mt-8 border-t border-border pt-6">
        <h3 className="text-label text-foreground">Write a Review</h3>
        <div className="mt-4">
          <ReviewForm
            productId={productId}
            productSlug={productSlug}
            onSubmitted={() => setShowForm(false)}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="mt-3 text-label text-foreground/50 underline-offset-4 hover:text-foreground hover:underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => setShowForm(true)}
      className="mt-8 w-full rounded-none"
    >
      Write a Review
    </Button>
  );
}
