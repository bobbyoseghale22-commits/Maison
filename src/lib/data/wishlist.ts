import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import { Wishlist, Product } from "@/models";
import { requireUser } from "@/lib/auth/utils";
import type { ProductSize } from "@/models/types";

/**
 * Wishlist view-model — flat, serialisable shape exposed to the API
 * and the useWishlist hook. Mirrors the CartView pattern in
 * src/lib/data/cart.ts so the hook and UI components follow the same
 * conventions as the cart.
 */
export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  brand?: string;
  image: string | null;
  price: number;
  compareAtPrice?: number;
  addedAt: string; // ISO string — safe to serialise across the API boundary
  /** Available sizes across all active variants, for the move-to-cart picker. */
  sizes: ProductSize[];
  /** Available colors across all active variants, for the move-to-cart picker. */
  colors: { name: string; hex?: string }[];
  inStock: boolean;
}

export interface WishlistView {
  items: WishlistItem[];
  itemCount: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface LeanPopulatedWishlist {
  _id: unknown;
  items: Array<{
    product: {
      _id: { toString(): string };
      slug: string;
      name: string;
      brand?: string;
      price: number;
      compareAtPrice?: number;
      images: Array<{ url: string }>;
      variants: Array<{
        size: ProductSize;
        color: string;
        colorHex?: string;
        stock: number;
        priceOverride?: number;
      }>;
      isActive: boolean;
    } | null;
    addedAt: Date;
  }>;
}

const POPULATE = {
  path: "items.product",
  select: "slug name brand price compareAtPrice images variants isActive",
};

function toView(doc: LeanPopulatedWishlist): WishlistView {
  const items: WishlistItem[] = [];

  for (const item of doc.items) {
    // Skip items whose product has been deleted or deactivated.
    if (!item.product || !item.product.isActive) continue;

    const p = item.product;
    const activeVariants = p.variants.filter((v) => v.stock > 0);

    const sizeSet = new Set<ProductSize>();
    const colorMap = new Map<string, string | undefined>();

    for (const v of activeVariants) {
      sizeSet.add(v.size);
      if (!colorMap.has(v.color)) colorMap.set(v.color, v.colorHex);
    }

    items.push({
      productId: p._id.toString(),
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      image: p.images[0]?.url ?? null,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      addedAt: item.addedAt.toISOString(),
      sizes: [...sizeSet],
      colors: [...colorMap.entries()].map(([name, hex]) => ({ name, hex })),
      inStock: activeVariants.length > 0,
    });
  }

  return { items, itemCount: items.length };
}

// ---------------------------------------------------------------------------
// Public API — consumed by Route Handlers
// ---------------------------------------------------------------------------

/** Returns the authenticated user's wishlist. Throws if not signed in. */
export async function getWishlist(): Promise<WishlistView> {
  const user = await requireUser();
  await connectToDatabase();

  const doc = await Wishlist.findOne({ user: user.id })
    .populate(POPULATE)
    .lean();

  if (!doc) return { items: [], itemCount: 0 };
  return toView(doc as unknown as LeanPopulatedWishlist);
}

/** Adds a product to the wishlist (idempotent — safe to call when already present). */
export async function addToWishlist(productId: string): Promise<WishlistView> {
  const user = await requireUser();
  await connectToDatabase();

  const product = await Product.findOne({ _id: productId, isActive: true })
    .select("_id")
    .lean();
  if (!product) throw new Error("Product not found or unavailable.");

  let wishlist = await Wishlist.findOne({ user: user.id });
  if (!wishlist) {
    wishlist = new Wishlist({ user: user.id, items: [] });
  }

  const alreadyIn = wishlist.items.some(
    (i) => i.product.toString() === productId,
  );

  if (!alreadyIn) {
    wishlist.items.push({ product: productId, addedAt: new Date() });
    await wishlist.save();
  }

  const populated = await Wishlist.findById(wishlist._id)
    .populate(POPULATE)
    .lean();
  return toView(populated as unknown as LeanPopulatedWishlist);
}

/** Removes a product from the wishlist (idempotent). */
export async function removeFromWishlist(
  productId: string,
): Promise<WishlistView> {
  const user = await requireUser();
  await connectToDatabase();

  const wishlist = await Wishlist.findOne({ user: user.id });
  if (!wishlist) return { items: [], itemCount: 0 };

  const before = wishlist.items.length;
  wishlist.items = wishlist.items.filter(
    (i) => i.product.toString() !== productId,
  );

  if (wishlist.items.length !== before) {
    await wishlist.save();
  }

  const populated = await Wishlist.findById(wishlist._id)
    .populate(POPULATE)
    .lean();
  return toView(populated as unknown as LeanPopulatedWishlist);
}
