"use client";

import * as React from "react";
import { toast } from "sonner";
import type { WishlistView } from "@/lib/data/wishlist";

/**
 * useWishlist — wishlist state for the client, backed by /api/wishlist.
 * Mirrors useCart in src/hooks/use-cart.ts: lazy load (only fetches
 * when ensureLoaded() is called), optimistic removes, shared via
 * WishlistProvider context so the header badge and the wishlist page
 * share a single instance.
 */

type WishlistState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; wishlist: WishlistView }
  | { status: "error" };

export interface UseWishlistReturn {
  wishlist: WishlistView | null;
  isLoading: boolean;
  isMutating: boolean;
  addItem: (productId: string) => Promise<boolean>;
  removeItem: (productId: string) => Promise<boolean>;
  moveToCart: (input: {
    productId: string;
    size: string;
    color: string;
    quantity: number;
  }) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  ensureLoaded: () => void;
  refresh: () => Promise<void>;
}

const WishlistContext = React.createContext<UseWishlistReturn | null>(null);

function emptyView(): WishlistView {
  return { items: [], itemCount: 0 };
}

// ---------------------------------------------------------------------------
// The actual hook — used inside WishlistProvider only
// ---------------------------------------------------------------------------

function useWishlistState(): UseWishlistReturn {
  const [state, setState] = React.useState<WishlistState>({ status: "idle" });
  const [isMutating, setIsMutating] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/wishlist", { cache: "no-store" });
      if (res.status === 401) {
        // Not signed in — treat as an empty wishlist, not an error.
        setState({ status: "ready", wishlist: emptyView() });
        return;
      }
      if (!res.ok) throw new Error("fetch failed");
      const data: WishlistView = await res.json();
      setState({ status: "ready", wishlist: data });
    } catch {
      setState({ status: "error" });
    }
  }, []);

  // Lazy-load: only fetch when a component signals it needs the data
  // (e.g. WishlistSheet opening). This avoids an extra /api/wishlist
  // fetch on every page load for unauthenticated visitors.
  const ensureLoaded = React.useCallback(() => {
    setState((prev) => {
      if (prev.status === "idle") {
        // Trigger async refresh, but setState callback must be synchronous
        // so we fire-and-forget it via a microtask.
        Promise.resolve().then(refresh);
      }
      return prev;
    });
  }, [refresh]);

  const addItem = React.useCallback(async (productId: string): Promise<boolean> => {
    setIsMutating(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.status === 401) {
        toast.error("Please sign in to save items to your wishlist.");
        return false;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "" })) as { error?: string };
        toast.error(d.error ?? "Couldn't save item.");
        return false;
      }
      const wishlist: WishlistView = await res.json();
      setState({ status: "ready", wishlist });
      return true;
    } catch {
      toast.error("Couldn't save item. Check your connection.");
      return false;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const removeItem = React.useCallback(async (productId: string): Promise<boolean> => {
    // Optimistic remove
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      const items = prev.wishlist.items.filter((i) => i.productId !== productId);
      return { status: "ready", wishlist: { items, itemCount: items.length } };
    });

    setIsMutating(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        await refresh(); // roll back
        return false;
      }
      const wishlist: WishlistView = await res.json();
      setState({ status: "ready", wishlist });
      return true;
    } catch {
      await refresh();
      return false;
    } finally {
      setIsMutating(false);
    }
  }, [refresh]);

  const moveToCart = React.useCallback(async (input: {
    productId: string;
    size: string;
    color: string;
    quantity: number;
  }): Promise<boolean> => {
    setIsMutating(true);
    try {
      const res = await fetch(`/api/wishlist/${input.productId}/move-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: input.size,
          color: input.color,
          quantity: input.quantity,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "" })) as { error?: string };
        toast.error(d.error ?? "Couldn't move item to cart.");
        return false;
      }
      const { wishlist } = await res.json() as { wishlist: WishlistView };
      setState({ status: "ready", wishlist });
      toast.success("Moved to cart");
      return true;
    } catch {
      toast.error("Couldn't move item. Check your connection.");
      return false;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const isInWishlist = React.useCallback((productId: string): boolean => {
    if (state.status !== "ready") return false;
    return state.wishlist.items.some((i) => i.productId === productId);
  }, [state]);

  return {
    wishlist: state.status === "ready" ? state.wishlist : null,
    isLoading: state.status === "loading",
    isMutating,
    addItem,
    removeItem,
    moveToCart,
    isInWishlist,
    ensureLoaded,
    refresh,
  };
}

// ---------------------------------------------------------------------------
// Provider + consumer
// ---------------------------------------------------------------------------

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const value = useWishlistState();
  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlistContext(): UseWishlistReturn {
  const ctx = React.useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlistContext must be used within <WishlistProvider>");
  }
  return ctx;
}
