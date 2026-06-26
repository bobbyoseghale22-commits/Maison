import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/models/types";

const PROTECTED_PREFIXES = ["/account", "/orders", "/admin"];
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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user.role as UserRole) ?? "customer";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
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
