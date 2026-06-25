import { cn } from "@/lib/utils";
import type { MonthlyPoint } from "@/lib/data/analytics";

interface BarChartProps {
  data: MonthlyPoint[];
  /** Format a value for the Y-axis labels and tooltips */
  formatValue?: (v: number) => string;
  height?: number;
  className?: string;
  /** Accent colour for bars — defaults to foreground */
  barColor?: string;
  yAxisLabel?: string;
}

const CHART_PADDING = { top: 20, right: 16, bottom: 44, left: 56 };

/**
 * Pure SVG bar chart — a Server Component with zero client JS.
 * Hover tooltips are implemented via CSS `title` elements (native
 * browser tooltip), keeping interactivity without hydration.
 *
 * Y-axis always starts at 0 and rounds up to a "nice" number so bar
 * proportions are visually honest.
 */
export function BarChart({
  data,
  formatValue = (v) => String(v),
  height = 280,
  className,
  barColor = "hsl(var(--foreground))",
  yAxisLabel,
}: BarChartProps) {
  if (data.length === 0) return <EmptyChart height={height} />;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const niceMax = niceNumber(maxValue);

  const svgWidth = 600; // viewBox units — scales to container
  const innerW = svgWidth - CHART_PADDING.left - CHART_PADDING.right;
  const innerH = height - CHART_PADDING.top - CHART_PADDING.bottom;

  const barGap = 6;
  const barW = Math.max(8, innerW / data.length - barGap);

  // Y-axis grid lines
  const gridLines = 4;
  const yTicks = Array.from({ length: gridLines + 1 }, (_, i) =>
    Math.round((niceMax / gridLines) * i),
  );

  function barX(i: number) {
    return CHART_PADDING.left + i * (innerW / data.length) + (innerW / data.length - barW) / 2;
  }

  function barY(value: number) {
    return CHART_PADDING.top + innerH - (value / niceMax) * innerH;
  }

  function barH(value: number) {
    return (value / niceMax) * innerH;
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <svg
        viewBox={`0 0 ${svgWidth} ${height}`}
        className="w-full"
        role="img"
        aria-label="Bar chart"
      >
        {/* Y-axis grid + labels */}
        {yTicks.map((tick) => {
          const y = CHART_PADDING.top + innerH - (tick / niceMax) * innerH;
          return (
            <g key={tick}>
              <line
                x1={CHART_PADDING.left}
                x2={CHART_PADDING.left + innerW}
                y1={y}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth={1}
              />
              <text
                x={CHART_PADDING.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                fill="hsl(var(--muted-foreground))"
                fontFamily="var(--font-sans, sans-serif)"
              >
                {formatValue(tick)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = barX(i);
          const bh = barH(d.value);
          const by = barY(d.value);

          return (
            <g key={d.label}>
              {/* Zero-height bars still show a 1px line */}
              <rect
                x={x}
                y={bh < 1 ? by - 1 : by}
                width={barW}
                height={Math.max(bh, 1)}
                fill={barColor}
                opacity={0.85}
                rx={1}
              >
                <title>{`${d.label}: ${formatValue(d.value)}`}</title>
              </rect>

              {/* X-axis label */}
              <text
                x={x + barW / 2}
                y={height - CHART_PADDING.bottom + 16}
                textAnchor="middle"
                fontSize={10}
                fill="hsl(var(--muted-foreground))"
                fontFamily="var(--font-sans, sans-serif)"
              >
                {d.month}
              </text>
            </g>
          );
        })}

        {/* Y-axis line */}
        <line
          x1={CHART_PADDING.left}
          x2={CHART_PADDING.left}
          y1={CHART_PADDING.top}
          y2={CHART_PADDING.top + innerH}
          stroke="hsl(var(--border))"
          strokeWidth={1}
        />

        {/* Optional Y-axis label */}
        {yAxisLabel && (
          <text
            x={14}
            y={CHART_PADDING.top + innerH / 2}
            textAnchor="middle"
            fontSize={10}
            fill="hsl(var(--muted-foreground))"
            fontFamily="var(--font-sans, sans-serif)"
            transform={`rotate(-90, 14, ${CHART_PADDING.top + innerH / 2})`}
          >
            {yAxisLabel}
          </text>
        )}
      </svg>
    </div>
  );
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border"
    >
      No data yet
    </div>
  );
}

/** Rounds a value up to the nearest "nice" number for chart axes. */
function niceNumber(value: number): number {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const residual = value / magnitude;
  if (residual <= 1) return magnitude;
  if (residual <= 2) return 2 * magnitude;
  if (residual <= 5) return 5 * magnitude;
  return 10 * magnitude;
}
