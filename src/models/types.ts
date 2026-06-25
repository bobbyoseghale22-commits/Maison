import type { Types } from "mongoose";

/**
 * Shared enums, ObjectId aliases, and sub-document shapes used across
 * multiple models. Centralized here so e.g. `OrderStatus` is defined
 * once and imported by both the Order model and any future order
 * business logic, instead of drifting between files.
 */

/** Convenience alias — Mongoose ObjectId as used in document shapes. */
export type ObjectId = Types.ObjectId;

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export const USER_ROLES = ["customer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Postal address shared by User (saved addresses) and Order (shipping/billing). */
export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

/** Standard men's apparel sizing used across all product variants. */
export const PRODUCT_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
] as const;
export type ProductSize = (typeof PRODUCT_SIZES)[number];

/** A single purchasable size/color combination with its own stock and SKU. */
export interface ProductVariant {
  sku: string;
  size: ProductSize;
  color: string;
  /** Hex color swatch shown in the UI, e.g. "#1F2937". */
  colorHex?: string;
  stock: number;
  /** Optional per-variant price override; falls back to Product.price. */
  priceOverride?: number;
}

export interface ProductImage {
  url: string;
  /** Cloudinary public_id, used for deletion/transformation. */
  publicId: string;
  alt?: string;
}

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "unpaid",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Snapshot of a purchased line item — decoupled from live Product data
 * so historical orders remain accurate even if the product is later
 * edited, repriced, or deleted. */
export interface OrderItem {
  product: ObjectId;
  name: string;
  image: string;
  sku: string;
  size: ProductSize;
  color: string;
  unitPrice: number;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Coupon
// ---------------------------------------------------------------------------

export const COUPON_TYPES = ["percentage", "fixed"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export interface CartItem {
  product: ObjectId;
  sku: string;
  size: ProductSize;
  color: string;
  quantity: number;
  /** Price at time of adding, used to detect price changes at checkout. */
  priceAtAdd: number;
}
