import type { Metadata } from "next";

import { adminGetCustomers } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminSearch } from "@/components/admin/admin-search";
import { AdminPagination } from "@/components/admin/admin-pagination";
import type { AdminCustomerRow } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Customers" };

interface AdminCustomersPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const search = params.q;

  const result = await adminGetCustomers(page, search);

  return (
    <div className="p-6 sm:p-10 space-y-8">
      <div>
        <p className="text-label text-foreground/40">Management</p>
        <h1 className="mt-1 font-display text-4xl italic text-foreground">Customers</h1>
      </div>

      <div className="flex items-center justify-between gap-4">
        <AdminSearch placeholder="Search by name or email…" />
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {result.total} customer{result.total !== 1 ? "s" : ""}
        </span>
      </div>

      <AdminTable<AdminCustomerRow>
        rows={result.customers}
        emptyMessage="No customers found."
        columns={[
          {
            key: "customer",
            header: "Customer",
            render: (row) => (
              <div>
                <p className="font-medium text-foreground">{row.name}</p>
                <p className="text-xs text-muted-foreground">{row.email}</p>
              </div>
            ),
          },
          {
            key: "role",
            header: "Role",
            render: (row) => (
              <span className="text-label text-foreground/60">
                {row.role}
              </span>
            ),
          },
          {
            key: "orders",
            header: "Orders",
            render: (row) => (
              <span className="text-foreground">{row.orderCount}</span>
            ),
          },
          {
            key: "spent",
            header: "Total Spent",
            render: (row) => (
              <span className="font-medium text-foreground">
                {row.totalSpent > 0
                  ? formatCurrency(row.totalSpent, { isWholeUnit: true })
                  : "—"}
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
                {row.isActive ? "Active" : "Suspended"}
              </span>
            ),
          },
          {
            key: "joined",
            header: "Joined",
            className: "text-muted-foreground whitespace-nowrap",
            render: (row) => formatDate(row.createdAt),
          },
        ]}
      />

      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        basePath="/admin/customers"
        currentParams={search ? { q: search } : {}}
      />
    </div>
  );
}
