import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { SignOutButton } from "@/components/layout/sign-out-button";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="container py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-label text-foreground/40">Welcome back</p>
        <h1 className="mt-2 font-display text-4xl italic text-foreground sm:text-5xl">
          {user.name ?? "My Account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="mt-10 max-w-sm space-y-3">
        <Link
          href="/orders"
          className="flex items-center justify-between border border-border px-5 py-4 hover:bg-muted transition-colors"
        >
          <span className="text-sm font-medium">My Orders</span>
          <span className="text-muted-foreground">→</span>
        </Link>

        <Link
          href="/wishlist"
          className="flex items-center justify-between border border-border px-5 py-4 hover:bg-muted transition-colors"
        >
          <span className="text-sm font-medium">My Wishlist</span>
          <span className="text-muted-foreground">→</span>
        </Link>

        <SignOutButton />
      </div>
    </div>
  );
}
