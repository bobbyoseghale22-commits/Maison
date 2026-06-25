"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { toast } from "sonner";

import {
  submitReviewSchema,
  type SubmitReviewInput,
} from "@/lib/validations/review";
import { submitReview } from "@/lib/actions/review";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  productId: string;
  productSlug: string;
  onSubmitted?: () => void;
}

/**
 * Review submission form. Uses `react-hook-form` + the
 * `@hookform/resolvers` zod adapter — both already project
 * dependencies, unused until now — so client-side validation runs
 * against the exact same `submitReviewSchema` the Server Action
 * re-validates with, rather than a hand-rolled duplicate set of rules
 * that could drift from it.
 */
export function ReviewForm({
  productId,
  productSlug,
  onSubmitted,
}: ReviewFormProps) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubmitReviewInput>({
    resolver: zodResolver(submitReviewSchema),
    defaultValues: { productId, rating: 0, title: "", comment: "" },
  });

  const rating = watch("rating");

  async function onSubmit(values: SubmitReviewInput) {
    const result = await submitReview(values, productSlug);

    if (!result.success) {
      if (result.message) {
        toast.error(result.message);
      }
      if (result.errors) {
        toast.error(
          Object.values(result.errors).flat()[0] ??
            "Please check your review.",
        );
      }
      return;
    }

    toast.success("Thanks — your review has been posted.");
    reset({ productId, rating: 0, title: "", comment: "" });
    onSubmitted?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="hidden" {...register("productId")} />

      <div>
        <label className="text-label text-foreground/60">Your Rating</label>
        <div
          className="mt-2 flex items-center gap-1"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onClick={() =>
                setValue("rating", star, { shouldValidate: true })
              }
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  star <= (hoverRating || rating)
                    ? "fill-foreground text-foreground"
                    : "fill-none text-foreground/25",
                )}
              />
            </button>
          ))}
        </div>
        {errors.rating && (
          <p className="mt-1 text-xs text-destructive">
            {errors.rating.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="review-title"
          className="text-label text-foreground/60"
        >
          Title{" "}
          <span className="normal-case text-foreground/40">(optional)</span>
        </label>
        <input
          id="review-title"
          {...register("title")}
          className="mt-2 h-10 w-full border border-input bg-background px-3 text-sm focus:border-foreground focus:outline-none"
          placeholder="Sum it up in a few words"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="review-comment"
          className="text-label text-foreground/60"
        >
          Review
        </label>
        <textarea
          id="review-comment"
          {...register("comment")}
          rows={4}
          className="mt-2 w-full resize-none border border-input bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
          placeholder="What did you think of the fit, fabric, and quality?"
        />
        {errors.comment && (
          <p className="mt-1 text-xs text-destructive">
            {errors.comment.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="rounded-none">
        {isSubmitting ? "Posting…" : "Post Review"}
      </Button>
    </form>
  );
}
