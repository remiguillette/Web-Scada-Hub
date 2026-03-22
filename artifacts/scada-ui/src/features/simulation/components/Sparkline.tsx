import { useMemo } from "react";

function buildSparklinePath(
  values: number[],
  width: number,
  height: number,
  padding = 4,
): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStep = (width - padding * 2) / (values.length - 1);
  const points = values.map((v, i) => {
    const x = padding + i * xStep;
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M ${points.join(" L ")}`;
}

export function Sparkline({
  values,
  color,
  width = 260,
  height = 50,
}: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const path = useMemo(
    () => buildSparklinePath(values, width, height),
    [values, width, height],
  );
  const gradId = `sg-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      width={width}
      height={height}
      className="w-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {path && (
        <>
          <path
            d={`${path} L ${width - 4},${height} L 4,${height} Z`}
            fill={`url(#${gradId})`}
          />
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
