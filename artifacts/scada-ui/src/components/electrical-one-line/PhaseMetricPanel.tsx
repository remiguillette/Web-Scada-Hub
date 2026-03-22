import { memo } from "react";
import { cn } from "@/lib/utils";

type PhaseMetricPanelProps = {
  label: string;
  line1: string;
  line2: string;
  color: string;
  compact?: boolean;
  className?: string;
};

export const PhaseMetricPanel = memo(function PhaseMetricPanel({
  label,
  line1,
  line2,
  color,
  compact = false,
  className,
}: PhaseMetricPanelProps) {
  const lines = [label, line1, line2];

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-1 font-mono text-center",
        compact ? "max-w-[260px]" : "",
        className,
      )}
    >
      <div
        className="flex min-w-[48px] flex-col items-center"
        style={{
          color,
          textShadow: "none",
        }}
      >
        {lines.map((line, lineIndex) => {
          const lineClassName =
            lineIndex === 0
              ? "text-[8px] font-semibold tracking-[0.14em] whitespace-nowrap"
              : lineIndex === 1
                ? "text-[7px] tracking-[0.08em] whitespace-nowrap"
                : "text-[6px] tracking-[0.08em] opacity-70 whitespace-nowrap";

          return (
            <span
              key={`${label}-${line}-${lineIndex}`}
              className={lineClassName}
            >
              {line}
            </span>
          );
        })}
      </div>
    </div>
  );
});
