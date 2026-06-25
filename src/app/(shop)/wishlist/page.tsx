import type { Metadata } from "next";
import { WishlistPageContent } from "@/components/wishlist/wishlist-page-content";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Your saved Maison Noir pieces.",
};

/**
 * /wishlist — dedicated wishlist page. Server Component shell;
 * content is a Client Component so it can share the WishlistContext
 * already loaded by the header's WishlistSheet.
 */
export default function WishlistPage() {
  return (
    <div className="container py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-label text-foreground/40">Account</p>
        <h1 className="mt-2 font-display text-4xl italic text-foreground sm:text-5xl">
          Wishlist
        </h1>
      </div>
      <div className="mt-10">
        <WishlistPageContent />
      </div>
    </div>
  );
}
