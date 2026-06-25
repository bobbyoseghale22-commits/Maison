"use client";

import * as React from "react";
import { toast } from "sonner";
import type { CartView } from "@/lib/data/cart";

type CartState =
  | { status: "loading" }
  | { status: "ready"; cart: CartView }
  | { status: "error" };

interface UseCartReturn {
  cart: CartView | null;
  isLoading: boolean;
  /** Adds an item; returns false and shows a toast on failure. */
  addItem: (input: {
    productId: string;
    size: string;
    color: string;
    quantity: number;
  }) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  /** Call immediately after sign-in to fold the guest cart into the user's. */
  mergeAfterSignIn: () => Promise<void>;
  /** Re-fetches the cart from the server. */
  refresh: () => Promise<void>;
}

const EMPTY_CART: CartView = {
  cartId: null as unknown as string,
  isGuest: true,
  items: [],
  itemCount: 0,
  subtotal: 0,
};

/**
 * useCart — global cart state for the client side. Backed by the
 * /api/cart route family; mutations are optimistically-reflected then
 * reconciled with the server response. Exposes typed helpers that
 * components call directly, so no component ever constructs a raw
 * fetch() URL itself.
 *
 * Usage:
 *   const { cart, addItem, removeItem, updateQuantity } = useCart();
 */
export function useCart(): UseCartReturn {
  const [state, setState] = React.useState<CartState>({ status: "loading" });

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const data: CartView = await res.json();
      setState({ status: "ready", cart: data });
    } catch {
      setState({ status: "error" });
    }
  }, []);

  // Load cart on first mount.
  React.useEffect(() => { refresh(); }, [refresh]);

  const addItem = React.useCallback(
    async (input: {
      productId: string;
      size: string;
      color: string;
      quantity: number;
    }): Promise<boolean> => {
      try {
        const res = await fetch("/api/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: "Failed to add item." }));
          toast.error(error ?? "Couldn't add to cart.");
          return false;
        }

        const cart: CartView = await res.json();
        setState({ status: "ready", cart });
        return true;
      } catch {
        toast.error("Couldn't add to cart. Check your connection.");
        return false;
      }
    },
    [],
  );

  const updateQuantity = React.useCallback(
    async (itemId: string, quantity: number) => {
      // Optimistic update
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        const items = prev.cart.items.map((item) =>
          item.itemId === itemId ? { ...item, quantity, lineTotal: item.unitPrice * quantity } : item,
        );
        const itemCount = items.reduce((n, i) => n + i.quantity, 0);
        const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);
        return { status: "ready", cart: { ...prev.cart, items, itemCount, subtotal } };
      });

      try {
        const res = await fetch(`/api/cart/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });
        if (res.ok) {
          const cart: CartView = await res.json();
          setState({ status: "ready", cart });
        } else {
          // Roll back
          await refresh();
        }
      } catch {
        await refresh();
      }
    },
    [refresh],
  );

  const removeItem = React.useCallback(
    async (itemId: string) => {
      // Optimistic update
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        const items = prev.cart.items.filter((i) => i.itemId !== itemId);
        const itemCount = items.reduce((n, i) => n + i.quantity, 0);
        const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);
        return { status: "ready", cart: { ...prev.cart, items, itemCount, subtotal } };
      });

      try {
        const res = await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
        if (res.ok) {
          const cart: CartView = await res.json();
          setState({ status: "ready", cart });
        } else {
          await refresh();
        }
      } catch {
        await refresh();
      }
    },
    [refresh],
  );

  const mergeAfterSignIn = React.useCallback(async () => {
    try {
      await fetch("/api/cart/merge", { method: "POST" });
      await refresh();
    } catch {
      // non-fatal — the cart will reconcile on the next page load
    }
  }, [refresh]);

  const cart =
    state.status === "ready" ? state.cart : state.status === "loading" ? null : EMPTY_CART;

  return {
    cart,
    isLoading: state.status === "loading",
    addItem,
    updateQuantity,
    removeItem,
    mergeAfterSignIn,
    refresh,
  };
}

// ---------------------------------------------------------------------------
// Shared context — lets CartSheet and AddToCartButton share one cart
// instance without double-fetching.
// ---------------------------------------------------------------------------

const CartContext = React.createContext<UseCartReturn | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}

export function useCartContext(): UseCartReturn {
  const ctx = React.useContext(CartContext);
  if (!ctx) {
    throw new Error("useCartContext must be used within <CartProvider>");
  }
  return ctx;
}
