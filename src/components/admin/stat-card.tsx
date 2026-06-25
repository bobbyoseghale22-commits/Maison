import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
  /** Optional slot — used by the analytics page to embed a Sparkline. */
  children?: React.ReactNode;
}

/**
 * Metric tile used on the admin dashboard. Accepts an optional trend
 * string (e.g. "+12% vs last month") so the caller controls the
 * calculation; the card is purely presentational.
 */
export function StatCard({ label, value, sub, trend, className, children }: StatCardProps) {
  return (
    <div
      className={cn(
        "border border-border bg-background p-6 space-y-2",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-label text-foreground/50">{label}</p>
        {children}
      </div>
      <p className="font-display text-3xl italic text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      {trend && (
        <p
          className={cn(
            "text-xs font-medium",
            trend.positive ? "text-green-700" : "text-destructive",
          )}
        >
          {trend.value}
        </p>
      )}
    </div>
  );
}
