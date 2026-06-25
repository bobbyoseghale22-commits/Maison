import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Read-only star rating display, shared by the rating summary, each
 * review in the list, and (rendered differently, as buttons) the
 * review submission form.
 */
export function RatingStars({
  rating,
  size = "sm",
  className,
}: RatingStarsProps) {
  const dimension = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  const rounded = Math.round(rating);

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={cn(
            dimension,
            star <= rounded
              ? "fill-foreground text-foreground"
              : "fill-none text-foreground/20",
          )}
        />
      ))}
    </div>
  );
}
