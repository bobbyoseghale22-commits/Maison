"use client";

import * as React from "react";
import { useCartContext } from "@/hooks/use-cart";

/**
 * Fires once on mount to clear the cart after a successful payment.
 * Calls DELETE /api/cart then refreshes the client cart state so the
 * cart icon empties immediately without waiting for the Stripe webhook.
 */
export function ClearCartEffect() {
  const { refresh } = useCartContext();

  React.useEffect(() => {
    fetch("/api/cart", { method: "DELETE" })
      .finally(() => { void refresh(); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
