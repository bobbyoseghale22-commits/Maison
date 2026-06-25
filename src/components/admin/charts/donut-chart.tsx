import { cn } from "@/lib/utils";

interface DonutSlice {
  label: string;
  value: number;
  pct: number;
}

interface DonutChartProps {
  data: DonutSlice[];
  /** Total count shown in the centre hole */
  total?: number;
  centerLabel?: string;
  size?: number;
  className?: string;
}

// Design token shades — foreground at varying opacity levels so we
// stay monochrome rather than introducing arbitrary palette colours.
const SLICE_OPACITIES = [1, 0.65, 0.4, 0.25, 0.15, 0.1];

/**
 * Pure SVG donut chart — Server Component. Uses SVG `stroke-dasharray`
 * on a circle to draw each arc segment, the simplest approach for a
 * fixed-radius donut without trigonometry-heavy path building.
 */
export function DonutChart({
  data,
  total,
  centerLabel = "Total",
  size = 200,
  className,
}: DonutChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="mx-auto flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-full"
      >
        No data
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * 0.62; // 62% gives a comfortable hole
  const strokeW = outerR - innerR;
  const trackR = (outerR + innerR) / 2;
  const circumference = 2 * Math.PI * trackR;

  let cumulativePct = 0;
  // Start from the top (−90°)
  const START_OFFSET = circumference * 0.25;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Donut chart"
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={trackR}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeW}
        />

        {/* Segments */}
        {data.map((slice, i) => {
          const dashLen = (slice.pct / 100) * circumference;
          const dashOffset = START_OFFSET - cumulativePct * circumference;
          cumulativePct += slice.pct / 100;
          const opacity = SLICE_OPACITIES[i] ?? 0.08;

          return (
            <circle
              key={slice.label}
              cx={cx}
              cy={cy}
              r={trackR}
              fill="none"
              stroke={`hsl(var(--foreground))`}
              strokeWidth={strokeW}
              strokeOpacity={opacity}
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={dashOffset}
            >
              <title>
                {slice.label}: {slice.value} ({slice.pct}%)
              </title>
            </circle>
          );
        })}

        {/* Centre label */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize={Math.round(size * 0.15)}
          fontWeight="500"
          fill="hsl(var(--foreground))"
          fontFamily="var(--font-display, serif)"
          fontStyle="italic"
        >
          {total !== undefined ? total : ""}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize={10}
          fill="hsl(var(--muted-foreground))"
          fontFamily="var(--font-sans, sans-serif)"
        >
          {centerLabel}
        </text>
      </svg>

      {/* Legend */}
      <ul className="w-full space-y-1.5 text-sm">
        {data.map((slice, i) => {
          const opacity = SLICE_OPACITIES[i] ?? 0.08;
          return (
            <li key={slice.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{
                    backgroundColor: `hsl(var(--foreground) / ${opacity})`,
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <span className="truncate text-foreground/70 capitalize">
                  {slice.label}
                </span>
              </span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {slice.value}{" "}
                <span className="text-foreground/40">({slice.pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
