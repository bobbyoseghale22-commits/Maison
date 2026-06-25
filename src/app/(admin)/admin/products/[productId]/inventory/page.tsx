import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { adminGetProduct } from "@/lib/data/admin-products";
import { InventoryTable } from "@/components/admin/inventory-table";

interface InventoryPageProps {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: InventoryPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await adminGetProduct(productId);
  return { title: product ? `Inventory: ${product.name}` : "Not Found" };
}

export default async function AdminInventoryPage({ params }: InventoryPageProps) {
  const { productId } = await params;
  const product = await adminGetProduct(productId);
  if (!product) notFound();

  return (
    <div className="p-6 sm:p-10 max-w-3xl">
      <Link
        href={`/admin/products/${productId}/edit`}
        className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Edit Product
      </Link>

      <div className="mt-6">
        <p className="text-label text-foreground/40">Inventory</p>
        <h1 className="mt-1 font-display text-4xl italic text-foreground">
          {product.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Click any stock number to edit it inline. Each change is saved
          immediately.
        </p>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {product.variants.length} variant
            {product.variants.length !== 1 ? "s" : ""} ·{" "}
            <span
              className={
                product.totalStock === 0
                  ? "text-destructive font-medium"
                  : "text-foreground font-medium"
              }
            >
              {product.totalStock} total in stock
            </span>
          </p>
        </div>
        <InventoryTable product={product} />
      </div>
    </div>
  );
}
