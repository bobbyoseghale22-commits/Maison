import { z } from "zod";
import { PRODUCT_SIZES } from "@/models/types";

/**
 * Admin product schemas — separate from `product.ts` (which handles
 * shop query params) because the shapes are completely different.
 * These mirror `IProduct` field-for-field so the validated output
 * maps directly onto the Mongoose document without translation.
 */

export const productImageSchema = z.object({
  url: z.string().trim().url("Image URL must be a valid URL"),
  publicId: z.string().trim().min(1, "Cloudinary public ID is required"),
  alt: z.string().trim().max(200).optional().or(z.literal("")),
});

export const productVariantSchema = z.object({
  /** _id from Mongoose — present on edit, absent on new variants. */
  _id: z.string().optional(),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "SKU must be at least 2 characters")
    .max(50, "SKU must be at most 50 characters")
    .regex(/^[A-Z0-9_-]+$/, "SKU may only contain letters, numbers, hyphens, and underscores"),
  size: z.enum(PRODUCT_SIZES, {
    errorMap: () => ({ message: "Select a valid size" }),
  }),
  color: z.string().trim().min(1, "Color is required").max(50),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex colour e.g. #1F2937")
    .optional()
    .or(z.literal("")),
  stock: z.coerce
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  priceOverride: z.coerce
    .number()
    .min(0, "Price cannot be negative")
    .optional()
    .or(z.literal(0))
    .transform((v) => (v === 0 || v === undefined ? undefined : v)),
});

export type ProductVariantInput = z.infer<typeof productVariantSchema>;

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be at most 200 characters"),
  /** Auto-generated from name on create, editable on update. */
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug must be at least 2 characters")
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase, alphanumeric, and hyphen-separated",
    ),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be at most 5000 characters"),
  brand: z.string().trim().max(100).optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  price: z.coerce
    .number()
    .min(0.01, "Price must be greater than 0"),
  compareAtPrice: z.coerce
    .number()
    .min(0)
    .optional()
    .or(z.literal(0))
    .transform((v) => (v === 0 || v === undefined ? undefined : v)),
  tags: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) =>
      v ? v.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
    ),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  images: z
    .array(productImageSchema)
    .min(1, "At least one image is required"),
  variants: z
    .array(productVariantSchema)
    .min(1, "At least one variant is required"),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

/** Inventory-only patch: update a single variant's stock level. */
export const inventoryPatchSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  stock: z.coerce
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
});

export type InventoryPatchInput = z.infer<typeof inventoryPatchSchema>;
