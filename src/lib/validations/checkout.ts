import { z } from "zod";

/**
 * Checkout-related Zod schemas. Following the same pattern as
 * auth.ts / cart.ts / review.ts — validate at the API boundary so
 * malformed data never reaches Mongoose.
 *
 * `addressSchema` mirrors the `Address` interface in
 * `src/models/types.ts` field-for-field so the validated shape maps
 * directly onto the Order sub-document without translation.
 */

export const addressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters"),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(/^[+\d\s\-().]+$/, "Invalid phone number"),
  line1: z
    .string()
    .trim()
    .min(3, "Address line 1 is required")
    .max(200, "Address line 1 is too long"),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z
    .string()
    .trim()
    .min(1, "City is required")
    .max(100, "City is too long"),
  state: z
    .string()
    .trim()
    .min(1, "State / Province is required")
    .max(100, "State is too long"),
  postalCode: z
    .string()
    .trim()
    .min(2, "Postal code is required")
    .max(20, "Postal code is too long"),
  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .max(100, "Country is too long"),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const couponCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Coupon code must be at least 3 characters")
    .max(32, "Coupon code must be at most 32 characters"),
});

export type CouponCodeInput = z.infer<typeof couponCodeSchema>;

/**
 * Full checkout submission payload. `guestEmail` is required when the
 * request comes from an unauthenticated visitor so they can receive
 * an order confirmation; it's ignored (and safely discarded) when the
 * order is for an authenticated user.
 */
export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  /** Same as shipping when "Bill to same address" is checked. */
  billingAddress: addressSchema,
  /** Required for guest checkout; optional (ignored) for signed-in users. */
  guestEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("A valid email is required for guest checkout")
    .optional()
    .or(z.literal("")),
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .max(32)
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
