import "server-only";

import { cookies } from "next/headers";
import { nanoid } from "nanoid";

const GUEST_ID_COOKIE = "mn_guest_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Returns the guest ID from the request cookie jar, creating and
 * setting a new one if absent. The cookie is `httpOnly` so client-
 * side JS cannot read or spoof it — the guest ID is only trustworthy
 * because the server owns it, not because it came from the browser's
 * JS environment.
 *
 * Must only be called from Server Components, Server Actions, or
 * Route Handlers (hence `import "server-only"`).
 */
export async function getOrCreateGuestId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(GUEST_ID_COOKIE)?.value;

  if (existing && existing.length > 0) {
    return existing;
  }

  const id = nanoid(32);

  jar.set(GUEST_ID_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return id;
}

/** Reads the guest ID cookie without creating one — returns `null`
 * if no guest session exists yet (e.g. a brand-new visitor who
 * hasn't touched the cart). Used in read-only contexts (GET /api/cart)
 * where creating a cookie as a side-effect would be wrong. */
export async function readGuestId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(GUEST_ID_COOKIE)?.value ?? null;
}

/** Clears the guest cookie after a successful login-and-merge so the
 * merged guest cart is never accidentally re-looked-up. */
export async function clearGuestId(): Promise<void> {
  const jar = await cookies();
  jar.delete(GUEST_ID_COOKIE);
}

export { GUEST_ID_COOKIE };
