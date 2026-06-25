import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Package } from "lucide-react";

import { adminGetProducts } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminSearch } from "@/components/admin/admin-search";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Button } from "@/components/ui/button";
import type { AdminProductRow } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Products" };

interface AdminProductsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const search = params.q;

  const result = await adminGetProducts(page, search);

  return (
    <div className="p-6 sm:p-10 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-label text-foreground/40">Catalogue</p>
          <h1 className="mt-1 font-display text-4xl italic text-foreground">
            Products
          </h1>
        </div>
        <Button asChild className="rounded-none shrink-0">
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" />
            New Product
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <AdminSearch placeholder="Search products…" />
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {result.total} product{result.total !== 1 ? "s" : ""}
        </span>
      </div>

      <AdminTable<AdminProductRow>
        rows={result.products}
        emptyMessage={
          search
            ? `No products match "${search}".`
            : "No products yet. Create your first product."
        }
        columns={[
          {
            key: "product",
            header: "Product",
            render: (row) => (
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-secondary">
                  {row.imageUrl ? (
                    <Image
                      src={row.imageUrl}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-xs italic text-foreground/20">
                      MN
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground line-clamp-1">
                    {row.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.categoryName}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "price",
            header: "Price",
            render: (row) => (
              <span className="text-foreground">
                {formatCurrency(row.price, { isWholeUnit: true })}
              </span>
            ),
          },
          {
            key: "stock",
            header: "Stock",
            render: (row) => (
              <span
                className={
                  row.totalStock === 0
                    ? "font-medium text-destructive"
                    : "text-foreground"
                }
              >
                {row.totalStock}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <span
                className={`text-label ${
                  row.isActive ? "text-foreground" : "text-foreground/40"
                }`}
              >
                {row.isActive ? "Active" : "Inactive"}
              </span>
            ),
          },
          {
            key: "date",
            header: "Created",
            className: "text-muted-foreground whitespace-nowrap",
            render: (row) => formatDate(row.createdAt),
          },
          {
            key: "actions",
            header: "",
            className: "whitespace-nowrap",
            render: (row) => (
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/products/${row.id}/edit`}
                  className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-label text-foreground/60 hover:border-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
                <Link
                  href={`/admin/products/${row.id}/inventory`}
                  className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-label text-foreground/60 hover:border-foreground hover:text-foreground transition-colors"
                >
                  <Package className="h-3.5 w-3.5" />
                  Inventory
                </Link>
              </div>
            ),
          },
        ]}
      />

      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        basePath="/admin/products"
        currentParams={search ? { q: search } : {}}
      />
    </div>
  );
}
