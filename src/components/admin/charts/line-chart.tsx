import { cn } from "@/lib/utils";
import type { MonthlyPoint } from "@/lib/data/analytics";

interface LineChartProps {
  data: MonthlyPoint[];
  formatValue?: (v: number) => string;
  height?: number;
  className?: string;
  /** Fill the area under the line */
  filled?: boolean;
  strokeColor?: string;
  fillColor?: string;
}

const PAD = { top: 20, right: 16, bottom: 44, left: 56 };
const SVG_W = 600;
const GRID_LINES = 4;

/**
 * Pure SVG line chart with optional area fill — Server Component.
 * Uses a cubic bezier spline for a smooth curve rather than straight
 * line segments, making it read as continuous trend data rather than
 * discrete values.
 */
export function LineChart({
  data,
  formatValue = (v) => String(v),
  height = 280,
  className,
  filled = true,
  strokeColor = "hsl(var(--foreground))",
  fillColor = "hsl(var(--foreground) / 0.06)",
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border"
      >
        No data yet
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const niceMax = niceNumber(maxValue);

  const innerW = SVG_W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const yTicks = Array.from({ length: GRID_LINES + 1 }, (_, i) =>
    Math.round((niceMax / GRID_LINES) * i),
  );

  // Map data point → SVG coordinates
  function ptX(i: number) {
    return PAD.left + (i / (data.length - 1)) * innerW;
  }
  function ptY(value: number) {
    return PAD.top + innerH - (value / niceMax) * innerH;
  }

  // Build a smooth cubic-bezier polyline from adjacent midpoints
  const points = data.map((d, i) => ({ x: ptX(i), y: ptY(d.value) }));

  function buildPath(): string {
    if (points.length === 1) {
      const p = points[0];
      return `M ${p.x} ${p.y}`;
    }
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      // Control points at 1/3 of the horizontal distance
      const cx = (p1.x - p0.x) / 3;
      d += ` C ${p0.x + cx} ${p0.y}, ${p1.x - cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }

  const linePath = buildPath();

  // Area path: line path + closing vertical + horizontal back to start
  const areaPath =
    `${linePath} ` +
    `L ${points[points.length - 1].x} ${PAD.top + innerH} ` +
    `L ${points[0].x} ${PAD.top + innerH} Z`;

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <svg
        viewBox={`0 0 ${SVG_W} ${height}`}
        className="w-full"
        role="img"
        aria-label="Line chart"
      >
        {/* Y-axis grid + labels */}
        {yTicks.map((tick) => {
          const y = PAD.top + innerH - (tick / niceMax) * innerH;
          return (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={y}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
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

        {/* Area fill */}
        {filled && (
          <path d={areaPath} fill={fillColor} />
        )}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points + labels */}
        {points.map((pt, i) => (
          <g key={data[i].label}>
            <circle cx={pt.x} cy={pt.y} r={3} fill={strokeColor}>
              <title>{`${data[i].label}: ${formatValue(data[i].value)}`}</title>
            </circle>
            {/* X-axis label — only show every other label when crowded */}
            {(data.length <= 7 || i % 2 === 0 || i === data.length - 1) && (
              <text
                x={pt.x}
                y={height - PAD.bottom + 16}
                textAnchor="middle"
                fontSize={10}
                fill="hsl(var(--muted-foreground))"
                fontFamily="var(--font-sans, sans-serif)"
              >
                {data[i].month}
              </text>
            )}
          </g>
        ))}

        {/* Y-axis line */}
        <line
          x1={PAD.left}
          x2={PAD.left}
          y1={PAD.top}
          y2={PAD.top + innerH}
          stroke="hsl(var(--border))"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}

function niceNumber(value: number): number {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const residual = value / magnitude;
  if (residual <= 1) return magnitude;
  if (residual <= 2) return 2 * magnitude;
  if (residual <= 5) return 5 * magnitude;
  return 10 * magnitude;
}
