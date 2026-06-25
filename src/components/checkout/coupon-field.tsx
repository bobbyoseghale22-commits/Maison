"use client";

import * as React from "react";
import { Tag, X } from "lucide-react";

import type { CouponView } from "@/lib/checkout-utils";
import { formatCurrency } from "@/lib/helpers";
import { Button } from "@/components/ui/button";

interface CouponFieldProps {
  subtotal: number;
  onApply: (coupon: CouponView) => void;
  onRemove: () => void;
  appliedCoupon: CouponView | null;
}

/**
 * Coupon code input with an async "Apply" action. Calls
 * POST /api/checkout/coupon to validate server-side without
 * submitting the full order, so the user sees the discount reflected
 * in the order summary before they place the order.
 */
export function CouponField({
  subtotal,
  onApply,
  onRemove,
  appliedCoupon,
}: CouponFieldProps) {
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  async function handleApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setError(null);
    setIsPending(true);

    try {
      const res = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, subtotal }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid coupon code.");
        return;
      }

      onApply(data.coupon as CouponView);
      setCode("");
    } catch {
      setError("Couldn't validate coupon. Check your connection.");
    } finally {
      setIsPending(false);
    }
  }

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between border border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-foreground/60" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {appliedCoupon.code}
            </p>
            {appliedCoupon.description && (
              <p className="text-xs text-muted-foreground">
                {appliedCoupon.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            −{formatCurrency(appliedCoupon.discountAmount, { isWholeUnit: true })}
          </span>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove coupon"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleApply();
            }
          }}
          placeholder="Coupon code"
          aria-label="Coupon code"
          className="h-10 flex-1 border border-input bg-background px-3 text-sm uppercase tracking-wider text-foreground placeholder:normal-case placeholder:tracking-normal focus:border-foreground focus:outline-none"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleApply}
          disabled={isPending || !code.trim()}
          className="h-10 rounded-none px-4"
        >
          {isPending ? "Checking…" : "Apply"}
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
