import { z } from "zod";

/**
 * Review-related Zod schemas, mirroring the field-level constraints
 * already enforced by the `Review` Mongoose schema
 * (`src/models/Review.ts`) so invalid input is rejected at the
 * Server Action boundary with form-friendly field errors, before it
 * ever reaches a Mongoose `ValidationError`.
 */
export const submitReviewSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  rating: z
    .number()
    .int()
    .min(1, "Select a rating")
    .max(5, "Rating must be at most 5"),
  title: z
    .string()
    .trim()
    .max(120, "Title must be at most 120 characters")
    .optional()
    .or(z.literal("")),
  comment: z
    .string()
    .trim()
    .min(10, "Review must be at least 10 characters")
    .max(2000, "Review must be at most 2000 characters"),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
