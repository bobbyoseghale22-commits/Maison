import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "@/lib/auth/auth.config";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import type { UserRole } from "@/models/types";
import { loginSchema } from "@/lib/validations/auth";
import { env } from "@/config/env";

/**
 * Main Auth.js v5 instance.
 *
 * Layered on top of the edge-safe `authConfig`: providers and
 * callbacks here are allowed to use Node-only APIs (Mongoose, bcrypt)
 * because this file is imported only from the API route handler and
 * server code — never from `middleware.ts`, which imports
 * `authConfig` directly instead.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        await connectToDatabase();

        // `password` is `select: false` on the schema, so it must be
        // explicitly requested here.
        const user = await User.findOne({ email })
          .select("+password")
          .lean();

        if (!user || !user.password || !user.isActive) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image ?? null,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    /**
     * Persists `id` and `role` onto the JWT. `user` is only defined on
     * sign-in (Credentials returns it from `authorize()`; OAuth
     * providers populate it from the provider profile merged with our
     * `signIn` callback below), so subsequent requests reuse the
     * values already on the token instead of re-querying the DB on
     * every request.
     */
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user.role as UserRole) ?? "customer";
      }

      // Allows client-side `update()` calls (e.g. after a role change)
      // to refresh the token without a full re-login.
      if (trigger === "update" && session?.user?.role) {
        token.role = session.user.role;
      }

      return token;
    },

    /** Exposes `id` and `role` on `session.user` for use in Server/Client Components. */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as import("@/models/types").UserRole;
      }
      return session;
    },

    /**
     * For OAuth sign-ins (Google), ensures a corresponding User
     * document exists in MongoDB — Auth.js's JWT strategy does not
     * persist users on its own without a database adapter, so this
     * upserts on first sign-in and keeps `role`/`isActive` authoritative
     * in Mongo from then on.
     */
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      await connectToDatabase();

      const existing = await User.findOne({ email: user.email });

      if (!existing) {
        const created = await User.create({
          name: user.name ?? "Google User",
          email: user.email,
          image: user.image ?? undefined,
          emailVerified: new Date(),
          role: "customer",
        });
        user.id = created._id.toString();
        user.role = created.role;
        return true;
      }

      if (!existing.isActive) return false;

      user.id = existing._id.toString();
      user.role = existing.role;
      return true;
    },
  },
});
