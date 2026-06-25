import type { Metadata } from "next";
import Link from "next/link";

import { adminGetOrders } from "@/lib/data/orders";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { ORDER_STATUSES } from "@/models/types";
import type { OrderSummaryItem } from "@/lib/data/orders";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

interface AdminOrdersPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const status = params.status;

  const result = await adminGetOrders(page, status);
  const statusOptions = ["", ...ORDER_STATUSES];

  return (
    <div className="p-6 sm:p-10 space-y-8">
      <div>
        <p className="text-label text-foreground/40">Management</p>
        <h1 className="mt-1 font-display text-4xl italic text-foreground">Orders</h1>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((s) => {
          const href = s ? `/admin/orders?status=${s}` : "/admin/orders";
          const isActive = (status ?? "") === s;
          return (
            <Link
              key={s || "all"}
              href={href}
              className={cn(
                "text-label border px-4 py-1.5 transition-colors",
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground/60 hover:border-foreground hover:text-foreground",
              )}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
            </Link>
          );
        })}
      </div>

      <AdminTable<OrderSummaryItem>
        rows={result.orders}
        emptyMessage="No orders found."
        columns={[
          {
            key: "order",
            header: "Order",
            render: (row) => (
              <Link
                href={`/admin/orders/${row.orderId}`}
                className="font-medium text-foreground hover:underline underline-offset-4 whitespace-nowrap"
              >
                #{row.orderNumber}
              </Link>
            ),
          },
          {
            key: "items",
            header: "Items",
            render: (row) => (
              <span className="text-muted-foreground">
                {row.itemCount} item{row.itemCount !== 1 ? "s" : ""}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <OrderStatusBadge status={row.status} />,
          },
          {
            key: "payment",
            header: "Payment",
            render: (row) => (
              <span
                className={cn(
                  "text-label",
                  row.paymentStatus === "paid" ? "text-foreground" : "text-foreground/40",
                )}
              >
                {row.paymentStatus}
              </span>
            ),
          },
          {
            key: "total",
            header: "Total",
            className: "text-right whitespace-nowrap",
            render: (row) => (
              <span className="font-medium">
                {formatCurrency(row.total, { isWholeUnit: true })}
              </span>
            ),
          },
          {
            key: "date",
            header: "Date",
            className: "text-muted-foreground whitespace-nowrap",
            render: (row) => formatDate(row.createdAt),
          },
        ]}
      />

      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        basePath="/admin/orders"
        currentParams={status ? { status } : {}}
      />
    </div>
  );
}
