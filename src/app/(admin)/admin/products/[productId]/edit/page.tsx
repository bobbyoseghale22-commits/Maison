import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";

import { adminGetProduct } from "@/lib/data/admin-products";
import { adminGetCategories } from "@/lib/data/admin";
import { ProductForm } from "@/components/admin/product-form";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

interface EditPageProps {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: EditPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await adminGetProduct(productId);
  return { title: product ? `Edit: ${product.name}` : "Product Not Found" };
}

export default async function AdminEditProductPage({ params }: EditPageProps) {
  const { productId } = await params;

  const [product, categories] = await Promise.all([
    adminGetProduct(productId),
    adminGetCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="p-6 sm:p-10 max-w-4xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-label text-foreground/40">Edit Product</p>
          <h1 className="mt-1 font-display text-4xl italic text-foreground">
            {product.name}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/admin/products/${productId}/inventory`}
            className="text-label flex items-center gap-1.5 border border-border px-4 py-2 text-foreground/60 hover:border-foreground hover:text-foreground transition-colors"
          >
            <Package className="h-4 w-4" />
            Inventory
          </Link>
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            className="text-label flex items-center gap-1.5 border border-border px-4 py-2 text-foreground/60 hover:border-foreground hover:text-foreground transition-colors"
          >
            View Live ↗
          </Link>
          <DeleteProductButton productId={productId} productName={product.name} />
        </div>
      </div>

      <div className="mt-10">
        <ProductForm product={product} categories={categories} />
      </div>
    </div>
  );
}
