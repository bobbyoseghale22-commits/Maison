import type { Metadata } from "next";
import Link from "next/link";

import { getDashboardData } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { StatCard } from "@/components/admin/stat-card";
import { AdminTable } from "@/components/admin/admin-table";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import type { RecentOrder } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const { stats, recentOrders } = await getDashboardData();

  const revenueGrowth = stats.revenue.lastMonth > 0
    ? ((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth) * 100
    : null;

  return (
    <div className="p-6 sm:p-10 space-y-10">
      <div>
        <p className="text-label text-foreground/40">Overview</p>
        <h1 className="mt-1 font-display text-4xl italic text-foreground">Dashboard</h1>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.revenue.total, { isWholeUnit: true })}
          sub="All time, paid orders"
          trend={
            revenueGrowth !== null
              ? {
                  value: `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}% vs last month`,
                  positive: revenueGrowth >= 0,
                }
              : undefined
          }
        />
        <StatCard
          label="This Month"
          value={formatCurrency(stats.revenue.thisMonth, { isWholeUnit: true })}
          sub={`Last month: ${formatCurrency(stats.revenue.lastMonth, { isWholeUnit: true })}`}
        />
        <StatCard
          label="Orders"
          value={stats.orders.total}
          sub={`${stats.orders.pending} pending · ${stats.orders.processing} processing`}
        />
        <StatCard
          label="Customers"
          value={stats.customers.total}
          sub={`${stats.customers.newThisMonth} new this month`}
        />
        <StatCard
          label="Active Products"
          value={stats.products.total}
          sub={
            stats.products.outOfStock > 0
              ? `${stats.products.outOfStock} out of stock`
              : "All in stock"
          }
          trend={
            stats.products.outOfStock > 0
              ? { value: `${stats.products.outOfStock} need restocking`, positive: false }
              : undefined
          }
        />
      </div>

      {/* Recent orders */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl italic text-foreground">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-label text-foreground/50 hover:text-foreground underline-offset-4 hover:underline transition-colors"
          >
            View all
          </Link>
        </div>
        <AdminTable<RecentOrder>
          rows={recentOrders}
          emptyMessage="No orders yet."
          columns={[
            {
              key: "order",
              header: "Order",
              render: (row) => (
                <Link
                  href={`/admin/orders/${row.orderId}`}
                  className="font-medium text-foreground hover:underline underline-offset-4"
                >
                  #{row.orderNumber}
                </Link>
              ),
            },
            { key: "email", header: "Customer", render: (row) => <span className="text-muted-foreground">{row.email}</span> },
            { key: "status", header: "Status", render: (row) => <OrderStatusBadge status={row.status} /> },
            {
              key: "total",
              header: "Total",
              className: "text-right",
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
      </section>

      {/* Quick links */}
      <section>
        <h2 className="font-display text-xl italic text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Add Product", href: "/admin/products" },
            { label: "Manage Categories", href: "/admin/categories" },
            { label: "View Coupons", href: "/admin/coupons" },
            { label: "Upload Images", href: "/admin/products/upload" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-label border border-border px-4 py-3 text-foreground/70 hover:border-foreground hover:text-foreground transition-colors text-center"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
