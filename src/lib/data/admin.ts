import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import { Order, Product, User, Category, Coupon } from "@/models";
import { requireAdmin } from "@/lib/auth/utils";
import { escapeRegex } from "@/lib/security/sanitize";
import type { OrderStatus, PaymentStatus } from "@/models/types";

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardStats {
  revenue: { total: number; thisMonth: number; lastMonth: number };
  orders: { total: number; pending: number; processing: number };
  customers: { total: number; newThisMonth: number };
  products: { total: number; outOfStock: number };
}

export interface RecentOrder {
  orderId: string;
  orderNumber: string;
  email: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
}

export interface DashboardData {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
}

export async function getDashboardData(): Promise<DashboardData> {
  await requireAdmin();
  await connectToDatabase();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalRevenue,
    thisMonthRevenue,
    lastMonthRevenue,
    totalOrders,
    pendingOrders,
    processingOrders,
    totalCustomers,
    newCustomers,
    totalProducts,
    outOfStockProducts,
    recentOrderDocs,
  ] = await Promise.all([
    // Revenue from paid/delivered/shipped orders
    Order.aggregate<{ total: number }>([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]).then((r) => r[0]?.total ?? 0),

    Order.aggregate<{ total: number }>([
      { $match: { paymentStatus: "paid", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]).then((r) => r[0]?.total ?? 0),

    Order.aggregate<{ total: number }>([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]).then((r) => r[0]?.total ?? 0),

    Order.countDocuments({}),
    Order.countDocuments({ status: "pending" }),
    Order.countDocuments({ status: "processing" }),

    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "customer", createdAt: { $gte: startOfMonth } }),

    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, totalStock: 0 }),

    Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderNumber user guestEmail total status paymentStatus createdAt")
      .populate<{ user: { email: string } | null }>("user", "email")
      .lean(),
  ]);

  const recentOrders: RecentOrder[] = recentOrderDocs.map((o) => ({
    orderId: o._id.toString(),
    orderNumber: o.orderNumber,
    email:
      (o.user as { email: string } | null)?.email ??
      (o as unknown as { guestEmail?: string }).guestEmail ??
      "Guest",
    total: o.total,
    status: o.status as OrderStatus,
    paymentStatus: o.paymentStatus as PaymentStatus,
    createdAt: o.createdAt,
  }));

  return {
    stats: {
      revenue: { total: totalRevenue, thisMonth: thisMonthRevenue, lastMonth: lastMonthRevenue },
      orders: { total: totalOrders, pending: pendingOrders, processing: processingOrders },
      customers: { total: totalCustomers, newThisMonth: newCustomers },
      products: { total: totalProducts, outOfStock: outOfStockProducts },
    },
    recentOrders,
  };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const PRODUCT_PAGE_SIZE = 20;

export interface AdminProductRow {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  price: number;
  totalStock: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryName: string;
  imageUrl: string | null;
  createdAt: Date;
}

export interface AdminProductsResult {
  products: AdminProductRow[];
  total: number;
  page: number;
  totalPages: number;
}

export async function adminGetProducts(
  page = 1,
  search?: string,
  activeOnly?: boolean,
): Promise<AdminProductsResult> {
  await requireAdmin();
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (activeOnly) filter.isActive = true;
  if (search) filter.$text = { $search: search };

  const total = await Product.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / PRODUCT_PAGE_SIZE));
  const skip = (Math.min(page, totalPages) - 1) * PRODUCT_PAGE_SIZE;

  const docs = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(PRODUCT_PAGE_SIZE)
    .populate<{ category: { name: string } }>("category", "name")
    .select("slug name brand price totalStock isActive isFeatured images createdAt")
    .lean();

  return {
    products: docs.map((p) => ({
      id: p._id.toString(),
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      price: p.price,
      totalStock: p.totalStock,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      categoryName: (p.category as { name: string })?.name ?? "—",
      imageUrl: p.images[0]?.url ?? null,
      createdAt: p.createdAt,
    })),
    total,
    page: Math.min(page, totalPages),
    totalPages,
  };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  parentName?: string;
  productCount: number;
}

export async function adminGetCategories(): Promise<AdminCategoryRow[]> {
  await requireAdmin();
  await connectToDatabase();

  const [categories, productCounts] = await Promise.all([
    Category.find({})
      .sort({ sortOrder: 1, name: 1 })
      .populate<{ parent: { name: string } | null }>("parent", "name")
      .lean(),
    Product.aggregate<{ _id: string; count: number }>([
      { $group: { _id: { $toString: "$category" }, count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(productCounts.map((r) => [r._id, r.count]));

  return categories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    description: c.description,
    isActive: c.isActive,
    sortOrder: c.sortOrder,
    parentName: (c.parent as { name: string } | null)?.name,
    productCount: countMap.get(c._id.toString()) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

const CUSTOMER_PAGE_SIZE = 25;

export interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  orderCount: number;
  totalSpent: number;
  createdAt: Date;
}

export interface AdminCustomersResult {
  customers: AdminCustomerRow[];
  total: number;
  page: number;
  totalPages: number;
}

export async function adminGetCustomers(
  page = 1,
  search?: string,
): Promise<AdminCustomersResult> {
  await requireAdmin();
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (search) {
    const safe = escapeRegex(search.slice(0, 100)); // cap length + escape metacharacters
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / CUSTOMER_PAGE_SIZE));
  const skip = (Math.min(page, totalPages) - 1) * CUSTOMER_PAGE_SIZE;

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(CUSTOMER_PAGE_SIZE)
    .select("name email role isActive createdAt")
    .lean();

  const userIds = users.map((u) => u._id.toString());

  const orderStats = await Order.aggregate<{
    _id: string;
    count: number;
    total: number;
  }>([
    { $match: { user: { $in: users.map((u) => u._id) }, paymentStatus: "paid" } },
    { $group: { _id: { $toString: "$user" }, count: { $sum: 1 }, total: { $sum: "$total" } } },
  ]);

  const statsMap = new Map(orderStats.map((r) => [r._id, r]));

  return {
    customers: users.map((u) => {
      const stats = statsMap.get(u._id.toString());
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        orderCount: stats?.count ?? 0,
        totalSpent: stats?.total ?? 0,
        createdAt: u.createdAt,
      };
    }),
    total,
    page: Math.min(page, totalPages),
    totalPages,
  };
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export interface AdminCouponRow {
  id: string;
  code: string;
  description?: string;
  type: "percentage" | "fixed";
  value: number;
  usageCount: number;
  usageLimit?: number;
  minOrderAmount?: number;
  expiresAt: Date;
  isActive: boolean;
  isExpired: boolean;
}

export async function adminGetCoupons(): Promise<AdminCouponRow[]> {
  await requireAdmin();
  await connectToDatabase();

  const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
  const now = new Date();

  return coupons.map((c) => ({
    id: c._id.toString(),
    code: c.code,
    description: c.description,
    type: c.type,
    value: c.value,
    usageCount: c.usageCount,
    usageLimit: c.usageLimit,
    minOrderAmount: c.minOrderAmount,
    expiresAt: c.expiresAt,
    isActive: c.isActive,
    isExpired: c.expiresAt < now,
  }));
}
