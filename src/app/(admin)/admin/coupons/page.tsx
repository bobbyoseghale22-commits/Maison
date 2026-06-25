import type { Metadata } from "next";

import { adminGetCoupons } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { AdminTable } from "@/components/admin/admin-table";
import { cn } from "@/lib/utils";
import type { AdminCouponRow } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  const coupons = await adminGetCoupons();

  const active = coupons.filter((c) => c.isActive && !c.isExpired).length;
  const expired = coupons.filter((c) => c.isExpired).length;

  return (
    <div className="p-6 sm:p-10 space-y-8">
      <div>
        <p className="text-label text-foreground/40">Promotions</p>
        <h1 className="mt-1 font-display text-4xl italic text-foreground">Coupons</h1>
      </div>

      {/* Summary pills */}
      <div className="flex gap-4 text-sm">
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{coupons.length}</span> total
        </span>
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{active}</span> active
        </span>
        {expired > 0 && (
          <span className="text-muted-foreground">
            <span className="font-medium text-destructive">{expired}</span> expired
          </span>
        )}
      </div>

      <AdminTable<AdminCouponRow>
        rows={coupons}
        emptyMessage="No coupons found."
        columns={[
          {
            key: "code",
            header: "Code",
            render: (row) => (
              <code className="font-mono font-medium text-foreground tracking-wider">
                {row.code}
              </code>
            ),
          },
          {
            key: "type",
            header: "Discount",
            render: (row) => (
              <span className="text-foreground">
                {row.type === "percentage"
                  ? `${row.value}%`
                  : formatCurrency(row.value, { isWholeUnit: true })}
              </span>
            ),
          },
          {
            key: "usage",
            header: "Usage",
            render: (row) => (
              <span className="text-foreground">
                {row.usageCount}
                {row.usageLimit != null && (
                  <span className="text-muted-foreground"> / {row.usageLimit}</span>
                )}
              </span>
            ),
          },
          {
            key: "min",
            header: "Min Order",
            render: (row) => (
              <span className="text-muted-foreground">
                {row.minOrderAmount
                  ? formatCurrency(row.minOrderAmount, { isWholeUnit: true })
                  : "—"}
              </span>
            ),
          },
          {
            key: "expires",
            header: "Expires",
            render: (row) => (
              <span
                className={cn(
                  "whitespace-nowrap",
                  row.isExpired ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {formatDate(row.expiresAt)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => {
              if (row.isExpired) {
                return <span className="text-label text-destructive">Expired</span>;
              }
              return (
                <span
                  className={`text-label ${
                    row.isActive ? "text-foreground" : "text-foreground/40"
                  }`}
                >
                  {row.isActive ? "Active" : "Inactive"}
                </span>
              );
            },
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
