import { Activity, AlertTriangle, CheckCircle2, Droplets, Factory, Gauge, Power, TrendingUp, Waves, Zap } from "lucide-react";
import { LED } from "@/components/LED";
import { StatusBadge } from "@/features/simulation";
import { cn } from "@/lib/utils";
import type { HydroDispatchMode } from "@/context/GridSimulationContext";
import { useTranslation } from "@/context/LanguageContext";

interface HydroStep {
  label: string;
  description: string;
  active: boolean;
  complete: boolean;
}

interface SimulationOverviewSectionProps {
  t: ReturnType<typeof useTranslation>["t"];
  gridEnabled: boolean;
  gridState: "DISCONNECTED" | "SYNCHRONIZING" | "CONNECTED";
  voltage: number;
  frequency: number;
  freqDeviation: string;
  hydroUnitCapacityMw: number;
  hydroUnitCount: number;
  hydroActiveUnits: number;
  hydroInjectedMw: number;
  hydroPerUnitMw: number;
  gridDemandMw: number;
  hydroGridState: string;
  demandGapMw: number;
  hydraulicReserveMw: number;
  curtailedHydraulicMw: number;
  inflowRate: number;
  waterFlowPct: number;
  reservoirLevel: number;
  reservoirPct: number;
  hydraulicHeadMeters: number;
  waterToWireEfficiency: number;
  dayBrightness: number;
  demandCoveragePct: number;
  importedGridPowerMw: number;
  hydraulicCeilingMw: number;
  hydroDispatchMode: HydroDispatchMode;
  formattedSimulationTime: string;
  hydroSteps: HydroStep[];
  toggleGrid: () => void;
  formatVoltageDisplay: (value: number) => string;
}

export function SimulationOverviewSection({
  t,
  gridEnabled,
  gridState,
  voltage,
  frequency,
  hydroUnitCapacityMw,
  hydroUnitCount,
  hydroActiveUnits,
  hydroInjectedMw,
  hydroPerUnitMw,
  gridDemandMw,
  hydroGridState,
  demandGapMw,
  hydraulicReserveMw,
  curtailedHydraulicMw,
  inflowRate,
  waterFlowPct,
  reservoirLevel,
  reservoirPct,
  hydraulicHeadMeters,
  waterToWireEfficiency,
  dayBrightness,
  demandCoveragePct,
  importedGridPowerMw,
  hydraulicCeilingMw,
  hydroDispatchMode,
  formattedSimulationTime,
  hydroSteps,
  toggleGrid,
  formatVoltageDisplay,
  freqDeviation,
}: SimulationOverviewSectionProps) {
  return (
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
              gridEnabled ? "border-[#00dcff]/20 bg-[#09111d]" : "border-[#1c2c40] bg-[#09111d]",
            )}
          >
            <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.sourceVoltage}</div>
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
              gridEnabled ? "border-[#00f7a1]/20 bg-[#09111d]" : "border-[#1c2c40] bg-[#09111d]",
            )}
          >
            <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.sourceFrequency}</div>
            <div
              className={cn(
                "mt-1 font-mono text-2xl font-semibold tracking-[0.06em] transition-colors duration-500",
                gridEnabled ? "text-[#00f7a1]" : "text-[#334155]",
              )}
            >
              {gridEnabled ? frequency.toFixed(2) : "0.00"} <span className="text-sm font-normal text-[#5a7a8a]">Hz</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#1c2c40] bg-[#09111d] px-4 py-3">
            <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.syncIndicator}</div>
            <div className="mt-1 flex items-center gap-2">
              <LED
                on={gridState === "CONNECTED"}
                color={gridState === "CONNECTED" ? "green" : gridState === "SYNCHRONIZING" ? "amber" : "cyan"}
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
            <div className="mt-1 font-mono text-[10px] text-[#4a5a6a]">{t.powerSourceDesc}</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1c2c40] bg-[#09111d] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.plantOverview}</div>
              <div className="font-mono text-[11px] tracking-[0.12em] text-[#8aa0b6]">
                548 MW / 10 hydro units / {hydroUnitCapacityMw.toFixed(1)} MW per unit
              </div>
            </div>
            <StatusBadge
              ok={gridState === "CONNECTED"}
              okLabel={t.gridEnergized}
              faultLabel={gridState === "SYNCHRONIZING" ? t.syncInProgress : t.syncReady}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.activeUnits}</div>
              <div className="mt-1 font-mono text-2xl font-semibold tracking-[0.06em] text-[#00f7a1]">
                {hydroActiveUnits} <span className="text-sm font-normal text-[#5a7a8a]">/ {hydroUnitCount}</span>
              </div>
              <div className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#6f8ca1]">
                {hydroActiveUnits > 0 ? `${hydroPerUnitMw.toFixed(1)} MW per unit (54.8 MW max)` : "No units dispatched"}
              </div>
            </div>
            <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.gridDemand}</div>
              <div className="mt-1 font-mono text-2xl font-semibold tracking-[0.06em] text-[#00dcff]">
                {gridDemandMw.toFixed(0)} <span className="text-sm font-normal text-[#5a7a8a]">MW</span>
              </div>
            </div>
            <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.totalInjectedPower}</div>
              <div className="mt-1 font-mono text-2xl font-semibold tracking-[0.06em] text-[#00dcff]">
                {hydroInjectedMw.toFixed(1)} <span className="text-sm font-normal text-[#5a7a8a]">MW</span>
              </div>
              <div className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#6f8ca1]">P = ρ·g·Q·H·η</div>
            </div>
            <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.gridState}</div>
              <div className={cn("mt-1 font-mono text-sm tracking-[0.12em]", gridEnabled ? "text-[#00f7a1]" : "text-[#ffd166]")}>{hydroGridState}</div>
            </div>
            <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.injectedPower}</div>
              <div className="mt-1 font-mono text-sm tracking-[0.12em] text-[#b8c6d9]">
                {gridEnabled ? hydroInjectedMw.toFixed(1) : "0.0"} MW @ {gridEnabled ? frequency.toFixed(2) : "60.00"} Hz
              </div>
              <div className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#6f8ca1]">
                {hydroActiveUnits > 0 ? `${hydroPerUnitMw.toFixed(1)} MW per unit` : "Awaiting dispatch"}
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
          <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.couplingBreaker}</div>
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
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.waterFlowPanel}</div>
              <div className="font-mono text-[11px] tracking-[0.12em] text-[#8aa0b6]">{t.waterFlowSubtitle}</div>
            </div>
            <StatusBadge ok={gridEnabled} okLabel={t.waterDrivingTurbines} faultLabel={t.waterOnStandby} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#114156] bg-[#071520] p-4">
              <div className="flex items-center gap-2 text-[#5cc8ff]">
                <Droplets className="h-4 w-4" />
                <span className="font-display text-[10px] uppercase tracking-[0.18em]">{t.waterFlowRate}</span>
              </div>
              <div className="mt-2 font-mono text-2xl font-semibold text-[#dff8ff]">
                {inflowRate.toFixed(1)} <span className="text-sm font-normal text-[#7fb2cf]">m³/s</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#0d2532]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#1b7da7] via-[#27b7ff] to-[#78e3ff]" style={{ width: `${waterFlowPct}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-[#144e44] bg-[#081712] p-4">
              <div className="flex items-center gap-2 text-[#00f7a1]">
                <Waves className="h-4 w-4" />
                <span className="font-display text-[10px] uppercase tracking-[0.18em]">{t.reservoirLevelLabel}</span>
              </div>
              <div className="mt-2 font-mono text-2xl font-semibold text-[#e7fff4]">
                {reservoirLevel.toFixed(2)} <span className="text-sm font-normal text-[#7fb2cf]">m</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#0b241d]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#0d6b52] via-[#00c27d] to-[#8cf7cb]" style={{ width: `${reservoirPct}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.hydraulicHead}</div>
              <div className="mt-1 font-mono text-xl font-semibold text-[#ffd166]">
                {hydraulicHeadMeters.toFixed(1)} <span className="text-sm font-normal text-[#7f93ac]">m</span>
              </div>
            </div>
            <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.waterToWireEfficiencyLabel}</div>
              <div className="mt-1 font-mono text-xl font-semibold text-[#00dcff]">
                {(waterToWireEfficiency * 100).toFixed(0)} <span className="text-sm font-normal text-[#7f93ac]">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1c2c40] bg-[#09111d] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.waterFlowScriptTitle}</div>
              <div className="font-mono text-[11px] tracking-[0.12em] text-[#8aa0b6]">{t.waterFlowScriptDesc}</div>
            </div>
            <div className="rounded-lg border border-[#1c2c40] bg-[#0c1520] px-3 py-2 text-right">
              <div className="font-display text-[9px] uppercase tracking-[0.18em] text-[#5a7a8a]">{t.simulationClock}</div>
              <div className="font-mono text-sm text-white">{formattedSimulationTime}</div>
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
                <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5cc8ff]">{t.waterIntake}</div>
                <div className="mt-1 font-mono text-sm text-white">
                  {inflowRate.toFixed(1)} m³/s · {hydraulicHeadMeters.toFixed(1)} m · {(waterToWireEfficiency * 100).toFixed(0)}% η
                </div>
                <div className="mt-1 font-mono text-[10px] leading-4 text-[#7fb2cf]">{t.waterIntakeDesc}</div>
              </div>
              <div className="hidden md:block font-mono text-xl text-[#27b7ff]">→</div>
              <div className="rounded-xl border border-[#144e44] bg-[#081712]/90 p-3">
                <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#00f7a1]">{t.turbineGovernor}</div>
                <div className="mt-1 font-mono text-sm text-white">
                  {hydroActiveUnits} / {hydroUnitCount} {t.activeUnits.toLowerCase()}
                </div>
                <div className="mt-1 font-mono text-[10px] leading-4 text-[#8acfb6]">{t.turbineGovernorDesc}</div>
              </div>
              <div className="hidden md:block font-mono text-xl text-[#ffd166]">→</div>
              <div className="rounded-xl border border-[#3b3320] bg-[#171108]/90 p-3">
                <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#ffd166]">{t.teacherDeliveryNode}</div>
                <div className="mt-1 font-mono text-sm text-white">
                  {hydroInjectedMw.toFixed(1)} MW · {demandCoveragePct.toFixed(0)}%
                </div>
                <div className="mt-1 font-mono text-[10px] leading-4 text-[#d1b77b]">{t.teacherDeliveryNodeDesc}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
        <div className="rounded-xl border border-[#1c2c40] bg-[#09111d] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">OPERATIONS COUPLING NOTES</div>
              <div className="font-mono text-[11px] tracking-[0.12em] text-[#8aa0b6]">Control-room interpretation of the live hydraulic, production, and grid states.</div>
            </div>
            <StatusBadge ok={hydroDispatchMode === "PHYSICS"} okLabel="PHYSICS MODE" faultLabel="GRID FOLLOW MODE" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">Dispatch mode</div>
              <div className="mt-1 font-mono text-lg font-semibold text-white">{hydroDispatchMode}</div>
              <div className="mt-1 font-mono text-[10px] leading-4 text-[#6f8ca1]">Water availability sets the plant ceiling first, then the grid absorbs whatever the station can export.</div>
            </div>
            <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">Grid support balance</div>
              <div className="mt-1 font-mono text-lg font-semibold text-[#00dcff]">{importedGridPowerMw.toFixed(1)} MW import</div>
              <div className="mt-1 font-mono text-[10px] leading-4 text-[#6f8ca1]">Remaining demand is supplied by the external network whenever station output stays below system load.</div>
            </div>
            <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">Maximum possible at current flow</div>
              <div className="mt-1 font-mono text-lg font-semibold text-[#ffd166]">{hydraulicCeilingMw.toFixed(1)} MW</div>
              <div className="mt-1 font-mono text-[10px] leading-4 text-[#6f8ca1]">Computed from ρ·g·Q·H·η and clipped to the 10-unit plant maximum of {(hydroUnitCount * hydroUnitCapacityMw).toFixed(0)} MW.</div>
            </div>
            <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">Unit loading margin</div>
              <div className="mt-1 font-mono text-lg font-semibold text-[#00f7a1]">{hydroPerUnitMw.toFixed(1)} / {hydroUnitCapacityMw.toFixed(1)} MW</div>
              <div className="mt-1 font-mono text-[10px] leading-4 text-[#6f8ca1]">Active units remain below rated unit output while the remaining hydraulic head stays in reserve for higher river flow.</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1c2c40] bg-[#09111d] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#ffd166]" />
            <div className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-white">Stability interpretation</div>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">Frequency behavior</div>
              <div className="mt-1 font-mono text-sm text-white">
                {frequency.toFixed(3)} Hz live · Δ {freqDeviation} Hz from nominal
              </div>
              <div className="mt-1 font-mono text-[10px] leading-4 text-[#6f8ca1]">
                The micro-oscillation band demonstrates a stiff interconnected grid rather than an isolated islanded generator.
              </div>
            </div>
            <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">Demand coverage</div>
              <div className="mt-1 font-mono text-sm text-white">
                {hydroInjectedMw.toFixed(1)} MW covering {demandCoveragePct.toFixed(0)}% of {gridDemandMw.toFixed(1)} MW demand
              </div>
              <div className="mt-1 font-mono text-[10px] leading-4 text-[#6f8ca1]">
                This station behaves as a partial dispatch contributor inside a larger utility area, not as the sole supply source.
              </div>
            </div>
            <div className="rounded-xl border border-[#1c2c40] bg-[#0c1520] px-4 py-3">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">Maximum possible at current flow</div>
              <div className="mt-1 font-mono text-sm text-white">
                {hydraulicReserveMw.toFixed(1)} MW available before the hydraulic ceiling is reached
              </div>
              <div className="mt-1 font-mono text-[10px] leading-4 text-[#6f8ca1]">
                Maximum possible at current flow. This reserve is the available operating margin for a future grid-follow or frequency-droop controller.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#1c2c40] bg-[#09111d] p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#00dcff]" />
          <div className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-white">{t.hydroProcess}</div>
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
              <div className="font-mono text-[10px] tracking-[0.18em] text-[#5a7a8a]">0{index + 1}</div>
              <div className={cn("mt-1 font-display text-[11px] font-semibold uppercase tracking-[0.12em]", step.active ? "text-[#00f7a1]" : "text-white")}>{step.label}</div>
              <div className="mt-2 font-mono text-[10px] leading-4 text-[#7f93ac]">{step.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
