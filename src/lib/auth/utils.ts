import "server-only";

import { auth } from "@/lib/auth";
import type { UserRole } from "@/models/types";

/**
 * Server-side auth guards, for use in Server Components, Route
 * Handlers, and Server Actions where `middleware.ts`'s path-based
 * matcher doesn't apply — e.g. a Server Action invoked from a client
 * component on a public page still needs its own role check, since
 * middleware only runs against page navigations matching its matcher,
 * not against the action's own request.
 *
 * Throwing (rather than returning null/false) lets these compose with
 * Next.js's error boundaries and keeps call sites a one-liner.
 */

export class UnauthorizedError extends Error {
  constructor(message = "You must be signed in to do this.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do this.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Returns the current session, or `null` if unauthenticated. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Resolves with the current user, or throws `UnauthorizedError`. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/**
 * Resolves with the current user if they hold one of `roles`, or
 * throws `UnauthorizedError` (no session) / `ForbiddenError` (wrong role).
 *
 * @example const admin = await requireRole("admin");
 */
export async function requireRole(roles: UserRole | UserRole[]) {
  const user = await requireUser();
  const allowed = Array.isArray(roles) ? roles : [roles];

  if (!allowed.includes(user.role)) {
    throw new ForbiddenError();
  }

  return user;
}

/** Convenience wrapper around `requireRole("admin")`. */
export async function requireAdmin() {
  return requireRole("admin");
}
