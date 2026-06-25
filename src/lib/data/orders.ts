import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models";
import { requireUser, requireAdmin } from "@/lib/auth/utils";
import type { OrderStatus, PaymentStatus, Address, OrderItem } from "@/models/types";

export interface OrderSummaryItem {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  itemCount: number;
  createdAt: Date;
}

export interface OrderDetail {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: Array<OrderItem & { productId: string }>;
  shippingAddress: Address;
  billingAddress: Address;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: Date;
  stripeCheckoutSessionId?: string;
}

function toSummary(doc: {
  _id: { toString(): string };
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  items: Array<{ quantity: number }>;
  createdAt: Date;
}): OrderSummaryItem {
  return {
    orderId: doc._id.toString(),
    orderNumber: doc.orderNumber,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    total: doc.total,
    itemCount: doc.items.reduce((n, i) => n + i.quantity, 0),
    createdAt: doc.createdAt,
  };
}

function toDetail(doc: {
  _id: { toString(): string };
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: Array<{ product: { toString(): string }; name: string; image: string; sku: string; size: string; color: string; unitPrice: number; quantity: number }>;
  shippingAddress: Address;
  billingAddress: Address;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: Date;
  stripeCheckoutSessionId?: string;
}): OrderDetail {
  return {
    orderId: doc._id.toString(),
    orderNumber: doc.orderNumber,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    items: doc.items.map((item) => ({
      productId: item.product.toString(),
      product: item.product as unknown as import("mongoose").Types.ObjectId,
      name: item.name,
      image: item.image,
      sku: item.sku,
      size: item.size as OrderItem["size"],
      color: item.color,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })),
    shippingAddress: doc.shippingAddress,
    billingAddress: doc.billingAddress,
    subtotal: doc.subtotal,
    shippingCost: doc.shippingCost,
    tax: doc.tax,
    discount: doc.discount,
    total: doc.total,
    notes: doc.notes,
    createdAt: doc.createdAt,
    stripeCheckoutSessionId: doc.stripeCheckoutSessionId,
  };
}

// ---------------------------------------------------------------------------
// Customer API
// ---------------------------------------------------------------------------

/** Returns the signed-in customer's order history, newest first. */
export async function getMyOrders(): Promise<OrderSummaryItem[]> {
  const user = await requireUser();
  await connectToDatabase();

  const orders = await Order.find({ user: user.id })
    .sort({ createdAt: -1 })
    .select("orderNumber status paymentStatus total items createdAt")
    .lean();

  return orders.map(toSummary);
}

/** Returns a single order that belongs to the signed-in customer. */
export async function getMyOrder(orderNumber: string): Promise<OrderDetail | null> {
  const user = await requireUser();
  await connectToDatabase();

  const order = await Order.findOne({
    orderNumber: orderNumber.toUpperCase(),
    user: user.id,
  }).lean();

  if (!order) return null;
  return toDetail(order as Parameters<typeof toDetail>[0]);
}

// ---------------------------------------------------------------------------
// Admin API
// ---------------------------------------------------------------------------

const ADMIN_PAGE_SIZE = 25;

export interface AdminOrdersResult {
  orders: OrderSummaryItem[];
  total: number;
  page: number;
  totalPages: number;
}

/** Admin: paginated order list with optional status filter. */
export async function adminGetOrders(
  page = 1,
  status?: string,
): Promise<AdminOrdersResult> {
  await requireAdmin();
  await connectToDatabase();

  const filter = status ? { status } : {};
  const total = await Order.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const skip = (Math.min(page, totalPages) - 1) * ADMIN_PAGE_SIZE;

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(ADMIN_PAGE_SIZE)
    .select("orderNumber status paymentStatus total items createdAt")
    .lean();

  return {
    orders: orders.map(toSummary),
    total,
    page: Math.min(page, totalPages),
    totalPages,
  };
}

/** Admin: single order detail. */
export async function adminGetOrder(orderId: string): Promise<OrderDetail | null> {
  await requireAdmin();
  await connectToDatabase();

  const order = await Order.findById(orderId).lean();
  if (!order) return null;
  return toDetail(order as Parameters<typeof toDetail>[0]);
}

/** Admin: update order status. */
export async function adminUpdateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  await requireAdmin();
  await connectToDatabase();

  const update: Record<string, unknown> = { status };
  if (status === "delivered") update.deliveredAt = new Date();
  if (status === "cancelled") update.cancelledAt = new Date();

  await Order.findByIdAndUpdate(orderId, update);
}
