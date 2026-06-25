import type { Metadata } from "next";

import { adminGetCategories } from "@/lib/data/admin";
import { AdminTable } from "@/components/admin/admin-table";
import type { AdminCategoryRow } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await adminGetCategories();

  return (
    <div className="p-6 sm:p-10 space-y-8">
      <div>
        <p className="text-label text-foreground/40">Catalogue</p>
        <h1 className="mt-1 font-display text-4xl italic text-foreground">Categories</h1>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
        </p>
      </div>

      <AdminTable<AdminCategoryRow>
        rows={categories}
        emptyMessage="No categories found."
        columns={[
          {
            key: "name",
            header: "Name",
            render: (row) => (
              <div>
                <p className="font-medium text-foreground">{row.name}</p>
                {row.parentName && (
                  <p className="text-xs text-muted-foreground">under {row.parentName}</p>
                )}
              </div>
            ),
          },
          {
            key: "slug",
            header: "Slug",
            render: (row) => (
              <code className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5">
                {row.slug}
              </code>
            ),
          },
          {
            key: "products",
            header: "Products",
            render: (row) => (
              <span className="text-foreground">{row.productCount}</span>
            ),
          },
          {
            key: "order",
            header: "Sort",
            render: (row) => (
              <span className="text-muted-foreground">{row.sortOrder}</span>
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
            key: "description",
            header: "Description",
            className: "max-w-xs",
            render: (row) => (
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {row.description ?? "—"}
              </p>
            ),
          },
        ]}
      />
    </div>
  );
}
