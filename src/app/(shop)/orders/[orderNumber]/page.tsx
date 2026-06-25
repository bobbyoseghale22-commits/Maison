import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getMyOrder } from "@/lib/data/orders";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

interface OrderDetailPageProps {
  params: Promise<{ orderNumber: string }>;
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order #${orderNumber}` };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderNumber } = await params;
  const order = await getMyOrder(orderNumber);
  if (!order) notFound();

  const addr = order.shippingAddress;

  return (
    <div className="container py-12 sm:py-16">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="mt-6 flex flex-wrap items-start gap-4">
        <div>
          <p className="text-label text-foreground/40">Order</p>
          <h1 className="mt-1 font-display text-3xl italic text-foreground">
            #{order.orderNumber}
          </h1>
        </div>
        <div className="mt-1 flex flex-col gap-1">
          <OrderStatusBadge status={order.status} />
          <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="font-display text-xl italic text-foreground">Items</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {order.items.map((item) => (
              <li key={item.sku} className="flex gap-4 py-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-secondary">
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-xs italic text-foreground/25">MN</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center gap-0.5">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-label text-foreground/50">{item.size} / {item.color}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.unitPrice, { isWholeUnit: true })}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium text-foreground">
                  {formatCurrency(item.unitPrice * item.quantity, { isWholeUnit: true })}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatCurrency(order.subtotal, { isWholeUnit: true })}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount</dt>
                <dd>−{formatCurrency(order.discount, { isWholeUnit: true })}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{order.shippingCost === 0 ? "Free" : formatCurrency(order.shippingCost, { isWholeUnit: true })}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tax</dt>
              <dd>{formatCurrency(order.tax, { isWholeUnit: true })}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-medium">
              <dt>Total</dt>
              <dd>{formatCurrency(order.total, { isWholeUnit: true })}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="font-display text-xl italic text-foreground">Shipping Address</h2>
            <address className="mt-3 space-y-0.5 text-sm not-italic text-muted-foreground">
              <p className="text-foreground">{addr.fullName}</p>
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>{addr.city}, {addr.state} {addr.postalCode}</p>
              <p>{addr.country}</p>
            </address>
          </div>

          {order.notes && (
            <div>
              <h2 className="font-display text-xl italic text-foreground">Notes</h2>
              <p className="mt-3 text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
