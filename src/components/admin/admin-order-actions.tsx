"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { OrderDetail } from "@/lib/data/orders";
import { ORDER_STATUSES } from "@/models/types";
import { Button } from "@/components/ui/button";

interface AdminOrderActionsProps {
  order: OrderDetail;
}

/**
 * Client island for admin order actions — status update and refund.
 * Kept as a small client component inside the otherwise server-rendered
 * admin order detail page, matching the `ReviewSection` pattern.
 */
export function AdminOrderActions({ order }: AdminOrderActionsProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState(order.status);

  async function handleStatusUpdate() {
    if (selectedStatus === order.status) return;
    setIsPending(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        toast.error(d.error ?? "Failed to update status.");
        return;
      }
      toast.success("Status updated.");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleRefund() {
    if (!confirm("Issue a full refund for this order?")) return;
    setIsPending(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.orderId}/refund`, {
        method: "POST",
      });
      const d = await res.json() as { refunded?: boolean; error?: string };
      if (!res.ok) {
        toast.error(d.error ?? "Refund failed.");
        return;
      }
      toast.success("Refund issued.");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsPending(false);
    }
  }

  const canRefund =
    order.paymentStatus === "paid" &&
    order.status !== "refunded" &&
    order.status !== "cancelled";

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl italic text-foreground">Actions</h2>

      <div className="space-y-2">
        <label className="text-label block text-foreground/60">Update Status</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
          className="h-10 w-full border border-input bg-background px-3 text-sm text-foreground focus:border-foreground focus:outline-none"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <Button
          onClick={handleStatusUpdate}
          disabled={isPending || selectedStatus === order.status}
          className="w-full rounded-none"
          size="sm"
        >
          {isPending ? "Updating…" : "Update Status"}
        </Button>
      </div>

      {canRefund && (
        <div className="border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={handleRefund}
            disabled={isPending}
            className="w-full rounded-none text-destructive hover:text-destructive"
            size="sm"
          >
            Issue Full Refund
          </Button>
        </div>
      )}
    </div>
  );
}
