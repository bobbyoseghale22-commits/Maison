import type { DefaultSession, DefaultUser } from "next-auth";
import type { UserRole } from "@/models/types";

/**
 * Module augmentation for Auth.js v5.
 * Adds `id` and `role` to the session user, JWT, and the User shape
 * returned by providers (notably the Credentials provider's
 * `authorize()`), so they're typed end-to-end instead of requiring
 * `as` casts at every call site.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export {};
