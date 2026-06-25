import type { NextAuthConfig } from "next-auth";

/**
 * Auth.js v5 shared configuration.
 *
 * This file stays edge-compatible (no Mongoose/bcrypt/Node-only
 * imports) so it can be reused directly in `middleware.ts`, which runs
 * on the Edge runtime. Providers that need Node APIs (Credentials,
 * with its Mongoose + bcrypt `authorize()`) are added on top of this
 * config in `src/lib/auth/index.ts`, which is never imported from
 * middleware.
 *
 * Route protection lives in the `authorized` callback below rather
 * than in middleware itself, since `authorized` is what `NextAuth()`'s
 * generated middleware function actually consults on every matched
 * request.
 */

/** Path prefixes that require an authenticated session. */
const PROTECTED_PREFIXES = ["/account", "/orders", "/admin"];

/** Path prefixes that require the "admin" role specifically. */
const ADMIN_PREFIXES = ["/admin"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    /**
     * Runs on every request matched by `middleware.ts`'s `config.matcher`.
     * Returning `false` redirects unauthenticated users to `pages.signIn`;
     * returning a `Response` (e.g. a redirect) is also supported and is
     * used here to send authenticated non-admins away from `/admin/*`
     * instead of bouncing them to the login page.
     */
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(auth?.user);
      const role = auth?.user?.role;

      if (matchesPrefix(pathname, ADMIN_PREFIXES)) {
        if (!isLoggedIn) return false;
        if (role !== "admin") {
          return Response.redirect(new URL("/", request.nextUrl.origin));
        }
        return true;
      }

      if (matchesPrefix(pathname, PROTECTED_PREFIXES)) {
        return isLoggedIn;
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;

export default authConfig;
