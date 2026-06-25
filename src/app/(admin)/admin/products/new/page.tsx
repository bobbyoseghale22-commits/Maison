import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { adminGetCategories } from "@/lib/data/admin";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New Product" };

export default async function AdminNewProductPage() {
  const categories = await adminGetCategories();

  return (
    <div className="p-6 sm:p-10 max-w-4xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>

      <div className="mt-6">
        <p className="text-label text-foreground/40">Products</p>
        <h1 className="mt-1 font-display text-4xl italic text-foreground">
          New Product
        </h1>
      </div>

      <div className="mt-10">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
