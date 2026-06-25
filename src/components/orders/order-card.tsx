import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { OrderSummaryItem } from "@/lib/data/orders";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

interface OrderCardProps {
  order: OrderSummaryItem;
  /** Admin view links to /admin/orders/[id], customer view to /orders/[number]. */
  href: string;
}

export function OrderCard({ order, href }: OrderCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border border-border p-5 transition-colors hover:border-foreground"
    >
      <div className="space-y-1">
        <p className="font-medium text-foreground">#{order.orderNumber}</p>
        <p className="text-sm text-muted-foreground">
          {formatDate(order.createdAt)} · {order.itemCount}{" "}
          {order.itemCount === 1 ? "item" : "items"}
        </p>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">
          {formatCurrency(order.total, { isWholeUnit: true })}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}
