import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models";
import { deleteProductImage } from "@/lib/cloudinary/upload";
import { requireAdmin } from "@/lib/auth/utils";
import { slugify } from "@/lib/helpers";
import type { ProductFormInput, InventoryPatchInput } from "@/lib/validations/product-admin";
import type { ProductVariant, ProductImage } from "@/models/types";

/**
 * Full product detail for the edit form — includes all fields the
 * form needs. Distinct from `lib/data/product-detail.ts` (which is
 * the storefront-facing data layer) and `lib/data/admin.ts`
 * (which returns the row-shaped `AdminProductRow` for the table).
 */
export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  category: string; // ObjectId string
  price: number;
  compareAtPrice?: number;
  images: ProductImage[];
  variants: Array<ProductVariant & { id: string }>;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  totalStock: number;
}

export async function adminGetProduct(
  productId: string,
): Promise<AdminProductDetail | null> {
  await requireAdmin();
  await connectToDatabase();

  const doc = await Product.findById(productId).lean();
  if (!doc) return null;

  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    brand: doc.brand ?? "",
    category: doc.category.toString(),
    price: doc.price,
    compareAtPrice: doc.compareAtPrice,
    images: doc.images,
    variants: doc.variants.map((v) => {
      const variant = v as typeof v & { _id?: { toString(): string } };
      return {
        id: variant._id?.toString() ?? "",
        sku: v.sku,
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        stock: v.stock,
        priceOverride: v.priceOverride,
      };
    }),
    tags: doc.tags,
    isActive: doc.isActive,
    isFeatured: doc.isFeatured,
    totalStock: doc.totalStock,
  };
}

/**
 * Creates a new product. Slug uniqueness is guaranteed by the Mongo
 * unique index — on collision we append a short suffix and retry once.
 */
export async function adminCreateProduct(
  input: ProductFormInput,
): Promise<{ id: string; slug: string }> {
  await requireAdmin();
  await connectToDatabase();

  const baseSlug = input.slug || slugify(input.name);

  // Ensure slug uniqueness
  let slug = baseSlug;
  const existing = await Product.findOne({ slug }).select("_id").lean();
  if (existing) {
    slug = `${baseSlug}-${Date.now().toString(36)}`;
  }

  const product = await Product.create({
    name: input.name,
    slug,
    description: input.description,
    brand: input.brand || undefined,
    category: input.category,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    images: input.images,
    variants: input.variants.map((v) => ({
      sku: v.sku,
      size: v.size,
      color: v.color,
      colorHex: v.colorHex || undefined,
      stock: v.stock,
      priceOverride: v.priceOverride,
    })),
    tags: Array.isArray(input.tags) ? input.tags : [],
    isActive: input.isActive,
    isFeatured: input.isFeatured,
  });

  return { id: (product._id as { toString(): string }).toString(), slug: product.slug };
}

/**
 * Updates an existing product. Images removed from the payload are
 * deleted from Cloudinary so orphaned assets don't accumulate.
 */
export async function adminUpdateProduct(
  productId: string,
  input: ProductFormInput,
): Promise<void> {
  await requireAdmin();
  await connectToDatabase();

  const existing = await Product.findById(productId);
  if (!existing) throw new Error("Product not found.");

  // Delete Cloudinary images that were removed from the form
  const incomingPublicIds = new Set(input.images.map((img) => img.publicId));
  const removedImages = existing.images.filter(
    (img) => !incomingPublicIds.has(img.publicId),
  );
  await Promise.all(
    removedImages.map((img) => deleteProductImage(img.publicId)),
  );

  existing.name = input.name;
  existing.slug = input.slug;
  existing.description = input.description;
  existing.brand = input.brand || undefined;
  existing.category = input.category as unknown as typeof existing.category;
  existing.price = input.price;
  existing.compareAtPrice = input.compareAtPrice;
  existing.images = input.images as typeof existing.images;
  existing.variants = input.variants.map((v) => ({
    sku: v.sku,
    size: v.size,
    color: v.color,
    colorHex: v.colorHex || undefined,
    stock: v.stock,
    priceOverride: v.priceOverride,
  })) as typeof existing.variants;
  existing.tags = Array.isArray(input.tags) ? input.tags : [];
  existing.isActive = input.isActive;
  existing.isFeatured = input.isFeatured;

  await existing.save(); // triggers the totalStock pre-save hook
}

/**
 * Deletes a product and all its Cloudinary images. Safe to call
 * even if the product is already gone (findById returns null → no-op).
 */
export async function adminDeleteProduct(productId: string): Promise<void> {
  await requireAdmin();
  await connectToDatabase();

  const product = await Product.findById(productId);
  if (!product) return;

  await Promise.all(
    product.images.map((img) => deleteProductImage(img.publicId)),
  );

  await Product.deleteOne({ _id: productId });
}

/**
 * Updates a single variant's stock level. Used by the inventory
 * management page for quick inline edits without touching anything else.
 */
export async function adminUpdateVariantStock(
  productId: string,
  input: InventoryPatchInput,
): Promise<void> {
  await requireAdmin();
  await connectToDatabase();

  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found.");

  // product.variants is a Mongoose DocumentArray at runtime; cast to access .id()
  const variants = product.variants as unknown as { id(id: string): { stock: number } | null };
  const variant = variants.id(input.variantId);
  if (!variant) throw new RangeError("Variant not found.");

  variant.stock = input.stock;
  await product.save(); // triggers totalStock sync
}
