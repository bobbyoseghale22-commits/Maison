import type { MonthlyPoint } from "@/lib/data/analytics";

interface SparklineProps {
  data: MonthlyPoint[];
  width?: number;
  height?: number;
  positive?: boolean;
}

/**
 * Minimal inline sparkline — a 32×16 SVG that shows the trend shape
 * without any labels or axes. Used inside metric stat cards to give
 * a visual at-a-glance without the real estate of a full chart.
 */
export function Sparkline({
  data,
  width = 64,
  height = 24,
  positive = true,
}: SparklineProps) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pad = 2;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const pts = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * innerW,
    y: pad + innerH - ((v - min) / range) * innerH,
  }));

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cx = (curr.x - prev.x) / 3;
    d += ` C ${prev.x + cx} ${prev.y}, ${curr.x - cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const strokeColor = positive
    ? "hsl(142 30% 30%)"  // --success
    : "hsl(4 64% 38%)";   // --destructive

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
    </svg>
  );
}
