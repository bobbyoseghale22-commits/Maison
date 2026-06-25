import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import { Order, User, Product } from "@/models";
import { requireAdmin } from "@/lib/auth/utils";

/**
 * Analytics data layer. All data is fetched in a single function via
 * `Promise.all` so the analytics page makes one DB round-trip with
 * concurrent pipelines rather than sequential awaits.
 *
 * All pipelines target the trailing 12 calendar months so the charts
 * show a consistent window regardless of when the dashboard is viewed.
 */

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface MonthlyPoint {
  /** "Jan", "Feb" … */
  month: string;
  /** Full label "Jan 2024" for tooltip */
  label: string;
  value: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  pct: number;
}

export interface TopProduct {
  name: string;
  revenue: number;
  unitsSold: number;
}

export interface AnalyticsSummary {
  /** All-time totals */
  totals: {
    revenue: number;
    orders: number;
    customers: number;
    activeProducts: number;
  };
  /** Month-over-month deltas (current vs previous calendar month) */
  deltas: {
    revenue: number;     // percentage change, null when no prior month
    orders: number;
    customers: number;
  };
  /** 12 months of monthly revenue (paid orders only) */
  monthlyRevenue: MonthlyPoint[];
  /** 12 months of monthly order counts */
  monthlyOrders: MonthlyPoint[];
  /** 12 months of new customer registrations */
  monthlyCustomers: MonthlyPoint[];
  /** Order status distribution across all orders */
  orderStatusBreakdown: StatusBreakdown[];
  /** Top 5 products by revenue */
  topProducts: TopProduct[];
  /** Average order value for paid orders */
  avgOrderValue: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Builds a complete 12-month slot array so months with zero data
 *  still appear in the chart rather than collapsing the axis. */
function buildMonthSlots(): Array<{
  year: number;
  month: number;   // 1–12
  monthName: string;
  label: string;
}> {
  const slots = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    slots.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      monthName: MONTH_NAMES[d.getMonth()],
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
    });
  }

  return slots;
}

function pct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

// ---------------------------------------------------------------------------
// Main query
// ---------------------------------------------------------------------------

export async function getAnalyticsData(): Promise<AnalyticsSummary> {
  await requireAdmin();
  await connectToDatabase();

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  );

  // Run all pipelines concurrently
  const [
    revenuePipeline,
    ordersPipeline,
    customersPipeline,
    totalRevRow,
    thisMonthRevRow,
    lastMonthRevRow,
    totalOrders,
    thisMonthOrders,
    lastMonthOrders,
    totalCustomers,
    thisMonthCustomers,
    lastMonthCustomers,
    activeProducts,
    orderStatusRows,
    topProductRows,
    avgOrderValueRow,
  ] = await Promise.all([

    // ── Monthly revenue (12 months, paid orders only) ─────────────────────
    Order.aggregate<{ _id: { year: number; month: number }; total: number }>([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$total" },
        },
      },
    ]),

    // ── Monthly order counts (12 months, all orders) ──────────────────────
    Order.aggregate<{ _id: { year: number; month: number }; count: number }>([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]),

    // ── Monthly new customers (12 months) ─────────────────────────────────
    User.aggregate<{ _id: { year: number; month: number }; count: number }>([
      {
        $match: {
          role: "customer",
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]),

    // ── Scalar totals & deltas ─────────────────────────────────────────────
    Order.aggregate<{ total: number }>([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]).then((r) => r[0] ?? { total: 0 }),

    Order.aggregate<{ total: number }>([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: startOfThisMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]).then((r) => r[0] ?? { total: 0 }),

    Order.aggregate<{ total: number }>([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]).then((r) => r[0] ?? { total: 0 }),

    Order.countDocuments({}),
    Order.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
    Order.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
    }),

    User.countDocuments({ role: "customer" }),
    User.countDocuments({
      role: "customer",
      createdAt: { $gte: startOfThisMonth },
    }),
    User.countDocuments({
      role: "customer",
      createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
    }),

    Product.countDocuments({ isActive: true }),

    // ── Order status distribution ──────────────────────────────────────────
    Order.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // ── Top 5 products by revenue ──────────────────────────────────────────
    Order.aggregate<{ _id: string; name: string; revenue: number; units: number }>(
      [
        { $match: { paymentStatus: "paid" } },
        { $unwind: "$items" },
        {
          $group: {
            _id: { $toString: "$items.product" },
            name: { $first: "$items.name" },
            revenue: {
              $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] },
            },
            units: { $sum: "$items.quantity" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ],
    ),

    // ── Average order value ────────────────────────────────────────────────
    Order.aggregate<{ avg: number }>([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, avg: { $avg: "$total" } } },
    ]).then((r) => r[0] ?? { avg: 0 }),
  ]);

  // ── Fill month slots ────────────────────────────────────────────────────
  const slots = buildMonthSlots();

  const revMap = new Map(
    revenuePipeline.map((r) => [`${r._id.year}-${r._id.month}`, r.total]),
  );
  const ordMap = new Map(
    ordersPipeline.map((r) => [`${r._id.year}-${r._id.month}`, r.count]),
  );
  const cusMap = new Map(
    customersPipeline.map((r) => [`${r._id.year}-${r._id.month}`, r.count]),
  );

  const monthlyRevenue: MonthlyPoint[] = slots.map((s) => ({
    month: s.monthName,
    label: s.label,
    value: Math.round((revMap.get(`${s.year}-${s.month}`) ?? 0) * 100) / 100,
  }));

  const monthlyOrders: MonthlyPoint[] = slots.map((s) => ({
    month: s.monthName,
    label: s.label,
    value: ordMap.get(`${s.year}-${s.month}`) ?? 0,
  }));

  const monthlyCustomers: MonthlyPoint[] = slots.map((s) => ({
    month: s.monthName,
    label: s.label,
    value: cusMap.get(`${s.year}-${s.month}`) ?? 0,
  }));

  // ── Status breakdown ────────────────────────────────────────────────────
  const statusTotal = orderStatusRows.reduce((n, r) => n + r.count, 0);
  const orderStatusBreakdown: StatusBreakdown[] = orderStatusRows.map((r) => ({
    status: r._id,
    count: r.count,
    pct:
      statusTotal > 0
        ? Math.round((r.count / statusTotal) * 1000) / 10
        : 0,
  }));

  // ── Top products ────────────────────────────────────────────────────────
  const topProducts: TopProduct[] = topProductRows.map((r) => ({
    name: r.name,
    revenue: Math.round(r.revenue * 100) / 100,
    unitsSold: r.units,
  }));

  return {
    totals: {
      revenue: totalRevRow.total,
      orders: totalOrders,
      customers: totalCustomers,
      activeProducts,
    },
    deltas: {
      revenue: pct(thisMonthRevRow.total, lastMonthRevRow.total),
      orders: pct(thisMonthOrders, lastMonthOrders),
      customers: pct(thisMonthCustomers, lastMonthCustomers),
    },
    monthlyRevenue,
    monthlyOrders,
    monthlyCustomers,
    orderStatusBreakdown,
    topProducts,
    avgOrderValue: Math.round(avgOrderValueRow.avg * 100) / 100,
  };
}
