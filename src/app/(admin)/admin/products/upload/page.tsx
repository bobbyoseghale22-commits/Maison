import type { Metadata } from "next";
import { ProductImageUploadForm } from "@/components/admin/product-image-upload-form";

export const metadata: Metadata = { title: "Admin — Upload Product Images" };

/**
 * /admin/products/upload
 *
 * Standalone admin page for uploading product images and previewing
 * the optimised Cloudinary URLs before attaching them to a product.
 * In a full admin CRUD flow this panel would be embedded inside the
 * product edit form; it's exposed as a standalone page here so the
 * Cloudinary integration can be tested and demonstrated independently.
 */
export default function ProductImageUploadPage() {
  return (
    <div className="container py-12">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl italic text-foreground">
          Upload Product Images
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Images are uploaded directly to Cloudinary and served via
          their CDN with automatic format selection (WebP/AVIF) and
          quality optimisation. The first image is used as the primary
          product thumbnail.
        </p>
      </div>
      <div className="mt-10 max-w-2xl">
        <ProductImageUploadForm />
      </div>
    </div>
  );
}
