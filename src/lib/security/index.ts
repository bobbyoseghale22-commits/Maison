/**
 * Security utilities barrel.
 *
 * Import from "@/lib/security" rather than the individual files so
 * adding a new utility doesn't require updating every call site.
 */
export {
  createRateLimiter,
  extractKey,
  rateLimitResponse,
  authLimiter,
  checkoutLimiter,
  cartLimiter,
  reviewLimiter,
  couponLimiter,
  type RateLimitConfig,
  type RateLimitResult,
} from "./rate-limit";

export { validateCsrf, csrfGuard } from "./csrf";

export {
  stripHtml,
  sanitizeText,
  sanitizeObject,
  escapeRegex,
} from "./sanitize";

export { handleApiError, AppError } from "./errors";
