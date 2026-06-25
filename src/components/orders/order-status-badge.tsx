import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/models/types";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  className?: string;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-secondary text-foreground/60",
  paid: "bg-secondary text-foreground",
  processing: "bg-secondary text-foreground",
  shipped: "bg-foreground text-background",
  delivered: "bg-foreground text-background",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-destructive/10 text-destructive",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        "text-label inline-flex items-center px-2.5 py-1",
        STATUS_STYLES[status] ?? "bg-secondary text-foreground/60",
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
