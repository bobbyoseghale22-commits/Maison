import { env } from "@/config/env";

/**
 * CSRF protection for Route Handlers.
 *
 * Next.js Server Actions are CSRF-safe by design (they require the
 * `Next-Action` header which browsers cannot set cross-origin).
 * Route Handlers do not have this protection, so state-mutating
 * endpoints (POST/PATCH/DELETE that aren't the Stripe webhook) should
 * call `validateCsrf(request)` before processing the body.
 *
 * Strategy: Origin / Referer header validation.
 *
 * We compare the `Origin` header (sent by all modern browsers on
 * cross-origin requests) against the app's own host. If the origin
 * is absent (curl, server-to-server), we fall back to `Referer`.
 * Requests with neither header are rejected in production.
 *
 * This is the standard same-origin enforcement used by frameworks
 * like Django (CsrfViewMiddleware). Double-submit cookies add nothing
 * for a same-origin SPA with `httpOnly` cookies.
 *
 * The Stripe webhook route is intentionally excluded — it uses its
 * own cryptographic signature for authenticity.
 *
 * Returns `null` on success, or an error string to surface as a 403.
 */
export function validateCsrf(request: Request): string | null {
  // In development, skip CSRF enforcement to allow curl/Postman testing.
  if (env.NODE_ENV !== "production") return null;

  // Skip for GET/HEAD/OPTIONS — these must be idempotent/safe by convention,
  // and browsers don't include CSRF tokens in preflight.
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return null;

  const appUrl = new URL(env.NEXT_PUBLIC_APP_URL);
  const allowedHost = appUrl.host; // e.g. "maisonoir.com" or "localhost:3000"

  // --- Check Origin ---
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    let originHost: string;
    try {
      originHost = new URL(originHeader).host;
    } catch {
      return "Invalid Origin header.";
    }
    if (originHost !== allowedHost) {
      return `Cross-origin request rejected (origin: ${originHost}).`;
    }
    return null; // Origin matches — allowed
  }

  // --- Fallback: Referer ---
  const refererHeader = request.headers.get("referer");
  if (refererHeader) {
    let refererHost: string;
    try {
      refererHost = new URL(refererHeader).host;
    } catch {
      return "Invalid Referer header.";
    }
    if (refererHost !== allowedHost) {
      return `Cross-origin request rejected (referer: ${refererHost}).`;
    }
    return null;
  }

  // No Origin or Referer — reject in production.
  // Server-to-server callers should set a custom auth header instead
  // of relying on cookies; our internal calls all go through Auth.js
  // session tokens anyway.
  return "Missing Origin header. Cross-site request rejected.";
}

/** Convenience: returns a Response if CSRF fails, null otherwise. */
export function csrfGuard(request: Request): Response | null {
  const error = validateCsrf(request);
  if (!error) return null;
  return new Response(JSON.stringify({ error }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
