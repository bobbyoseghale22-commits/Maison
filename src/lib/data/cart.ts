import "server-only";

import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Cart, Product } from "@/models";
import { getCurrentUser } from "@/lib/auth/utils";
import {
  getOrCreateGuestId,
  readGuestId,
  clearGuestId,
} from "@/lib/cart/guest-id";
import type { ProductSize } from "@/models/types";

export interface CartLineItem {
  itemId: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  size: ProductSize;
  color: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  priceChanged: boolean;
  currentPrice: number;
  maxQuantity: number;
}

export interface CartView {
  cartId: string;
  isGuest: boolean;
  items: CartLineItem[];
  itemCount: number;
  subtotal: number;
}

type CartOwner =
  | { kind: "user"; userId: string }
  | { kind: "guest"; guestId: string }
  | { kind: "none" };

type CartOwnerRequired =
  | { kind: "user"; userId: string }
  | { kind: "guest"; guestId: string };

async function resolveOwner(): Promise<CartOwner> {
  const user = await getCurrentUser();
  if (user) return { kind: "user", userId: user.id };
  const guestId = await readGuestId();
  if (guestId) return { kind: "guest", guestId };
  return { kind: "none" };
}

async function resolveOrCreateOwner(): Promise<CartOwnerRequired> {
  const user = await getCurrentUser();
  if (user) return { kind: "user", userId: user.id };
  const guestId = await getOrCreateGuestId();
  return { kind: "guest", guestId };
}

function ownerFilter(owner: CartOwner | CartOwnerRequired) {
  if (owner.kind === "user") return { user: owner.userId };
  if (owner.kind === "guest") return { guestId: owner.guestId };
  return null;
}

interface LeanPopulatedCart {
  _id: { toString(): string };
  guestId?: string | null;
  items: Array<{
    _id: { toString(): string };
    product: {
      _id: { toString(): string };
      slug: string;
      name: string;
      price: number;
      images: Array<{ url: string }>;
      variants: Array<{ sku: string; stock: number; priceOverride?: number }>;
    };
    sku: string;
    size: ProductSize;
    color: string;
    quantity: number;
    priceAtAdd: number;
  }>;
}

function toView(doc: LeanPopulatedCart): CartView {
  const lines: CartLineItem[] = doc.items.map((item) => {
    const p = item.product;
    const variant = p.variants.find((v) => v.sku === item.sku);
    const currentPrice = variant?.priceOverride ?? p.price;
    const stock = variant?.stock ?? 0;
    return {
      itemId: item._id.toString(),
      productId: p._id.toString(),
      slug: p.slug,
      name: p.name,
      image: p.images[0]?.url ?? null,
      size: item.size,
      color: item.color,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.priceAtAdd,
      lineTotal: item.priceAtAdd * item.quantity,
      priceChanged: Math.abs(currentPrice - item.priceAtAdd) > 0.005,
      currentPrice,
      maxQuantity: Math.min(stock, 10),
    };
  });
  return {
    cartId: doc._id.toString(),
    isGuest: Boolean(doc.guestId),
    items: lines,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: lines.reduce((n, l) => n + l.lineTotal, 0),
  };
}

const POPULATE = {
  path: "items.product",
  select: "slug name price images variants",
};

async function populatedView(cartId: unknown): Promise<CartView> {
  const doc = await Cart.findById(cartId).populate(POPULATE).lean();
  return toView(doc as unknown as LeanPopulatedCart);
}

export async function getCart(): Promise<CartView | null> {
  await connectToDatabase();
  const owner = await resolveOwner();
  if (owner.kind === "none") return null;
  const filter = ownerFilter(owner);
  if (!filter) return null;
  const doc = await Cart.findOne(filter).populate(POPULATE).lean();
  if (!doc) return null;
  return toView(doc as unknown as LeanPopulatedCart);
}

export async function addItemToCart(input: {
  productId: string;
  size: ProductSize;
  color: string;
  quantity: number;
}): Promise<CartView> {
  const { productId, size, color, quantity } = input;
  await connectToDatabase();

  const product = await Product.findOne({ _id: productId, isActive: true })
    .select("price variants")
    .lean();
  if (!product) throw new Error("Product not found or unavailable.");

  const variant = product.variants.find(
    (v) => v.size === size && v.color === color,
  );
  if (!variant) throw new Error("That size/colour is unavailable.");

  const owner = await resolveOrCreateOwner();
  const filter = ownerFilter(owner) as unknown as Record<string, string>;

  let cart = await Cart.findOne(filter);
  const existing = cart?.items.find((i) => i.sku === variant.sku);
  const newQty = (existing?.quantity ?? 0) + quantity;

  if (newQty > variant.stock) {
    const room = variant.stock - (existing?.quantity ?? 0);
    throw new Error(
      room > 0
        ? `Only ${room} more available in that size/colour.`
        : "Out of stock in that size/colour.",
    );
  }

  if (!cart) {
    cart = new Cart({ ...filter, items: [] });
  }

  if (existing) {
    existing.quantity = newQty;
  } else {
    cart.items.push({
      product: new Types.ObjectId(productId),
      sku: variant.sku,
      size,
      color,
      quantity,
      priceAtAdd: variant.priceOverride ?? product.price,
    });
  }

  await cart.save();
  return populatedView(cart._id);
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
): Promise<CartView> {
  await connectToDatabase();
  const owner = await resolveOwner();
  if (owner.kind === "none") throw new Error("No active cart.");

  const cart = await Cart.findOne(ownerFilter(owner) ?? undefined);
  if (!cart) throw new Error("Cart not found.");

  const item = (cart.items as unknown as { id(id: string): typeof cart.items[0] | null }).id(itemId);
  if (!item) throw new RangeError("Item not in cart.");

  const product = await Product.findById(item.product)
    .select("variants")
    .lean();
  const maxStock =
    product?.variants.find((v) => v.sku === item.sku)?.stock ?? 0;

  item.quantity = Math.min(Math.max(1, quantity), Math.min(maxStock, 10));
  await cart.save();
  return populatedView(cart._id);
}

export async function removeCartItem(itemId: string): Promise<CartView> {
  await connectToDatabase();
  const owner = await resolveOwner();
  if (owner.kind === "none") throw new Error("No active cart.");

  const cart = await Cart.findOne(ownerFilter(owner) ?? undefined);
  if (!cart) throw new Error("Cart not found.");

  const item = (cart.items as unknown as { id(id: string): typeof cart.items[0] | null }).id(itemId);
  if (!item) throw new RangeError("Item not in cart.");

  item.deleteOne();
  await cart.save();
  return populatedView(cart._id);
}

export async function mergeGuestCartIntoUserCart(userId: string): Promise<void> {
  await connectToDatabase();
  const guestId = await readGuestId();
  if (!guestId) return;

  const guestCart = await Cart.findOne({ guestId });
  if (!guestCart || guestCart.items.length === 0) {
    await clearGuestId();
    return;
  }

  let userCart = await Cart.findOne({ user: userId });
  if (!userCart) {
    userCart = new Cart({ user: userId, items: [] });
  }

  for (const gi of guestCart.items) {
    const existing = userCart.items.find((i) => i.sku === gi.sku);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + gi.quantity, 10);
    } else {
      userCart.items.push({
        product: gi.product,
        sku: gi.sku,
        size: gi.size,
        color: gi.color,
        quantity: gi.quantity,
        priceAtAdd: gi.priceAtAdd,
      });
    }
  }

  await userCart.save();
  await Cart.deleteOne({ _id: guestCart._id });
  await clearGuestId();
}
