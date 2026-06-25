import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth/auth.config";
import { authLimiter, extractKey, rateLimitResponse } from "@/lib/security/rate-limit";

const { auth } = NextAuth(authConfig);

/**
 * Next.js middleware — runs on the Edge runtime before any Route
 * Handler or Server Component.
 *
 * Responsibilities (in order):
 *  1. Rate-limit auth-related API paths (login, register, OAuth
 *     callbacks) to prevent brute-force and credential-stuffing.
 *  2. Delegate to Auth.js's `authorized` callback for session-based
 *     route protection (see auth.config.ts).
 *
 * Security headers are applied via `next.config.ts`'s `headers()`
 * config (static, per-path) rather than here (dynamic, per-request)
 * because the static approach is cached at the edge and does not
 * require running middleware on every request.
 */
export default auth(async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Rate-limit auth endpoints ─────────────────────────────────────────
  //
  // The NextAuth route handles login (POST /api/auth/callback/credentials),
  // registration is at /api/auth/register (Server Action proxied via the
  // registerUser action), and OAuth flows go through /api/auth/[...nextauth].
  //
  // We apply a shared IP-based limit to all /api/auth/* paths so an
  // attacker can't enumerate usernames or brute-force passwords.
  const isAuthApi =
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/auth";

  if (isAuthApi && request.method === "POST") {
    const key = extractKey(request, "ip", "auth");
    const result = authLimiter.check(key);
    if (!result.success) {
      return rateLimitResponse(result) as NextResponse;
    }
  }

  // ── 2. Auth.js route protection ───────────────────────────────────────────
  // The `auth` wrapper handles this — see authConfig.callbacks.authorized.
  return NextResponse.next();
});

export const config = {
  // Match all routes except static assets and Next.js internals.
  // Rate-limiting and auth checks are cheap on cache hits but we still
  // skip the paths that never need them to minimise cold-path overhead.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
