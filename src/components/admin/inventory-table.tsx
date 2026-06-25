"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AdminProductDetail } from "@/lib/data/admin-products";

interface InventoryTableProps {
  product: AdminProductDetail;
}

/**
 * Inline stock editing table. Each row is one variant; clicking the
 * stock cell turns it into an input. On blur / Enter, a PATCH request
 * is fired to the inventory API and the row confirms visually.
 *
 * Deliberately does NOT use react-hook-form — this is a quick
 * cell-by-cell editor, not a full form. Each update is independent.
 */
export function InventoryTable({ product }: InventoryTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function handleStockChange(variantId: string, newStock: number) {
    if (newStock < 0 || !Number.isInteger(newStock)) return;

    setPendingId(variantId);
    try {
      const res = await fetch(
        `/api/admin/products/${product.id}/inventory`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId, stock: newStock }),
        },
      );

      if (!res.ok) {
        const d = await res.json() as { error?: string };
        toast.error(d.error ?? "Failed to update stock.");
        return;
      }

      toast.success("Stock updated.");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {["SKU", "Size", "Color", "Price Override", "Stock"].map((h) => (
              <th
                key={h}
                className="py-3 pr-4 text-left text-label text-foreground/50 font-normal"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {product.variants.map((variant) => {
            const isPending = pendingId === variant.id;
            return (
              <tr
                key={variant.id}
                className="border-b border-border last:border-b-0"
              >
                <td className="py-3 pr-4">
                  <code className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5">
                    {variant.sku}
                  </code>
                </td>
                <td className="py-3 pr-4 text-foreground">{variant.size}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    {variant.colorHex && (
                      <span
                        className="h-4 w-4 rounded-full border border-border shrink-0"
                        style={{ backgroundColor: variant.colorHex }}
                      />
                    )}
                    <span className="text-foreground">{variant.color}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {variant.priceOverride
                    ? `$${variant.priceOverride.toFixed(2)}`
                    : "—"}
                </td>
                <td className="py-3 pr-4">
                  <StockCell
                    variantId={variant.id}
                    currentStock={variant.stock}
                    isPending={isPending}
                    onCommit={handleStockChange}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <td
              colSpan={4}
              className="py-3 pr-4 text-label text-foreground/50"
            >
              Total Stock
            </td>
            <td className="py-3 font-medium text-foreground">
              {product.totalStock}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

interface StockCellProps {
  variantId: string;
  currentStock: number;
  isPending: boolean;
  onCommit: (variantId: string, newStock: number) => Promise<void>;
}

function StockCell({
  variantId,
  currentStock,
  isPending,
  onCommit,
}: StockCellProps) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(String(currentStock));
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keep display in sync with server refreshes
  React.useEffect(() => {
    if (!editing) setValue(String(currentStock));
  }, [currentStock, editing]);

  function startEdit() {
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function commit() {
    setEditing(false);
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed === currentStock) {
      setValue(String(currentStock));
      return;
    }
    await onCommit(variantId, Math.max(0, parsed));
  }

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">{currentStock}</span>
      </div>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); void commit(); }
          if (e.key === "Escape") { setEditing(false); setValue(String(currentStock)); }
        }}
        className="h-8 w-24 border border-foreground bg-background px-2 text-sm text-foreground focus:outline-none"
        autoFocus
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className={cn(
        "flex items-center gap-2 rounded px-2 py-1 text-sm font-medium transition-colors hover:bg-secondary",
        currentStock === 0 ? "text-destructive" : "text-foreground",
      )}
      title="Click to edit stock"
    >
      {currentStock}
      <span className="text-label text-foreground/30">edit</span>
    </button>
  );
}
