import { Zap } from "lucide-react";
import type { Translations } from "@/i18n/translations";
import { cn } from "@/lib/utils";
import type { SimulationTableRow } from "../types";

export function ElecDataCard({
  tag,
  title,
  subtitle,
  status,
  energized,
  rows,
  t,
}: {
  tag: string;
  title: string;
  subtitle?: string;
  status: string;
  energized: boolean;
  rows: SimulationTableRow[];
  t: Translations;
}) {
  return (
    <div className={cn("rounded-2xl border p-4", energized ? "border-[#00dcff]/30 bg-gradient-to-br from-[#0d1a1e] to-[#0a1318]" : "border-[#2a2a2a] bg-[#111]")}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-[#5a7a8a]">{tag}</div>
          <div className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-white">{title}</div>
          {subtitle ? <div className="mt-0.5 font-mono text-[11px] tracking-[0.1em] text-[#6a8a9f]">{subtitle}</div> : null}
          <div className={cn("mt-1.5 inline-block rounded border px-2 py-0.5 font-mono text-[10px] tracking-[0.18em]", energized ? "border-[#00f7a1]/30 bg-[#00f7a1]/10 text-[#00f7a1]" : "border-[#334155]/60 bg-[#1a1a1a] text-[#475569]")}>{status}</div>
        </div>
        <Zap className={cn("h-5 w-5 shrink-0", energized ? "text-[#00dcff]" : "text-[#334155]")} />
      </div>
      <div className="overflow-hidden rounded-xl border border-white/8">
        <table className="w-full border-collapse text-left font-mono text-[11px]">
          <thead className="bg-white/5 text-[#7f93ac]">
            <tr>
              <th className="px-3 py-2 font-medium tracking-[0.1em]">{t.utility.details.table.parameter}</th>
              <th className="px-3 py-2 font-medium tracking-[0.1em]">{t.utility.details.table.unit}</th>
              <th className="hidden px-3 py-2 font-medium tracking-[0.1em] sm:table-cell">{t.utility.details.table.description}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.parameter} className="border-t border-white/6 align-top hover:bg-white/3">
                <td className="px-3 py-2 text-[#cfd8e3]">{row.parameter}</td>
                <td className={cn("px-3 py-2 font-semibold", energized ? "text-[#8ecae6]" : "text-[#475569]")}>{row.value}</td>
                <td className="hidden px-3 py-2 text-[#6a8a9f] sm:table-cell">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
