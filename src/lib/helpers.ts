/**
 * Formats a number as currency.
 *
 * @example formatCurrency(1999) // "$19.99" when amount is in cents
 */
export function formatCurrency(
  amount: number,
  options: {
    currency?: string;
    locale?: string;
    /** Pass true if `amount` is already a whole-unit value (e.g. 19.99) */
    isWholeUnit?: boolean;
  } = {},
): string {
  const { currency = "USD", locale = "en-US", isWholeUnit = false } = options;
  const value = isWholeUnit ? amount : amount / 100;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Formats a Date (or date string) into a human-readable string.
 *
 * @example formatDate(new Date()) // "June 21, 2026"
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
  locale = "en-US",
): string {
  const dateObj = typeof date === "object" ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Converts a string into a URL-safe slug.
 *
 * @example slugify("Men's Running Shoes!") // "mens-running-shoes"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Truncates a string to a maximum length, appending an ellipsis if cut.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

/**
 * Generates a short, URL-safe, human-readable order number.
 * Not cryptographically significant — for display/reference purposes only.
 *
 * @example generateOrderNumber() // "ORD-9F3K2A"
 */
export function generateOrderNumber(prefix = "ORD"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"; // no ambiguous chars
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${suffix}`;
}

/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Type guard / runtime check used to filter out null/undefined in
 * `.filter()` calls while preserving correct TypeScript narrowing.
 *
 * @example items.filter(isDefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Delays execution for a given number of milliseconds.
 * Useful for retry/backoff logic or artificial loading states in dev.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safely parses JSON, returning a fallback value instead of throwing.
 */
export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Formats bytes into a human-readable string (used for upload limits, etc).
 *
 * @example formatBytes(1536) // "1.5 KB"
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
