"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface ReviewDeleteButtonProps {
  reviewId: string;
}

/**
 * Hard-delete button for a review in the admin table. Requires
 * confirmation before firing. The Review model's post-delete hook
 * re-syncs the product's ratingAverage automatically.
 */
export function ReviewDeleteButton({ reviewId }: ReviewDeleteButtonProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleDelete() {
    if (!window.confirm("Permanently delete this review?")) return;

    setPending(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete review.");
        return;
      }

      toast.success("Review deleted.");
      router.refresh();
    } catch {
      toast.error("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label="Delete review"
      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
