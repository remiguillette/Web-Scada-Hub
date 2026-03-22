import type { ReactNode } from "react";
import type { Translations } from "@/i18n/translations";
import { cn } from "@/lib/utils";
import type { MetricCardColor } from "../types";
import { Sparkline } from "./Sparkline";
import { StatusBadge } from "./StatusBadge";

export function MetricCard({
  label,
  value,
  unit,
  nominal,
  deviation,
  toleranceBand,
  inBand,
  icon,
  color,
  sparkValues,
  sparkColor,
  t,
}: {
  label: string;
  value: string;
  unit?: string;
  nominal: string;
  deviation: string;
  toleranceBand: string;
  inBand: boolean;
  icon: ReactNode;
  color: MetricCardColor;
  sparkValues: number[];
  sparkColor: string;
  t: Translations;
}) {
  const colorMap = {
    cyan: {
      border: "border-[#2a3a3a]",
      bg: "from-[#141a1a] to-[#1a2222]",
      text: "text-[#dff8ff]",
      accent: "text-[#00dcff]",
    },
    green: {
      border: "border-[#1a3a28]",
      bg: "from-[#0e160e] to-[#121a12]",
      text: "text-[#e8fff4]",
      accent: "text-[#00f7a1]",
    },
  };
  const c = colorMap[color];

  return (
    <div className={cn("rounded-2xl border bg-gradient-to-br p-4 flex flex-col gap-3", c.border, c.bg, c.text)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={c.accent}>{icon}</span>
          <span className="font-display text-xs uppercase tracking-[0.18em] text-[#8ca5bf]">
            {label}
          </span>
        </div>
        <StatusBadge ok={inBand} okLabel={t.inBand} faultLabel={t.outOfBand} />
      </div>
      <div className="flex items-end gap-2">
        <span className="font-mono text-5xl font-semibold tracking-[0.06em]">{value}</span>
        {unit ? <span className="pb-1 font-mono text-sm text-[#8ca5bf]">{unit}</span> : null}
      </div>
      <div className="h-[50px] overflow-hidden rounded-lg">
        <Sparkline values={sparkValues} color={sparkColor} />
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#1c2c40] bg-[#09111d] p-3">
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.nominal}</div>
          <div className="font-mono text-sm text-[#b8c6d9]">{nominal}{unit ? ` ${unit}` : ""}</div>
        </div>
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.deviation}</div>
          <div className={cn("font-mono text-sm", inBand ? "text-[#00f7a1]" : "text-[#ff4d5a]")}>{deviation}{unit ? ` ${unit}` : ""}</div>
        </div>
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.band}</div>
          <div className="font-mono text-sm text-[#b8c6d9]">{toleranceBand}{unit ? ` ${unit}` : ""}</div>
        </div>
      </div>
    </div>
  );
}
