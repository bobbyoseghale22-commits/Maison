import { cn } from "@/lib/utils";

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  /** Optional right-side slot for a legend or value badge */
  aside?: React.ReactNode;
}

/**
 * Consistent border-box wrapper for every chart on the analytics
 * page. Title lives outside the SVG so it uses the font stack
 * naturally without SVG font fiddling.
 */
export function ChartPanel({
  title,
  subtitle,
  children,
  className,
  aside,
}: ChartPanelProps) {
  return (
    <div
      className={cn(
        "border border-border bg-background p-6 space-y-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg italic text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
      {children}
    </div>
  );
}
