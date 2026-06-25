/**
 * Input sanitization utilities.
 *
 * The app does not use `dangerouslySetInnerHTML` anywhere, and React
 * escapes JSX string output by default, so stored XSS from text
 * nodes is already mitigated. These helpers provide defence-in-depth
 * by stripping HTML tags from user-supplied strings before they reach
 * Mongoose, so even a future inadvertent `innerHTML` use in an email
 * template or PDF renderer can't inject scripts.
 *
 * We intentionally avoid a heavy `DOMPurify` dependency (it requires
 * a DOM or JSDOM, which adds 500 KB to the server bundle and breaks
 * the Edge runtime). A lightweight regex strip is sufficient here
 * because we store plain text, not rich HTML — if rich text storage
 * is ever needed, switch to a server-side `sanitize-html` transform
 * at that call site.
 */

/** Strips HTML/XML tags from a string. Leaves plain text intact. */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

/**
 * Strips HTML tags and truncates to `maxLength`. Safe to use on any
 * user-controlled string field before persisting to the database.
 */
export function sanitizeText(
  input: string,
  maxLength?: number,
): string {
  const stripped = stripHtml(input);
  return maxLength !== undefined ? stripped.slice(0, maxLength) : stripped;
}

/**
 * Sanitizes all string-typed own properties of an object in-place
 * (shallow). Returns the mutated object for chaining.
 *
 * Use this on validated Zod output objects before passing to Mongoose
 * — Zod strips unknown keys but doesn't strip HTML from string values.
 *
 * @example
 *   const data = sanitizeObject(parsed.data, {
 *     title:   120,
 *     comment: 2000,
 *   });
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fieldLimits: Partial<Record<keyof T, number>> = {},
): T {
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    if (typeof value === "string") {
      const limit = fieldLimits[key as keyof T] as number | undefined;
      (obj as Record<string, unknown>)[key] = sanitizeText(value, limit);
    }
  }
  return obj;
}

/**
 * Escapes a user-supplied string for safe inclusion in a MongoDB
 * `$regex` value, preventing regex injection attacks where a user
 * inputs `.*` or `(a+)+` to match everything or trigger ReDoS.
 *
 * Usage:
 *   { name: { $regex: escapeRegex(searchTerm), $options: "i" } }
 */
export function escapeRegex(input: string): string {
  // Escape all regex metacharacters
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
