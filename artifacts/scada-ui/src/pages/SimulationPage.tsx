import { useMemo } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowLeft,
  Gauge,
  Languages,
  Zap,
  Factory,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Power,
  Waves,
} from "lucide-react";
import { Panel } from "@/components/Panel";
import { LED } from "@/components/LED";
import { useGridSimulationContext } from "@/context/GridSimulationContext";
import {
  useGeneratorSimulationContext,
  type GenState,
  type GeneratorLiveStatus,
} from "@/context/GeneratorSimulationContext";
import { useScadaState } from "@/hooks/use-scada-state";
import { useElectricalMetrics } from "@/hooks/use-electrical-metrics";
import { useTranslation } from "@/context/LanguageContext";
import { SYSTEM } from "@/config/system";
import { cn } from "@/lib/utils";
import type { Translations } from "@/i18n/translations";

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

function Sparkline({
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

function formatVoltageDisplay(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} kV`;
  }
  return `${value.toFixed(1)} V`;
}

function formatSimulationTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function StatusBadge({
  ok,
  okLabel,
  faultLabel,
}: {
  ok: boolean;
  okLabel: string;
  faultLabel: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] tracking-[0.16em]",
        ok
          ? "border-[#00f7a1]/30 bg-[#00f7a1]/10 text-[#00f7a1]"
          : "border-[#ff4d5a]/30 bg-[#ff4d5a]/10 text-[#ff4d5a]",
      )}
    >
      {ok ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <AlertTriangle className="h-3 w-3" />
      )}
      {ok ? okLabel : faultLabel}
    </span>
  );
}

function MetricCard({
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
  icon: React.ReactNode;
  color: "cyan" | "green";
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
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br p-4 flex flex-col gap-3",
        c.border,
        c.bg,
        c.text,
      )}
    >
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
        <span className="font-mono text-5xl font-semibold tracking-[0.06em]">
          {value}
        </span>
        {unit ? (
          <span className="pb-1 font-mono text-sm text-[#8ca5bf]">{unit}</span>
        ) : null}
      </div>
      <div className="h-[50px] overflow-hidden rounded-lg">
        <Sparkline values={sparkValues} color={sparkColor} />
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#1c2c40] bg-[#09111d] p-3">
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
            {t.nominal}
          </div>
          <div className="font-mono text-sm text-[#b8c6d9]">
            {nominal}
            {unit ? ` ${unit}` : ""}
          </div>
        </div>
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
            {t.deviation}
          </div>
          <div
            className={cn(
              "font-mono text-sm",
              inBand ? "text-[#00f7a1]" : "text-[#ff4d5a]",
            )}
          >
            {deviation}
            {unit ? ` ${unit}` : ""}
          </div>
        </div>
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
            {t.band}
          </div>
          <div className="font-mono text-sm text-[#b8c6d9]">
            {toleranceBand}
            {unit ? ` ${unit}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function ElecDataCard({
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
  rows: { parameter: string; value: string; description: string }[];
  t: Translations;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        energized
          ? "border-[#00dcff]/30 bg-gradient-to-br from-[#0d1a1e] to-[#0a1318]"
          : "border-[#2a2a2a] bg-[#111]",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-[#5a7a8a]">
            {tag}
          </div>
          <div className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-white">
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 font-mono text-[11px] tracking-[0.1em] text-[#6a8a9f]">
              {subtitle}
            </div>
          )}
          <div
            className={cn(
              "mt-1.5 inline-block rounded border px-2 py-0.5 font-mono text-[10px] tracking-[0.18em]",
              energized
                ? "border-[#00f7a1]/30 bg-[#00f7a1]/10 text-[#00f7a1]"
                : "border-[#334155]/60 bg-[#1a1a1a] text-[#475569]",
            )}
          >
            {status}
          </div>
        </div>
        <Zap
          className={cn(
            "h-5 w-5 shrink-0",
            energized ? "text-[#00dcff]" : "text-[#334155]",
          )}
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-white/8">
        <table className="w-full border-collapse text-left font-mono text-[11px]">
          <thead className="bg-white/5 text-[#7f93ac]">
            <tr>
              <th className="px-3 py-2 font-medium tracking-[0.1em]">
                {t.utility.details.table.parameter}
              </th>
              <th className="px-3 py-2 font-medium tracking-[0.1em]">
                {t.utility.details.table.unit}
              </th>
              <th className="hidden px-3 py-2 font-medium tracking-[0.1em] sm:table-cell">
                {t.utility.details.table.description}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.parameter}
                className="border-t border-white/6 align-top hover:bg-white/3"
              >
                <td className="px-3 py-2 text-[#cfd8e3]">{row.parameter}</td>
                <td
                  className={cn(
                    "px-3 py-2 font-semibold",
                    energized ? "text-[#8ecae6]" : "text-[#475569]",
                  )}
                >
                  {row.value}
                </td>
                <td className="hidden px-3 py-2 text-[#6a8a9f] sm:table-cell">
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type GenStateConfig = {
  border: string;
  bg: string;
  badgeText: string;
  badgeStyle: string;
  ledColor: "green" | "amber" | "red" | "cyan";
  ledOn: boolean;
};

function getGenStateConfig(t: Translations): Record<GenState, GenStateConfig> {
  return {
    OFFLINE: {
      border: "border-[#2a2a2a]",
      bg: "bg-[#0f0f0f]",
      badgeText: t.genStateOffline,
      badgeStyle: "border-[#334155]/60 bg-[#1a1a1a] text-[#475569]",
      ledColor: "cyan",
      ledOn: false,
    },
    STARTING: {
      border: "border-[#ffb347]/30",
      bg: "bg-gradient-to-br from-[#1e1206] to-[#141008]",
      badgeText: t.genStateStarting,
      badgeStyle: "border-[#ffb347]/40 bg-[#ffb347]/10 text-[#ffb347]",
      ledColor: "amber",
      ledOn: true,
    },
    STABILIZING: {
      border: "border-[#00dcff]/30",
      bg: "bg-gradient-to-br from-[#08161d] to-[#0a1119]",
      badgeText: t.genStateStabilizing,
      badgeStyle: "border-[#00dcff]/40 bg-[#00dcff]/10 text-[#00dcff]",
      ledColor: "cyan",
      ledOn: true,
    },
    READY: {
      border: "border-[#00f7a1]/30",
      bg: "bg-gradient-to-br from-[#0e1a10] to-[#0a140c]",
      badgeText: t.genStateAvailable,
      badgeStyle: "border-[#00f7a1]/40 bg-[#00f7a1]/10 text-[#00f7a1]",
      ledColor: "green",
      ledOn: true,
    },
    LOADED: {
      border: "border-[#ffd166]/35",
      bg: "bg-gradient-to-br from-[#1e1808] to-[#161006]",
      badgeText: t.genStateOnBus,
      badgeStyle: "border-[#ffd166]/40 bg-[#ffd166]/10 text-[#ffd166]",
      ledColor: "amber",
      ledOn: true,
    },
    STOPPING: {
      border: "border-[#ffb347]/30",
      bg: "bg-gradient-to-br from-[#1e1206] to-[#141008]",
      badgeText: t.genStateStopping,
      badgeStyle: "border-[#ffb347]/40 bg-[#ffb347]/10 text-[#ffb347]",
      ledColor: "amber",
      ledOn: true,
    },
  };
}

const RAMP_PHASES = [
  { key: "phaseCranking" as const, label: "CRANKING", threshold: 0.2 },
  {
    key: "phaseBuildingVoltage" as const,
    label: "BUILDING VOLTAGE",
    threshold: 0.55,
  },
  {
    key: "phaseReachingRatedSpeed" as const,
    label: "REACHING RATED SPEED",
    threshold: 0.88,
  },
  {
    key: "phaseReadyForAts" as const,
    label: "READY FOR ATS TRANSFER",
    threshold: 1.0,
  },
];

function GeneratorCard({
  genIdx,
  status,
  onStart,
  onStop,
  t,
}: {
  genIdx: number;
  status: GeneratorLiveStatus;
  onStart: () => void;
  onStop: () => void;
  t: Translations;
}) {
  const gen = SYSTEM.generators[genIdx];
  const GEN_STATE_CONFIG = getGenStateConfig(t);
  const cfg = GEN_STATE_CONFIG[status.state];
  const isTransitioning =
    status.state === "STARTING" ||
    status.state === "STABILIZING" ||
    status.state === "STOPPING";
  const isReady = status.state === "READY";
  const isLoaded = status.state === "LOADED";
  const isAvailable = isReady || isLoaded;
  const isOffline = status.state === "OFFLINE";
  const isStopping = status.state === "STOPPING";

  const translatedRows = [
    {
      parameter: t.frequency,
      value:
        status.state !== "OFFLINE"
          ? `${status.frequency.toFixed(2)} Hz`
          : `${gen.nominalFrequency.toFixed(2)} Hz (nominal)`,
      description: isAvailable ? t.genLiveFreqDesc : t.genNominalFreqDesc,
    },
    {
      parameter: t.voltage,
      value:
        status.state !== "OFFLINE"
          ? `${status.voltage.toFixed(1)} V`
          : `${gen.nominalVoltage} V (nominal)`,
      description: isAvailable ? t.genLiveVoltageDesc : t.genNominalVoltageDesc,
    },
    {
      parameter: t.current,
      value: `${status.current.toFixed(2)} A`,
      description: isAvailable ? t.genLiveCurrentDesc : t.genOfflineCurrentDesc,
    },
    {
      parameter: t.activePower,
      value: `${status.activePower.toFixed(1)} W`,
      description: isAvailable
        ? t.genEmergencyPowerDesc
        : t.genZeroWhileOffline,
    },
    {
      parameter: t.reactivePower,
      value: `${status.reactivePower.toFixed(1)} VAR`,
      description: t.genReactiveDesc,
    },
    {
      parameter: t.fuelLevel,
      value: `${gen.fuelLevel}%`,
      description: t.genFuelDesc,
    },
  ];

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 flex flex-col gap-4 transition-all duration-500",
        cfg.border,
        cfg.bg,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <LED on={cfg.ledOn} color={cfg.ledColor} size="md" />
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] text-[#5a7a8a]">
              {gen.tag}
            </div>
            <div className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
              {gen.name}
            </div>
            <div
              className={cn(
                "mt-1 inline-block rounded border px-2 py-0.5 font-mono text-[10px] tracking-[0.18em]",
                cfg.badgeStyle,
              )}
            >
              {(() => {
                const rampPhase = RAMP_PHASES.find(
                  (p) => p.label === status.phaseLabel,
                );
                return rampPhase ? t[rampPhase.key] : cfg.badgeText;
              })()}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="font-mono text-[10px] tracking-[0.18em] text-[#5a7a8a]">
            {t.fuel} {gen.fuelLevel}%
          </div>
          {isOffline && (
            <button
              type="button"
              onClick={onStart}
              className="flex items-center gap-1.5 rounded-xl border border-[#00f7a1]/40 bg-[#00f7a1]/10 px-3 py-1.5 font-display text-xs tracking-[0.14em] text-[#00f7a1] transition hover:bg-[#00f7a1]/20"
            >
              <Power className="h-3 w-3" /> {t.start}
            </button>
          )}
          {isAvailable && (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1.5 rounded-xl border border-[#ff4d5a]/40 bg-[#ff4d5a]/10 px-3 py-1.5 font-display text-xs tracking-[0.14em] text-[#ff4d5a] transition hover:bg-[#ff4d5a]/20"
            >
              <Power className="h-3 w-3" /> {t.stop}
            </button>
          )}
          {isTransitioning && (
            <span className="rounded-xl border border-[#ffb347]/30 bg-[#ffb347]/8 px-3 py-1.5 font-display text-xs tracking-[0.14em] text-[#ffb347]/60">
              {isStopping ? t.stoppingEllipsis : t.startingEllipsis}
            </span>
          )}
        </div>
      </div>

      {isTransitioning && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2 flex-wrap">
              {RAMP_PHASES.map((phase, i) => {
                const prevThreshold =
                  i === 0 ? 0 : RAMP_PHASES[i - 1].threshold;
                const reached = isStopping
                  ? 1 - status.progress <= phase.threshold
                  : status.progress >= prevThreshold;
                const active = status.phaseLabel === phase.label;
                return (
                  <span
                    key={phase.label}
                    className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] transition-all duration-300",
                      active
                        ? "bg-[#ffb347]/25 text-[#ffb347]"
                        : reached
                          ? "text-[#4a6a5a]"
                          : "text-[#2a3a3a]",
                    )}
                  >
                    {t[phase.key]}
                  </span>
                );
              })}
            </div>
            <span className="shrink-0 font-mono text-[10px] text-[#ffb347]">
              {(status.progress * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-200",
                isStopping
                  ? "bg-gradient-to-r from-[#ffb347] to-[#ff4d5a]"
                  : "bg-gradient-to-r from-[#00dcff] to-[#00f7a1]",
              )}
              style={{ width: `${status.progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {(isTransitioning || isAvailable) && status.voltageHistory.length > 1 && (
        <div className="h-[50px] overflow-hidden rounded-xl border border-white/6 bg-black/20">
          <Sparkline
            values={status.voltageHistory}
            color={isAvailable ? "#00f7a1" : "#ffb347"}
            height={50}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/8">
        <table className="w-full border-collapse text-left font-mono text-[11px]">
          <thead className="bg-white/5 text-[#7f93ac]">
            <tr>
              <th className="px-3 py-1.5 font-medium tracking-[0.1em]">
                {t.parameter}
              </th>
              <th className="px-3 py-1.5 font-medium tracking-[0.1em]">
                {t.value}
              </th>
              <th className="hidden px-3 py-1.5 font-medium tracking-[0.1em] lg:table-cell">
                {t.description}
              </th>
            </tr>
          </thead>
          <tbody>
            {translatedRows.map((row) => (
              <tr
                key={row.parameter}
                className="border-t border-white/6 align-top hover:bg-white/3"
              >
                <td className="px-3 py-2 text-[#cfd8e3]">{row.parameter}</td>
                <td
                  className={cn(
                    "px-3 py-2 font-semibold",
                    isAvailable
                      ? "text-[#00f7a1]"
                      : isTransitioning
                        ? "text-[#ffb347]"
                        : "text-[#475569]",
                  )}
                >
                  {row.value}
                </td>
                <td className="hidden px-3 py-2 text-[#6a8a9f] lg:table-cell">
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAvailable && (
        <div className="flex items-center gap-2 rounded-xl border border-[#00f7a1]/20 bg-[#00f7a1]/5 px-3 py-2">
          <Zap className="h-3.5 w-3.5 shrink-0 text-[#00f7a1]" />
          <span className="font-mono text-[10px] tracking-[0.1em] text-[#00f7a1]/80">
            {t.liveValuesReflected}
          </span>
          <Link
            href="/electrical-one-line"
            className="ml-auto shrink-0 font-display text-[10px] tracking-[0.14em] text-[#00f7a1] underline underline-offset-2 transition hover:text-white"
          >
            {t.viewDiagram}
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SimulationPage() {
  const {
    voltage,
    frequency,
    gridState,
    history,
    form,
    config,
    gridEnabled,
    gridDemandMw,
    simulationTimeMinutes,
    inflowRate,
    reservoirLevel,
    generatedPowerMw,
    hydraulicHeadMeters,
    waterFlowActiveUnits,
    waterToWireEfficiency,
    hydroDispatchMode,
    rawWaterPowerMw,
    hydraulicCapacityMw,
    hydraulicReserveMw,
    importedGridPowerMw,
    toggleGrid,
    setForm,
    applyConfig,
  } = useGridSimulationContext();
  const {
    statuses: generatorStatuses,
    start,
    stop,
  } = useGeneratorSimulationContext();
  const { state } = useScadaState();
  const { powerFactor, activePower, reactivePower, apparentPower } =
    useElectricalMetrics(voltage, state.current, state.motorPowered);
  const { t, locale, toggleLocale } = useTranslation();

  const voltageMin = config.baseVoltage * (1 - config.voltageVariationPct);
  const voltageMax = config.baseVoltage * (1 + config.voltageVariationPct);
  const voltageInBand = voltage >= voltageMin && voltage <= voltageMax;
  const voltageDeviation = (voltage - config.baseVoltage).toFixed(2);
  const voltageBand = (config.baseVoltage * config.voltageVariationPct).toFixed(
    2,
  );

  const freqMin = config.baseFrequency - config.frequencyVariation;
  const freqMax = config.baseFrequency + config.frequencyVariation;
  const freqInBand = frequency >= freqMin && frequency <= freqMax;
  const freqDeviation = (frequency - config.baseFrequency).toFixed(3);

  const voltageHistory = useMemo(
    () => history.map((r) => r.voltage),
    [history],
  );
  const freqHistory = useMemo(() => history.map((r) => r.frequency), [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyConfig();
  };

  const runningGeneratorFreqs = generatorStatuses
    .filter((s) => s.state !== "OFFLINE")
    .map((s) => s.frequency);
  const plantFrequency =
    runningGeneratorFreqs.length > 0
      ? runningGeneratorFreqs.reduce((sum, f) => sum + f, 0) /
        runningGeneratorFreqs.length
      : config.baseFrequency;

  const gridDetails = useMemo(
    () => [
      {
        label: t.nominalVoltage,
        value: formatVoltageDisplay(config.baseVoltage),
      },
      { label: t.liveVoltage, value: formatVoltageDisplay(voltage) },
      {
        label: t.internalBus,
        value: gridState === "DISCONNECTED" ? t.busOpen : t.busClosed,
      },
      { label: t.minAllowed, value: formatVoltageDisplay(voltageMin) },
      { label: t.maxAllowed, value: formatVoltageDisplay(voltageMax) },
      {
        label: t.voltageDeviation,
        value: `${Number(voltageDeviation) >= 0 ? "+" : ""}${voltageDeviation} V`,
      },
      {
        label: t.voltageTolerance,
        value: `±${(config.voltageVariationPct * 100).toFixed(1)} %`,
      },
      {
        label: t.nominalFrequency,
        value: `${config.baseFrequency.toFixed(2)} Hz`,
      },
      { label: t.liveFrequency, value: `${frequency.toFixed(3)} Hz` },
      { label: t.plantFrequency, value: `${plantFrequency.toFixed(3)} Hz` },
      { label: t.freqMin, value: `${freqMin.toFixed(3)} Hz` },
      { label: t.freqMax, value: `${freqMax.toFixed(3)} Hz` },
      {
        label: t.freqDeviation,
        value: `${Number(freqDeviation) >= 0 ? "+" : ""}${freqDeviation} Hz`,
      },
      {
        label: t.freqBand,
        value: `${config.frequencyVariation.toFixed(3)} Hz`,
      },
      {
        label: t.sampleInterval,
        value: `${config.updateIntervalMs ?? 1000} ms`,
      },
      { label: t.historySamples, value: `${history.length}` },
      {
        label: t.voltageStatus,
        value: voltageInBand ? t.inBand : t.outOfBand,
      },
      { label: t.freqStatus, value: freqInBand ? t.inBand : t.outOfBand },
    ],
    [
      t,
      config,
      voltage,
      frequency,
      voltageMin,
      voltageMax,
      voltageDeviation,
      freqMin,
      freqMax,
      freqDeviation,
      voltageInBand,
      freqInBand,
      history.length,
      gridState,
      plantFrequency,
      generatorStatuses,
    ],
  );

  const utilityRows = useMemo(
    () => [
      {
        parameter: t.gridFrequency,
        value: `${frequency.toFixed(2)} Hz`,
        description: t.gridStabilityDesc,
      },
      {
        parameter: t.plantFrequency,
        value: `${plantFrequency.toFixed(2)} Hz`,
        description:
          "Average generator frequency before and during grid injection",
      },
      {
        parameter: t.voltage,
        value: `${formatVoltageDisplay(voltage)}`,
        description: t.supplyAtMccShort(SYSTEM.utility.nominalVoltage),
      },
      {
        parameter: t.current,
        value: `${state.current.toFixed(2)} A`,
        description: t.totalLoadCurrentShort,
      },
      {
        parameter: t.activePower,
        value: `${activePower.toFixed(1)} W`,
        description: t.realPowerConsumed,
      },
      {
        parameter: t.apparentPower,
        value: `${apparentPower.toFixed(1)} VA`,
        description: t.totalVAShort,
      },
      {
        parameter: t.reactivePower,
        value: `${reactivePower.toFixed(1)} VAR`,
        description: t.reactiveInductive,
      },
      {
        parameter: t.powerFactor,
        value: `${state.motorPowered ? powerFactor.toFixed(3) : "1.000"} cos\u03C6`,
        description: t.motorPfNominalShort(SYSTEM.motor.powerFactor),
      },
    ],
    [
      t,
      frequency,
      voltage,
      state.current,
      state.motorPowered,
      activePower,
      apparentPower,
      reactivePower,
      powerFactor,
    ],
  );

  const motorRows = useMemo(
    () => [
      {
        parameter: t.frequency,
        value: `${frequency.toFixed(2)} Hz`,
        description: t.motorFreqDesc(SYSTEM.motor.nominalFrequency),
      },
      {
        parameter: t.voltage,
        value: `${state.motorPowered ? voltage.toFixed(1) : "0.0"} V`,
        description: t.motorVoltageDesc(SYSTEM.motor.nominalVoltage),
      },
      {
        parameter: t.current,
        value: `${state.current.toFixed(2)} A`,
        description: state.motorPowered
          ? t.motorCurrentRunning
          : t.motorCurrentStopped,
      },
      {
        parameter: t.activePower,
        value: `${activePower.toFixed(1)} W`,
        description: t.motorShaftPower,
      },
      {
        parameter: t.reactivePower,
        value: `${reactivePower.toFixed(1)} VAR`,
        description: t.motorMagnitisingReactive,
      },
      {
        parameter: t.powerFactor,
        value: `${state.motorPowered ? powerFactor.toFixed(3) : "—"} cos\u03C6`,
        description: t.motorPfDesc(SYSTEM.motor.powerFactor),
      },
    ],
    [
      t,
      frequency,
      voltage,
      state.motorPowered,
      state.current,
      activePower,
      reactivePower,
      powerFactor,
    ],
  );

  const anyGenActive = generatorStatuses.some((s) => s.state !== "OFFLINE");
  const availableGenCount = generatorStatuses.filter(
    (s) => s.state === "READY" || s.state === "LOADED",
  ).length;
  const hydroUnitCount = 10;
  const hydroUnitCapacityMw = 54.8;
  const hydroActiveUnits = waterFlowActiveUnits;

  const hydroTargetMw = hydroActiveUnits * hydroUnitCapacityMw;
  const hydroInjectedMw = generatedPowerMw;
  const hydroPerUnitMw =
    hydroActiveUnits > 0 ? hydroInjectedMw / hydroActiveUnits : 0;
  const curtailedHydraulicMw = Math.max(0, hydroTargetMw - hydroInjectedMw);
  const demandGapMw = importedGridPowerMw;
  const hydraulicCeilingMw = Math.min(rawWaterPowerMw, hydraulicCapacityMw);
  const hydroGridState =
    gridState === "CONNECTED"
      ? t.gridConnected
      : gridState === "SYNCHRONIZING"
        ? t.syncInProgress
        : t.couplingStatus;
  const waterFlowPct = Math.max(0, Math.min(100, (inflowRate / 600) * 100));
  const reservoirPct = Math.max(
    0,
    Math.min(100, ((reservoirLevel - 92) / (108 - 92)) * 100),
  );
  const demandCoveragePct =
    gridDemandMw > 0
      ? Math.min(100, (hydroInjectedMw / gridDemandMw) * 100)
      : 0;
  const dayBrightness = Math.max(
    0.35,
    Math.sin((simulationTimeMinutes / 1440) * Math.PI),
  );

  const hydroSteps = [
    {
      label: t.unitOffline,
      description: "Turbine stopped · 0 MW",
      active: gridState === "DISCONNECTED",
      complete: gridState !== "DISCONNECTED",
    },
    {
      label: t.startupWaterToTurbine,
      description: "Speed ramps to rated frequency",
      active: gridState === "SYNCHRONIZING",
      complete: gridState !== "DISCONNECTED",
    },
    {
      label: t.gridSynchronizationStep,
      description: "Match voltage, phase, and 60 Hz before breaker close",
      active: gridState === "SYNCHRONIZING",
      complete: gridState === "CONNECTED",
    },
    {
      label: t.loadRamp,
      description: `Ramp generated output: hydraulic governor settles at ${hydroInjectedMw.toFixed(0)} MW`,
      active: gridState === "CONNECTED",
      complete: gridState === "CONNECTED",
    },
    {
      label: t.baseloadStep,
      description:
        hydroActiveUnits > 0
          ? `Dispatch settled: ${hydroActiveUnits} unit(s) at ${hydroPerUnitMw.toFixed(1)} MW each`
          : "No hydro units dispatched",
      active: gridState === "CONNECTED",
      complete: gridState === "CONNECTED",
    },
  ];

  const utilityStatus = state.isPowered
    ? t.utility.status.energized
    : t.utility.status.unavailable;
  const motorStatus = state.motorPowered
    ? t.running
    : state.isPowered
      ? t.standby
      : t.genStateOffline;

  const formFields = [
    {
      label: t.baseVoltage,
      key: "baseVoltage" as const,
      step: "0.1",
      min: "1",
    },
    {
      label: t.baseFrequency,
      key: "baseFrequency" as const,
      step: "0.001",
      min: "1",
    },
    {
      label: t.voltageTolerance2,
      key: "voltageTolerancePct" as const,
      step: "0.1",
      min: "0",
    },
    {
      label: t.frequencyBand,
      key: "frequencyVariation" as const,
      step: "0.001",
      min: "0",
    },
    { label: t.gridDemand, key: "gridDemandMw" as const, step: "1", min: "0" },
  ];

  return (
    <div className="min-h-screen bg-[#141414] text-[#d6deea]">
      <header className="sticky top-0 z-20 border-b border-[#2a2a2a] bg-[#0d0d0d]/95 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 font-display text-xs tracking-[0.16em] text-[#7f93ac] transition hover:border-[#00f7a1]/30 hover:text-[#00f7a1]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {t.dashboard}
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1f8a61]/40 bg-[#161c18]">
              <Factory className="h-5 w-5 text-[#00f7a1]" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold tracking-[0.18em] text-white">
                {t.gridSimulation}
              </h1>
              <div className="mt-0.5 font-mono text-xs tracking-[0.16em] text-[#8a9a8a]">
                {SYSTEM.id} / {t.teacherInterface}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-[#1c2c40] bg-[#09111d] px-4 py-2">
              <LED
                on={voltageInBand && freqInBand}
                color={voltageInBand && freqInBand ? "green" : "red"}
              />
              <span className="font-mono text-xs tracking-[0.16em] text-[#9fb0c7]">
                {voltageInBand && freqInBand ? t.gridNominal : t.gridAnomaly}
              </span>
            </div>
            {anyGenActive && (
              <div className="flex items-center gap-2 rounded-xl border border-[#ffb347]/30 bg-[#ffb347]/8 px-4 py-2">
                <LED on color="amber" />
                <span className="font-mono text-xs tracking-[0.16em] text-[#ffb347]">
                  {t.generatorActive}
                </span>
              </div>
            )}
            <Link
              href="/electrical-one-line"
              className="flex items-center gap-2 rounded-xl border border-[#00f7a1]/30 bg-[#00f7a1]/8 px-3 py-2 font-display text-xs tracking-[0.16em] text-[#00f7a1] transition hover:bg-[#00f7a1]/15"
            >
              <Zap className="h-3.5 w-3.5" /> {t.electricalOneLineLink}
            </Link>
            <button
              type="button"
              onClick={toggleLocale}
              aria-label={
                locale === "en" ? "Passer au français" : "Switch to English"
              }
              className="flex items-center gap-1.5 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 font-mono text-xs tracking-[0.16em] text-[#7f93ac] transition hover:border-[#00f7a1]/30 hover:text-[#00f7a1]"
            >
              <Languages className="h-4 w-4" />
              <span>{locale === "en" ? "FR" : "EN"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-5 p-5">
        <div
          className={cn(
            "rounded-2xl border p-5 transition-all duration-500",
            gridEnabled
              ? "border-[#00f7a1]/40 bg-gradient-to-br from-[#071410] to-[#0d1f16]"
              : "border-[#2a2a2a] bg-[#101010]",
          )}
        >
          <div className="mb-5 flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-500",
                gridEnabled
                  ? "border-[#00f7a1]/40 bg-[#00f7a1]/10 power-online-pulse"
                  : "border-[#2a2a2a] bg-[#1a1a1a]",
              )}
            >
              <Factory
                className={cn(
                  "h-5 w-5 transition-colors duration-300",
                  gridEnabled ? "text-[#00f7a1]" : "text-[#4a5a6a]",
                )}
              />
            </div>
            <div>
              <div className="font-display text-xs uppercase tracking-[0.2em] text-[#5a7a8a]">
                {t.teacherInterface}
              </div>
              <div className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-white">
                {t.powerSource} — {t.powerPlant}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] tracking-[0.16em] transition-all duration-300",
                  gridState === "CONNECTED"
                    ? "border-[#00f7a1]/30 bg-[#00f7a1]/10 text-[#00f7a1]"
                    : gridState === "SYNCHRONIZING"
                      ? "border-[#ffd166]/30 bg-[#ffd166]/10 text-[#ffd166]"
                      : "border-[#334155]/60 bg-[#1a1a1a] text-[#475569]",
                )}
              >
                {gridState === "CONNECTED" ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> {t.gridConnected}
                  </>
                ) : gridState === "SYNCHRONIZING" ? (
                  <>
                    <Activity className="h-3 w-3" /> {t.syncInProgress}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3" /> {t.disconnected}
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)_auto]">
            <div className="grid gap-3 sm:grid-cols-3">
              <div
                className={cn(
                  "rounded-xl border px-4 py-3 transition-all duration-500",
                  gridEnabled
                    ? "border-[#00dcff]/20 bg-[#09111d]"
                    : "border-[#1c2c40] bg-[#09111d]",
                )}
              >
                <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                  {t.sourceVoltage}
                </div>
                <div
                  className={cn(
                    "mt-1 font-mono text-2xl font-semibold tracking-[0.06em] transition-colors duration-500",
                    gridEnabled ? "text-[#00dcff]" : "text-[#334155]",
                  )}
                >
                  {gridEnabled ? formatVoltageDisplay(voltage) : "0.00 kV"}
                </div>
              </div>
              <div
                className={cn(
                  "rounded-xl border px-4 py-3 transition-all duration-500",
                  gridEnabled
                    ? "border-[#00f7a1]/20 bg-[#09111d]"
                    : "border-[#1c2c40] bg-[#09111d]",
                )}
              >
                <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                  {t.sourceFrequency}
                </div>
                <div
                  className={cn(
                    "mt-1 font-mono text-2xl font-semibold tracking-[0.06em] transition-colors duration-500",
                    gridEnabled ? "text-[#00f7a1]" : "text-[#334155]",
                  )}
                >
                  {gridEnabled ? frequency.toFixed(2) : "0.00"}{" "}
                  <span className="text-sm font-normal text-[#5a7a8a]">Hz</span>
                </div>
              </div>
              <div className="rounded-xl border border-[#1c2c40] bg-[#09111d] px-4 py-3">
                <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                  {t.syncIndicator}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <LED
                    on={gridState === "CONNECTED"}
                    color={
                      gridState === "CONNECTED"
                        ? "green"
                        : gridState === "SYNCHRONIZING"
                          ? "amber"
                          : "cyan"
                    }
                    size="md"
                  />
                  <span
                    className={cn(
                      "font-mono text-sm tracking-[0.1em] transition-colors duration-300",
                      gridState === "CONNECTED"
                        ? "text-[#00f7a1]"
                        : gridState === "SYNCHRONIZING"
                          ? "text-[#ffd166]"
                          : "text-[#475569]",
                    )}
                  >
                    {gridState === "CONNECTED"
                      ? t.gridConnected
                      : gridState === "SYNCHRONIZING"
                        ? t.syncInProgress
                        : t.couplingStatus}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[10px] text-[#4a5a6a]">
                  {t.powerSourceDesc}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#1c2c40] bg-[#09111d] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    {t.plantOverview}
                  </div>
                  <div className="font-mono text-[11px] tracking-[0.12em] text-[#8aa0b6]">
                    548 MW / 10 hydro units / {hydroUnitCapacityMw.toFixed(1)}{" "}
                    MW per unit
                  </div>
                </div>
                <StatusBadge
                  ok={gridState === "CONNECTED"}
                  okLabel={t.gridEnergized}
                  faultLabel={
                    gridState === "SYNCHRONIZING"
                      ? t.syncInProgress
                      : t.syncReady
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    {t.activeUnits}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-semibold tracking-[0.06em] text-[#00f7a1]">
                    {hydroActiveUnits}{" "}
                    <span className="text-sm font-normal text-[#5a7a8a]">
                      / {hydroUnitCount}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#6f8ca1]">
                    {hydroActiveUnits > 0
                      ? `${hydroPerUnitMw.toFixed(1)} MW per unit (54.8 MW max)`
                      : "No units dispatched"}
                  </div>
                </div>
                <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    {t.gridDemand}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-semibold tracking-[0.06em] text-[#00dcff]">
                    {gridDemandMw.toFixed(0)}{" "}
                    <span className="text-sm font-normal text-[#5a7a8a]">
                      MW
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    {t.totalInjectedPower}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-semibold tracking-[0.06em] text-[#00dcff]">
                    {hydroInjectedMw.toFixed(1)}{" "}
                    <span className="text-sm font-normal text-[#5a7a8a]">
                      MW
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#6f8ca1]">
                    P = ρ·g·Q·H·η
                  </div>
                </div>
                <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    {t.gridState}
                  </div>
                  <div
                    className={cn(
                      "mt-1 font-mono text-sm tracking-[0.12em]",
                      gridEnabled ? "text-[#00f7a1]" : "text-[#ffd166]",
                    )}
                  >
                    {hydroGridState}
                  </div>
                </div>
                <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    {t.injectedPower}
                  </div>
                  <div className="mt-1 font-mono text-sm tracking-[0.12em] text-[#b8c6d9]">
                    {gridEnabled ? hydroInjectedMw.toFixed(1) : "0.0"} MW @{" "}
                    {gridEnabled ? frequency.toFixed(2) : "60.00"} Hz
                  </div>
                  <div className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#6f8ca1]">
                    {hydroActiveUnits > 0
                      ? `${hydroPerUnitMw.toFixed(1)} MW per unit`
                      : "Awaiting dispatch"}
                  </div>
                  <div className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#6f8ca1]">
                    {demandGapMw > 0
                      ? `${demandGapMw.toFixed(1)} MW imported from the bulk grid`
                      : hydraulicReserveMw > 0
                        ? `${hydraulicReserveMw.toFixed(1)} MW hydraulic reserve available`
                        : curtailedHydraulicMw > 0
                          ? `${curtailedHydraulicMw.toFixed(1)} MW governor reserve`
                          : "Dispatch matched to water power"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[#1c2c40] bg-[#09111d] px-8 py-5">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                {t.couplingBreaker}
              </div>

              {/* Big master power toggle */}
              <button
                type="button"
                onClick={toggleGrid}
                className={cn(
                  "relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-300",
                  gridEnabled
                    ? "border-[#ff4d5a]/60 bg-[#ff4d5a]/15 text-[#ff4d5a] hover:bg-[#ff4d5a]/25 shadow-[0_0_20px_rgba(255,77,90,0.15)]"
                    : "border-[#00f7a1]/50 bg-[#00f7a1]/10 text-[#00f7a1] hover:bg-[#00f7a1]/20 shadow-[0_0_20px_rgba(0,247,161,0.1)]",
                )}
                aria-label={gridEnabled ? "Power off" : "Power on"}
              >
                <Power className="h-7 w-7" />
              </button>

              <div className="text-center">
                <div
                  className={cn(
                    "font-display text-xs font-semibold tracking-[0.18em] uppercase transition-colors duration-300",
                    gridEnabled ? "text-[#ff4d5a]" : "text-[#00f7a1]",
                  )}
                >
                  {gridEnabled ? t.isolateGrid : t.injectPower}
                </div>
                <div
                  className={cn(
                    "mt-0.5 flex items-center justify-center gap-1.5 font-mono text-[10px] tracking-[0.12em]",
                    gridEnabled ? "text-[#00f7a1]" : "text-[#475569]",
                  )}
                >
                  {gridEnabled ? (
                    <>
                      <Zap className="h-3 w-3" /> {t.connected}
                    </>
                  ) : (
                    <>
                      <Power className="h-3 w-3" /> {t.disconnected}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
            <div className="rounded-xl border border-[#1c2c40] bg-[#09111d] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    {t.waterFlowPanel}
                  </div>
                  <div className="font-mono text-[11px] tracking-[0.12em] text-[#8aa0b6]">
                    {t.waterFlowSubtitle}
                  </div>
                </div>
                <StatusBadge
                  ok={gridEnabled}
                  okLabel={t.waterDrivingTurbines}
                  faultLabel={t.waterOnStandby}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#114156] bg-[#071520] p-4">
                  <div className="flex items-center gap-2 text-[#5cc8ff]">
                    <Droplets className="h-4 w-4" />
                    <span className="font-display text-[10px] uppercase tracking-[0.18em]">
                      {t.waterFlowRate}
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-2xl font-semibold text-[#dff8ff]">
                    {inflowRate.toFixed(1)}{" "}
                    <span className="text-sm font-normal text-[#7fb2cf]">
                      m³/s
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#0d2532]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1b7da7] via-[#27b7ff] to-[#78e3ff]"
                      style={{ width: `${waterFlowPct}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-[#144e44] bg-[#081712] p-4">
                  <div className="flex items-center gap-2 text-[#00f7a1]">
                    <Waves className="h-4 w-4" />
                    <span className="font-display text-[10px] uppercase tracking-[0.18em]">
                      {t.reservoirLevelLabel}
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-2xl font-semibold text-[#e7fff4]">
                    {reservoirLevel.toFixed(2)}{" "}
                    <span className="text-sm font-normal text-[#7fb2cf]">
                      m
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#0b241d]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0d6b52] via-[#00c27d] to-[#8cf7cb]"
                      style={{ width: `${reservoirPct}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    {t.hydraulicHead}
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold text-[#ffd166]">
                    {hydraulicHeadMeters.toFixed(1)}{" "}
                    <span className="text-sm font-normal text-[#7f93ac]">
                      m
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    {t.waterToWireEfficiencyLabel}
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold text-[#00dcff]">
                    {(waterToWireEfficiency * 100).toFixed(0)}{" "}
                    <span className="text-sm font-normal text-[#7f93ac]">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#1c2c40] bg-[#09111d] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    {t.waterFlowScriptTitle}
                  </div>
                  <div className="font-mono text-[11px] tracking-[0.12em] text-[#8aa0b6]">
                    {t.waterFlowScriptDesc}
                  </div>
                </div>
                <div className="rounded-lg border border-[#1c2c40] bg-[#0c1520] px-3 py-2 text-right">
                  <div className="font-display text-[9px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    {t.simulationClock}
                  </div>
                  <div className="font-mono text-sm text-white">
                    {formatSimulationTime(simulationTimeMinutes)}
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[#123246] bg-gradient-to-r from-[#081721] via-[#0b1c25] to-[#0e171d] p-4">
                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(circle at 20% 20%, rgba(39,183,255,${dayBrightness}), transparent 40%)`,
                  }}
                />
                <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                  <div className="rounded-xl border border-[#114156] bg-[#071520]/90 p-3">
                    <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5cc8ff]">
                      {t.waterIntake}
                    </div>
                    <div className="mt-1 font-mono text-sm text-white">
                      {inflowRate.toFixed(1)} m³/s ·{" "}
                      {hydraulicHeadMeters.toFixed(1)} m ·{" "}
                      {(waterToWireEfficiency * 100).toFixed(0)}% η
                    </div>
                    <div className="mt-1 font-mono text-[10px] leading-4 text-[#7fb2cf]">
                      {t.waterIntakeDesc}
                    </div>
                  </div>
                  <div className="hidden md:block font-mono text-xl text-[#27b7ff]">
                    →
                  </div>
                  <div className="rounded-xl border border-[#144e44] bg-[#081712]/90 p-3">
                    <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#00f7a1]">
                      {t.turbineGovernor}
                    </div>
                    <div className="mt-1 font-mono text-sm text-white">
                      {hydroActiveUnits} / {hydroUnitCount}{" "}
                      {t.activeUnits.toLowerCase()}
                    </div>
                    <div className="mt-1 font-mono text-[10px] leading-4 text-[#8acfb6]">
                      {t.turbineGovernorDesc}
                    </div>
                  </div>
                  <div className="hidden md:block font-mono text-xl text-[#ffd166]">
                    →
                  </div>
                  <div className="rounded-xl border border-[#3b3320] bg-[#171108]/90 p-3">
                    <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#ffd166]">
                      {t.teacherDeliveryNode}
                    </div>
                    <div className="mt-1 font-mono text-sm text-white">
                      {hydroInjectedMw.toFixed(1)} MW ·{" "}
                      {demandCoveragePct.toFixed(0)}%
                    </div>
                    <div className="mt-1 font-mono text-[10px] leading-4 text-[#d1b77b]">
                      {t.teacherDeliveryNodeDesc}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
            <div className="rounded-xl border border-[#1c2c40] bg-[#09111d] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    OPERATIONS COUPLING NOTES
                  </div>
                  <div className="font-mono text-[11px] tracking-[0.12em] text-[#8aa0b6]">
                    Control-room interpretation of the live hydraulic,
                    production, and grid states.
                  </div>
                </div>
                <StatusBadge
                  ok={hydroDispatchMode === "PHYSICS"}
                  okLabel="PHYSICS MODE"
                  faultLabel="GRID FOLLOW MODE"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    Dispatch mode
                  </div>
                  <div className="mt-1 font-mono text-lg font-semibold text-white">
                    {hydroDispatchMode}
                  </div>
                  <div className="mt-1 font-mono text-[10px] leading-4 text-[#6f8ca1]">
                    Water availability sets the plant ceiling first, then the
                    grid absorbs whatever the station can export.
                  </div>
                </div>
                <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    Grid support balance
                  </div>
                  <div className="mt-1 font-mono text-lg font-semibold text-[#00dcff]">
                    {importedGridPowerMw.toFixed(1)} MW import
                  </div>
                  <div className="mt-1 font-mono text-[10px] leading-4 text-[#6f8ca1]">
                    Remaining demand is supplied by the external network
                    whenever station output stays below system load.
                  </div>
                </div>
                <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    Maximum possible at current flow
                  </div>
                  <div className="mt-1 font-mono text-lg font-semibold text-[#ffd166]">
                    {hydraulicCeilingMw.toFixed(1)} MW
                  </div>
                  <div className="mt-1 font-mono text-[10px] leading-4 text-[#6f8ca1]">
                    Computed from ρ·g·Q·H·η and clipped to the 10-unit plant
                    maximum of{" "}
                    {(hydroUnitCount * hydroUnitCapacityMw).toFixed(0)} MW.
                  </div>
                </div>
                <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    Unit loading margin
                  </div>
                  <div className="mt-1 font-mono text-lg font-semibold text-[#00f7a1]">
                    {hydroPerUnitMw.toFixed(1)} /{" "}
                    {hydroUnitCapacityMw.toFixed(1)} MW
                  </div>
                  <div className="mt-1 font-mono text-[10px] leading-4 text-[#6f8ca1]">
                    Active units remain below rated unit output while the
                    remaining hydraulic head stays in reserve for higher river
                    flow.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#1c2c40] bg-[#09111d] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-[#ffd166]" />
                <div className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  Stability interpretation
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    Frequency behavior
                  </div>
                  <div className="mt-1 font-mono text-sm text-white">
                    {frequency.toFixed(3)} Hz live · Δ {freqDeviation} Hz from
                    nominal
                  </div>
                  <div className="mt-1 font-mono text-[10px] leading-4 text-[#6f8ca1]">
                    The micro-oscillation band demonstrates a stiff
                    interconnected grid rather than an isolated islanded
                    generator.
                  </div>
                </div>
                <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    Demand coverage
                  </div>
                  <div className="mt-1 font-mono text-sm text-white">
                    {hydroInjectedMw.toFixed(1)} MW covering{" "}
                    {demandCoveragePct.toFixed(0)}% of {gridDemandMw.toFixed(1)}{" "}
                    MW demand
                  </div>
                  <div className="mt-1 font-mono text-[10px] leading-4 text-[#6f8ca1]">
                    This station behaves as a partial dispatch contributor
                    inside a larger utility area, not as the sole supply source.
                  </div>
                </div>
                <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    Maximum possible at current flow
                  </div>
                  <div className="mt-1 font-mono text-sm text-white">
                    {hydraulicReserveMw.toFixed(1)} MW available before the
                    hydraulic ceiling is reached
                  </div>
                  <div className="mt-1 font-mono text-[10px] leading-4 text-[#6f8ca1]">
                    Maximum possible at current flow. This reserve is the
                    available operating margin for a future grid-follow or
                    frequency-droop controller.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[#1c2c40] bg-[#09111d] p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#00dcff]" />
              <div className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-white">
                {t.hydroProcess}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              {hydroSteps.map((step, index) => (
                <div
                  key={step.label}
                  className={cn(
                    "rounded-xl border px-4 py-3 transition-all duration-300",
                    step.active
                      ? "border-[#00f7a1]/30 bg-[#00f7a1]/8"
                      : step.complete
                        ? "border-[#00dcff]/20 bg-[#0c1520]"
                        : "border-[#1c2c40] bg-[#0c1118]",
                  )}
                >
                  <div className="font-mono text-[10px] tracking-[0.18em] text-[#5a7a8a]">
                    0{index + 1}
                  </div>
                  <div
                    className={cn(
                      "mt-1 font-display text-[11px] font-semibold uppercase tracking-[0.12em]",
                      step.active ? "text-[#00f7a1]" : "text-white",
                    )}
                  >
                    {step.label}
                  </div>
                  <div className="mt-2 font-mono text-[10px] leading-4 text-[#7f93ac]">
                    {step.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <MetricCard
            label={t.sourceVoltage}
            value={formatVoltageDisplay(voltage)}
            nominal={formatVoltageDisplay(config.baseVoltage)}
            deviation={`${Number(voltageDeviation) >= 0 ? "+" : ""}${voltageDeviation} V`}
            toleranceBand={voltageBand}
            inBand={voltageInBand}
            icon={<Zap className="h-5 w-5" />}
            color="cyan"
            sparkValues={voltageHistory}
            sparkColor="#00dcff"
            t={t}
          />
          <MetricCard
            label={t.gridFrequency}
            value={frequency.toFixed(3)}
            unit="Hz"
            nominal={config.baseFrequency.toFixed(2)}
            deviation={`${Number(freqDeviation) >= 0 ? "+" : ""}${freqDeviation}`}
            toleranceBand={config.frequencyVariation.toFixed(3)}
            inBand={freqInBand}
            icon={<Activity className="h-5 w-5" />}
            color="green"
            sparkValues={freqHistory}
            sparkColor="#00f7a1"
            t={t}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ElecDataCard
            tag={t.utility.tag}
            title={t.utility.title}
            subtitle={SYSTEM.utility.provider || t.utility.provider}
            status={utilityStatus}
            energized={state.isPowered}
            rows={utilityRows}
            t={t}
          />
          <ElecDataCard
            tag={SYSTEM.motor.tag}
            title={t.motorName}
            subtitle={`${SYSTEM.id} / ${SYSTEM.mcc}`}
            status={motorStatus}
            energized={state.motorPowered}
            rows={motorRows}
            t={t}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_1.5fr]">
          <Panel
            title={t.simulationConfig}
            icon={<Gauge className="h-4 w-4" />}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {formFields.map(({ label, key, step, min }) => (
                  <label key={key} className="space-y-2">
                    <span className="block font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">
                      {label}
                    </span>
                    <input
                      type="number"
                      min={min}
                      step={step}
                      value={form[key]}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          [key]: Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-xl border border-[#243245] bg-[#060d16] px-3 py-2 font-mono text-sm text-[#e7edf6] outline-none transition focus:border-[#00dcff]/60"
                    />
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-3 border-t border-[#142030] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-mono text-xs leading-5 tracking-[0.06em] text-[#6a8a9f]">
                  {t.randomWalkDesc}
                </p>
                <button
                  type="submit"
                  className="shrink-0 rounded-xl border border-[#00dcff]/45 bg-[#062032] px-5 py-2 font-display text-sm tracking-[0.14em] text-[#c4f5ff] transition hover:bg-[#0b2c45]"
                >
                  {t.applySimulation}
                </button>
              </div>
            </form>
          </Panel>

          <Panel
            title={t.gridDetails}
            icon={<TrendingUp className="h-4 w-4" />}
          >
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {gridDetails.map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#1c2c40] bg-[#09111d] px-3 py-2"
                >
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">
                    {label}
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 font-mono text-sm tracking-[0.1em]",
                      label === t.voltageStatus || label === t.freqStatus
                        ? value === t.inBand
                          ? "text-[#00f7a1]"
                          : "text-[#ff4d5a]"
                        : label === t.voltageDeviation ||
                            label === t.freqDeviation
                          ? value.startsWith("+")
                            ? "text-[#00dcff]"
                            : "text-[#ffb347]"
                          : "text-[#b8c6d9]",
                    )}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel
          title={`${t.generatorUnits} — ${SYSTEM.id}`}
          icon={<Droplets className="h-4 w-4" />}
          openUrl={`${import.meta.env.BASE_URL}electrical-one-line`}
        >
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#1c2c40] bg-[#09111d] px-4 py-3">
            <div className="flex items-center gap-2">
              <LED on={anyGenActive} color={anyGenActive ? "amber" : "cyan"} />
              <span className="font-display text-xs uppercase tracking-[0.16em] text-[#7f93ac]">
                {anyGenActive
                  ? t.generatorsAvailable(availableGenCount)
                  : t.utilityActiveStandby}
              </span>
            </div>
            <Link
              href="/electrical-one-line"
              className="ml-auto flex items-center gap-1.5 font-display text-xs tracking-[0.14em] text-[#00dcff] transition hover:text-white"
            >
              <Zap className="h-3.5 w-3.5" /> {t.viewInOneLine}
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {SYSTEM.generators.map((gen, idx) => (
              <GeneratorCard
                key={gen.tag}
                genIdx={idx}
                status={generatorStatuses[idx]}
                onStart={() => start(idx)}
                onStop={() => stop(idx)}
                t={t}
              />
            ))}
          </div>
        </Panel>
      </main>
    </div>
  );
}
