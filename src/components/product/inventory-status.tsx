import { cn } from "@/lib/utils";

interface InventoryStatusProps {
  /** Stock for the currently selected size/color combo — `null` until both are chosen. */
  stock: number | null;
  className?: string;
}

const LOW_STOCK_THRESHOLD = 5;

/**
 * Stock indicator for the currently-selected variant. Three states:
 * no selection yet (neutral prompt), low stock (urgency, exact count
 * shown), and in stock (quiet confirmation, no exact count — showing
 * "47 in stock" reads like an arbitrary, untrustworthy number, while
 * "only 2 left" is genuinely useful information).
 */
export function InventoryStatus({ stock, className }: InventoryStatusProps) {
  if (stock === null) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Select a size and color to check availability.
      </p>
    );
  }

  if (stock <= 0) {
    return (
      <p
        role="status"
        className={cn("text-sm font-medium text-destructive", className)}
      >
        Out of stock in this size and color.
      </p>
    );
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <p
        role="status"
        className={cn("text-sm font-medium text-destructive", className)}
      >
        Only {stock} left in stock.
      </p>
    );
  }

  return (
    <p role="status" className={cn("text-sm text-foreground/70", className)}>
      In stock.
    </p>
  );
}
