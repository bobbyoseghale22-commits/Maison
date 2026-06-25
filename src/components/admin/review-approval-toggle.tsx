"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewApprovalToggleProps {
  reviewId: string;
  isApproved: boolean;
}

/**
 * Inline approve/reject toggle for the admin reviews table. Calls
 * PATCH /api/admin/reviews/[reviewId] and refreshes the page so the
 * server-rendered table reflects the updated approval status — and
 * the product's ratingAverage updates via the model hook.
 */
export function ReviewApprovalToggle({
  reviewId,
  isApproved,
}: ReviewApprovalToggleProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [optimistic, setOptimistic] = React.useState(isApproved);

  async function toggle() {
    const next = !optimistic;
    setOptimistic(next);
    setPending(true);

    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: next }),
      });

      if (!res.ok) {
        setOptimistic(!next); // roll back
        toast.error("Failed to update review.");
        return;
      }

      toast.success(next ? "Review approved." : "Review hidden.");
      router.refresh();
    } catch {
      setOptimistic(!next);
      toast.error("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "text-label border px-3 py-1 transition-colors disabled:opacity-50",
        optimistic
          ? "border-foreground bg-foreground text-background hover:bg-foreground/80"
          : "border-border text-foreground/50 hover:border-foreground hover:text-foreground",
      )}
    >
      {optimistic ? "Approved" : "Hidden"}
    </button>
  );
}
