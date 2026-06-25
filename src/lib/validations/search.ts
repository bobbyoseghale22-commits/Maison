import { z } from "zod";

/**
 * Search suggestions query schema. Deliberately permissive on length
 * (min 1) compared to `shopQuerySchema.q` — suggestions should start
 * appearing as soon as the customer types a single character, while
 * the full search results page can reasonably require more before
 * treating a query as meaningful.
 */
export const searchSuggestionsQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
});

export type SearchSuggestionsQuery = z.infer<
  typeof searchSuggestionsQuerySchema
>;
