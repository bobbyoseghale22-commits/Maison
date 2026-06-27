import type { Metadata } from "next";

import { getAnalyticsData } from "@/lib/data/analytics";
import { formatCurrency } from "@/lib/helpers";
import { StatCard } from "@/components/admin/stat-card";
import { ChartPanel } from "@/components/admin/charts/chart-panel";
import { BarChart } from "@/components/admin/charts/bar-chart";
import { LineChart } from "@/components/admin/charts/line-chart";
import { DonutChart } from "@/components/admin/charts/donut-chart";
import { Sparkline } from "@/components/admin/charts/sparkline";

export const metadata: Metadata = { title: "Analytics" };

/**
 * Analytics dashboard — fully server-rendered. All MongoDB
 * aggregation pipelines run in a single `getAnalyticsData()` call;
 * every chart is a pure SVG Server Component with no client JS.
 */
export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData();

  const {
    totals,
    deltas,
    monthlyRevenue,
    monthlyOrders,
    monthlyCustomers,
    orderStatusBreakdown,
    topProducts,
    avgOrderValue,
  } = data;

  // Trailing-3-months sparkline slices
  const last3Rev = monthlyRevenue.slice(-3);
  const last3Ord = monthlyOrders.slice(-3);
  const last3Cus = monthlyCustomers.slice(-3);

  function trendLabel(delta: number): string {
    return `${delta >= 0 ? "+" : ""}${delta}% vs last month`;
  }

  return (
    <div className="p-6 sm:p-10 space-y-10">
      {/* Header */}
      <div>
        <p className="text-label text-foreground/40">Admin</p>
        <h1 className="mt-1 font-display text-4xl italic text-foreground">
          Analytics
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Trailing 12 months · paid orders only for revenue figures
        </p>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totals.revenue, { isWholeUnit: true })}
          sub={trendLabel(deltas.revenue)}
          trend={{ value: trendLabel(deltas.revenue), positive: deltas.revenue >= 0 }}
        >
          <Sparkline data={last3Rev} positive={deltas.revenue >= 0} />
        </StatCard>

        <StatCard
          label="Total Orders"
          value={totals.orders.toLocaleString()}
          sub={trendLabel(deltas.orders)}
          trend={{ value: trendLabel(deltas.orders), positive: deltas.orders >= 0 }}
        >
          <Sparkline data={last3Ord} positive={deltas.orders >= 0} />
        </StatCard>

        <StatCard
          label="Customers"
          value={totals.customers.toLocaleString()}
          sub={trendLabel(deltas.customers)}
          trend={{ value: trendLabel(deltas.customers), positive: deltas.customers >= 0 }}
        >
          <Sparkline data={last3Cus} positive={deltas.customers >= 0} />
        </StatCard>

        <StatCard
          label="Avg Order Value"
          value={formatCurrency(avgOrderValue, { isWholeUnit: true })}
          sub={`${totals.activeProducts} active products`}
        />
      </div>

      {/* ── Revenue + Orders charts ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartPanel
          title="Monthly Revenue"
          subtitle="Paid orders · trailing 12 months"
          aside={
            <span className="font-display text-xl italic text-foreground">
              {formatCurrency(
                monthlyRevenue.reduce((s, d) => s + d.value, 0),
                { isWholeUnit: true },
              )}
            </span>
          }
        >
          <BarChart
            data={monthlyRevenue}
            formatValue={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`}
            height={260}
          />
        </ChartPanel>

        <ChartPanel
          title="Monthly Orders"
          subtitle="Paid orders · trailing 12 months"
          aside={
            <span className="font-display text-xl italic text-foreground">
              {monthlyOrders.reduce((s, d) => s + d.value, 0)}
            </span>
          }
        >
          <LineChart
            data={monthlyOrders}
            formatValue={(v) => String(Math.round(v))}
            height={260}
            filled
          />
        </ChartPanel>
      </div>

      {/* ── Customers chart ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartPanel
          title="New Customers"
          subtitle="Registrations · trailing 12 months"
          aside={
            <span className="font-display text-xl italic text-foreground">
              {monthlyCustomers.reduce((s, d) => s + d.value, 0)}
            </span>
          }
        >
          <LineChart
            data={monthlyCustomers}
            formatValue={(v) => String(Math.round(v))}
            height={240}
            filled
          />
        </ChartPanel>

        {/* ── Order status breakdown ───────────────────────────────────── */}
        <ChartPanel
          title="Order Status"
          subtitle="All-time distribution"
          aside={
            <span className="text-sm text-muted-foreground">
              {totals.orders} total
            </span>
          }
        >
          <div className="flex justify-center pt-2">
            <DonutChart
              data={orderStatusBreakdown.map((s) => ({
                label: s.status,
                value: s.count,
                pct: s.pct,
              }))}
              total={totals.orders}
              centerLabel="orders"
              size={180}
            />
          </div>
        </ChartPanel>
      </div>

      {/* ── Top products ────────────────────────────────────────────────── */}
      <ChartPanel
        title="Top Products by Revenue"
        subtitle="Paid orders · all time"
      >
        {topProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No revenue data yet.
          </p>
        ) : (
          <div className="space-y-3 pt-2">
            {topProducts.map((product, i) => {
              const maxRevenue = topProducts[0]?.revenue ?? 0;
              const barPct = maxRevenue > 0
                ? Math.round((product.revenue / maxRevenue) * 100)
                : 0;

              return (
                <div key={product.name} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="min-w-0 truncate text-foreground">
                      <span className="text-label mr-2 text-foreground/30">
                        {i + 1}
                      </span>
                      {product.name}
                    </span>
                    <div className="flex shrink-0 gap-4 text-muted-foreground tabular-nums">
                      <span>{product.unitsSold} sold</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(product.revenue, { isWholeUnit: true })}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-secondary">
                    <div
                      className="h-1 bg-foreground transition-all"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ChartPanel>

      {/* ── Monthly summary table ────────────────────────────────────────── */}
      <ChartPanel
        title="Monthly Summary"
        subtitle="Revenue · orders · new customers per month"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Month", "Revenue", "Orders", "New Customers", "Avg Order"].map(
                  (h) => (
                    <th
                      key={h}
                      className="py-3 pr-6 text-left text-label font-normal text-foreground/50"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {monthlyRevenue
                .slice()
                .reverse()
                .map((rev, i) => {
                  const orders = [...monthlyOrders].reverse()[i];
                  const customers = [...monthlyCustomers].reverse()[i];
                  const ordersValue = orders?.value ?? 0;
                  const avgOrd =
                    ordersValue > 0
                      ? rev.value / ordersValue
                      : 0;

                  return (
                    <tr
                      key={rev.label}
                      className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 pr-6 font-medium text-foreground">
                        {rev.label}
                      </td>
                      <td className="py-3 pr-6 tabular-nums text-foreground">
                        {formatCurrency(rev.value, { isWholeUnit: true })}
                      </td>
                      <td className="py-3 pr-6 tabular-nums text-foreground">
                        {ordersValue}
                      </td>
                      <td className="py-3 pr-6 tabular-nums text-foreground">
                        {customers?.value ?? 0}
                      </td>
                      <td className="py-3 pr-6 tabular-nums text-muted-foreground">
                        {avgOrd > 0
                          ? formatCurrency(avgOrd, { isWholeUnit: true })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </ChartPanel>
    </div>
  );
}
