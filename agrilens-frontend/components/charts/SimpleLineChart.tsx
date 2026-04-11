"use client";

type Point = { label: string; value: number };

type Props = {
  data: Point[];
  height?: number;
  strokeClassName?: string;
};

/**
 * Dependency-free line chart (SVG). Avoids bundler resolution issues when
 * the app root differs from agrilens-frontend (e.g. monorepo lockfile confusion).
 */
export function SimpleLineChart({
  data,
  height = 260,
  strokeClassName = "stroke-primary",
}: Props) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
        style={{ height }}
      >
        No data for this range
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const max = Math.max(1, ...values);
  const w = 600;
  const pad = { top: 12, right: 12, bottom: 28, left: 36 };
  const innerW = w - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const n = data.length;
  const step = n > 1 ? innerW / (n - 1) : innerW;

  const points = data.map((d, i) => {
    const x = pad.left + i * step;
    const y = pad.top + innerH - (d.value / max) * innerH;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  const yTicks = [0, Math.ceil(max / 2), max];

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      className="w-full h-auto text-foreground"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Line chart of values over time"
    >
      <rect width={w} height={height} fill="transparent" />
      {yTicks.map((t) => {
        const y = pad.top + innerH - (t / max) * innerH;
        return (
          <g key={t}>
            <line
              x1={pad.left}
              x2={w - pad.right}
              y1={y}
              y2={y}
              className="stroke-border"
              strokeWidth={0.5}
              strokeDasharray="4 4"
            />
            <text x={4} y={y + 4} className="fill-muted-foreground text-[10px]">
              {t}
            </text>
          </g>
        );
      })}
      <path
        d={pathD}
        fill="none"
        className={strokeClassName}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((d, i) => {
        const x = pad.left + i * step;
        const y = pad.top + innerH - (d.value / max) * innerH;
        return (
          <circle key={d.label + i} cx={x} cy={y} r={3} className="fill-primary" />
        );
      })}
      {data.map((d, i) => {
        if (i % Math.ceil(n / 8) !== 0 && i !== n - 1) return null;
        const x = pad.left + i * step;
        return (
          <text
            key={`lbl-${d.label}`}
            x={x}
            y={height - 8}
            textAnchor="middle"
            className="fill-muted-foreground text-[9px]"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
