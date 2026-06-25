"use client";

import Image from "next/image";
import { Tag } from "lucide-react";

import type { CartView } from "@/lib/data/cart";
import type { CheckoutTotals } from "@/lib/checkout-utils";
import { formatCurrency } from "@/lib/helpers";

interface OrderSummaryProps {
  cart: CartView;
  totals: CheckoutTotals;
}

/**
 * Right-column order summary — shows cart items, individual line
 * totals, and the full price breakdown including coupon discount,
 * shipping, and tax. Reactive to totals changing as the user applies
 * or removes a coupon without any extra data fetch.
 */
export function OrderSummary({ cart, totals }: OrderSummaryProps) {
  return (
    <div className="sticky top-28">
      <h2 className="font-display text-xl italic text-foreground">
        Order Summary
      </h2>

      {/* Item list */}
      <ul className="mt-6 divide-y divide-border border-y border-border">
        {cart.items.map((item) => (
          <li key={item.itemId} className="flex gap-4 py-4">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-secondary">
              {item.image ? (
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-xs italic text-foreground/25">
                  MN
                </div>
              )}
              {/* Quantity badge */}
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center bg-foreground text-[10px] font-medium text-background">
                {item.quantity}
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-0.5 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {item.name}
              </p>
              <p className="text-label text-foreground/50">
                {item.size} / {item.color}
              </p>
            </div>
            <p className="shrink-0 text-sm text-foreground">
              {formatCurrency(item.lineTotal, { isWholeUnit: true })}
            </p>
          </li>
        ))}
      </ul>

      {/* Price breakdown */}
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="text-foreground">
            {formatCurrency(totals.subtotal, { isWholeUnit: true })}
          </dd>
        </div>

        {totals.coupon && (
          <div className="flex justify-between text-foreground">
            <dt className="flex items-center gap-1.5">
              <Tag className="h-3 w-3" aria-hidden="true" />
              {totals.coupon.code}
            </dt>
            <dd>
              −{formatCurrency(totals.discount, { isWholeUnit: true })}
            </dd>
          </div>
        )}

        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="text-foreground">
            {totals.shippingCost === 0
              ? "Free"
              : formatCurrency(totals.shippingCost, { isWholeUnit: true })}
          </dd>
        </div>

        <div className="flex justify-between">
          <dt className="text-muted-foreground">Tax (estimated)</dt>
          <dd className="text-foreground">
            {formatCurrency(totals.tax, { isWholeUnit: true })}
          </dd>
        </div>

        <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
          <dt className="text-foreground">Total</dt>
          <dd className="text-foreground">
            {formatCurrency(totals.total, { isWholeUnit: true })}
          </dd>
        </div>
      </dl>
    </div>
  );
}
