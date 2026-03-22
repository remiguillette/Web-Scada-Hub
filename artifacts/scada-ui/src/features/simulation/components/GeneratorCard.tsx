import { Link } from "wouter";
import { Power, Zap } from "lucide-react";
import { LED } from "@/components/LED";
import { SYSTEM } from "@/config/system";
import type { Translations } from "@/i18n/translations";
import { cn } from "@/lib/utils";
import type { GenStateConfig, RampPhase, SimulationTableRow } from "../types";
import type { GenState, GeneratorLiveStatus } from "../state";
import { Sparkline } from "./Sparkline";

function getGenStateConfig(t: Translations): Record<GenState, GenStateConfig> {
  return {
    OFFLINE: { border: "border-[#2a2a2a]", bg: "bg-[#0f0f0f]", badgeText: t.genStateOffline, badgeStyle: "border-[#334155]/60 bg-[#1a1a1a] text-[#475569]", ledColor: "cyan", ledOn: false },
    STARTING: { border: "border-[#ffb347]/30", bg: "bg-gradient-to-br from-[#1e1206] to-[#141008]", badgeText: t.genStateStarting, badgeStyle: "border-[#ffb347]/40 bg-[#ffb347]/10 text-[#ffb347]", ledColor: "amber", ledOn: true },
    STABILIZING: { border: "border-[#00dcff]/30", bg: "bg-gradient-to-br from-[#08161d] to-[#0a1119]", badgeText: t.genStateStabilizing, badgeStyle: "border-[#00dcff]/40 bg-[#00dcff]/10 text-[#00dcff]", ledColor: "cyan", ledOn: true },
    READY: { border: "border-[#00f7a1]/30", bg: "bg-gradient-to-br from-[#0e1a10] to-[#0a140c]", badgeText: t.genStateAvailable, badgeStyle: "border-[#00f7a1]/40 bg-[#00f7a1]/10 text-[#00f7a1]", ledColor: "green", ledOn: true },
    LOADED: { border: "border-[#ffd166]/35", bg: "bg-gradient-to-br from-[#1e1808] to-[#161006]", badgeText: t.genStateOnBus, badgeStyle: "border-[#ffd166]/40 bg-[#ffd166]/10 text-[#ffd166]", ledColor: "amber", ledOn: true },
    STOPPING: { border: "border-[#ffb347]/30", bg: "bg-gradient-to-br from-[#1e1206] to-[#141008]", badgeText: t.genStateStopping, badgeStyle: "border-[#ffb347]/40 bg-[#ffb347]/10 text-[#ffb347]", ledColor: "amber", ledOn: true },
  };
}

const RAMP_PHASES: RampPhase[] = [
  { key: "phaseCranking", label: "CRANKING", threshold: 0.2 },
  { key: "phaseBuildingVoltage", label: "BUILDING VOLTAGE", threshold: 0.55 },
  { key: "phaseReachingRatedSpeed", label: "REACHING RATED SPEED", threshold: 0.88 },
  { key: "phaseReadyForAts", label: "READY FOR ATS TRANSFER", threshold: 1.0 },
];

export function GeneratorCard({ genIdx, status, onStart, onStop, t }: { genIdx: number; status: GeneratorLiveStatus; onStart: () => void; onStop: () => void; t: Translations; }) {
  const gen = SYSTEM.generators[genIdx];
  const cfg = getGenStateConfig(t)[status.state];
  const isTransitioning = status.state === "STARTING" || status.state === "STABILIZING" || status.state === "STOPPING";
  const isReady = status.state === "READY";
  const isLoaded = status.state === "LOADED";
  const isAvailable = isReady || isLoaded;
  const isOffline = status.state === "OFFLINE";
  const isStopping = status.state === "STOPPING";

  const translatedRows: SimulationTableRow[] = [
    { parameter: t.frequency, value: status.state !== "OFFLINE" ? `${status.frequency.toFixed(2)} Hz` : `${gen.nominalFrequency.toFixed(2)} Hz (nominal)`, description: isAvailable ? t.genLiveFreqDesc : t.genNominalFreqDesc },
    { parameter: t.voltage, value: status.state !== "OFFLINE" ? `${status.voltage.toFixed(1)} V` : `${gen.nominalVoltage} V (nominal)`, description: isAvailable ? t.genLiveVoltageDesc : t.genNominalVoltageDesc },
    { parameter: t.current, value: `${status.current.toFixed(2)} A`, description: isAvailable ? t.genLiveCurrentDesc : t.genOfflineCurrentDesc },
    { parameter: t.activePower, value: `${status.activePower.toFixed(1)} W`, description: isAvailable ? t.genEmergencyPowerDesc : t.genZeroWhileOffline },
    { parameter: t.reactivePower, value: `${status.reactivePower.toFixed(1)} VAR`, description: t.genReactiveDesc },
    { parameter: t.fuelLevel, value: `${gen.fuelLevel}%`, description: t.genFuelDesc },
  ];

  return (
    <div className={cn("rounded-2xl border p-4 flex flex-col gap-4 transition-all duration-500", cfg.border, cfg.bg)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <LED on={cfg.ledOn} color={cfg.ledColor} size="md" />
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] text-[#5a7a8a]">{gen.tag}</div>
            <div className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">{gen.name}</div>
            <div className={cn("mt-1 inline-block rounded border px-2 py-0.5 font-mono text-[10px] tracking-[0.18em]", cfg.badgeStyle)}>
              {(() => {
                const rampPhase = RAMP_PHASES.find((p) => p.label === status.phaseLabel);
                return rampPhase ? t[rampPhase.key] : cfg.badgeText;
              })()}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="font-mono text-[10px] tracking-[0.18em] text-[#5a7a8a]">{t.fuel} {gen.fuelLevel}%</div>
          {isOffline ? <button type="button" onClick={onStart} className="flex items-center gap-1.5 rounded-xl border border-[#00f7a1]/40 bg-[#00f7a1]/10 px-3 py-1.5 font-display text-xs tracking-[0.14em] text-[#00f7a1] transition hover:bg-[#00f7a1]/20"><Power className="h-3 w-3" /> {t.start}</button> : null}
          {isAvailable ? <button type="button" onClick={onStop} className="flex items-center gap-1.5 rounded-xl border border-[#ff4d5a]/40 bg-[#ff4d5a]/10 px-3 py-1.5 font-display text-xs tracking-[0.14em] text-[#ff4d5a] transition hover:bg-[#ff4d5a]/20"><Power className="h-3 w-3" /> {t.stop}</button> : null}
          {isTransitioning ? <span className="rounded-xl border border-[#ffb347]/30 bg-[#ffb347]/8 px-3 py-1.5 font-display text-xs tracking-[0.14em] text-[#ffb347]/60">{isStopping ? t.stoppingEllipsis : t.startingEllipsis}</span> : null}
        </div>
      </div>

      {isTransitioning ? <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {RAMP_PHASES.map((phase, i) => {
              const prevThreshold = i === 0 ? 0 : RAMP_PHASES[i - 1].threshold;
              const reached = isStopping ? 1 - status.progress <= phase.threshold : status.progress >= prevThreshold;
              const active = status.phaseLabel === phase.label;
              return <span key={phase.label} className={cn("rounded px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] transition-all duration-300", active ? "bg-[#ffb347]/25 text-[#ffb347]" : reached ? "text-[#4a6a5a]" : "text-[#2a3a3a]")}>{t[phase.key]}</span>;
            })}
          </div>
          <span className="shrink-0 font-mono text-[10px] text-[#ffb347]">{(status.progress * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#1a1a1a]"><div className={cn("h-full rounded-full transition-all duration-200", isStopping ? "bg-gradient-to-r from-[#ffb347] to-[#ff4d5a]" : "bg-gradient-to-r from-[#00dcff] to-[#00f7a1]")} style={{ width: `${status.progress * 100}%` }} /></div>
      </div> : null}

      {(isTransitioning || isAvailable) && status.voltageHistory.length > 1 ? <div className="h-[50px] overflow-hidden rounded-xl border border-white/6 bg-black/20"><Sparkline values={status.voltageHistory} color={isAvailable ? "#00f7a1" : "#ffb347"} height={50} /></div> : null}

      <div className="overflow-hidden rounded-xl border border-white/8">
        <table className="w-full border-collapse text-left font-mono text-[11px]">
          <thead className="bg-white/5 text-[#7f93ac]">
            <tr>
              <th className="px-3 py-1.5 font-medium tracking-[0.1em]">{t.parameter}</th>
              <th className="px-3 py-1.5 font-medium tracking-[0.1em]">{t.value}</th>
              <th className="hidden px-3 py-1.5 font-medium tracking-[0.1em] lg:table-cell">{t.description}</th>
            </tr>
          </thead>
          <tbody>
            {translatedRows.map((row) => (
              <tr key={row.parameter} className="border-t border-white/6 align-top hover:bg-white/3">
                <td className="px-3 py-2 text-[#cfd8e3]">{row.parameter}</td>
                <td className={cn("px-3 py-2 font-semibold", isAvailable ? "text-[#00f7a1]" : isTransitioning ? "text-[#ffb347]" : "text-[#475569]")}>{row.value}</td>
                <td className="hidden px-3 py-2 text-[#6a8a9f] lg:table-cell">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAvailable ? <div className="flex items-center gap-2 rounded-xl border border-[#00f7a1]/20 bg-[#00f7a1]/5 px-3 py-2"><Zap className="h-3.5 w-3.5 shrink-0 text-[#00f7a1]" /><span className="font-mono text-[10px] tracking-[0.1em] text-[#00f7a1]/80">{t.liveValuesReflected}</span><Link href="/power/one-line" className="ml-auto shrink-0 font-display text-[10px] tracking-[0.14em] text-[#00f7a1] underline underline-offset-2 transition hover:text-white">{t.viewDiagram}</Link></div> : null}
    </div>
  );
}
