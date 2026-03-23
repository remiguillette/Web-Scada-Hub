import { useMemo, type FormEvent } from "react";
import { format } from "date-fns";
import { Link } from "wouter";
import {
  Activity,
  CircuitBoard,
  Gauge,
  Languages,
  Zap,
  Factory,
  TrendingUp,
  CheckCircle2,
  Droplets,
  Power,
  Waves,
  AlertTriangle,
  Siren,
} from "lucide-react";
import { Panel } from "@/components/Panel";
import { LED } from "@/components/LED";
import { useGridSimulationContext } from "@/context/GridSimulationContext";
import { useGeneratorSimulationContext } from "@/context/GeneratorSimulationContext";
import { useScadaState, type Alarm } from "@/hooks/use-scada-state";
import { useElectricalMetrics } from "@/hooks/use-electrical-metrics";
import { useTranslation } from "@/context/LanguageContext";
import { SYSTEM } from "@/config/system";
import { cn } from "@/lib/utils";
import { buildUtilitySnapshot } from "@/lib/utility-service";
import { ElecDataCard, GeneratorCard, MetricCard, StatusBadge, type GridFormField } from "@/features/simulation";
import { HeaderRouteAction } from "@/features/navigation/components/HeaderRouteAction";

const ALARM_STYLE: Record<Alarm["type"], string> = {
  CRITICAL: "border-[#d5565a]/30 bg-[#2a1012] text-[#f3c5c9]",
  WARNING: "border-[#d89a5a]/30 bg-[#2b1a0f] text-[#f6deb1]",
  INFO: "border-[#6cc2d5]/20 bg-[#0a2228] text-[#b8dbe3]",
};

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

  const handleSubmit = (e: FormEvent) => {
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

  const utilitySnapshot = useMemo(
    () =>
      buildUtilitySnapshot({
        energized: state.isPowered,
        frequency,
        current: state.current,
        activePower,
        apparentPower,
        reactivePower,
        powerFactor,
      }),
    [
      state.isPowered,
      frequency,
      state.current,
      activePower,
      apparentPower,
      reactivePower,
      powerFactor,
    ],
  );

  const utilityRows = useMemo(
    () => [
      {
        parameter: t.utility.details.serviceType.label,
        value: utilitySnapshot.serviceType,
        description: t.utility.details.serviceType.desc,
      },
      {
        parameter: t.utility.details.utilityType.label,
        value: utilitySnapshot.utilityType,
        description: t.utility.details.utilityType.desc,
      },
      {
        parameter: t.utility.details.frequency.label,
        value: `${frequency.toFixed(2)} Hz`,
        description: t.utility.details.frequency.desc,
      },
      {
        parameter: t.utility.details.voltageLL.label,
        value: `${utilitySnapshot.lineToLineVoltage.toFixed(1)} V`,
        description: t.utility.details.voltageLL.desc,
      },
      {
        parameter: t.utility.details.voltageLN.label,
        value: `${utilitySnapshot.lineToNeutralVoltage.toFixed(1)} V`,
        description: t.utility.details.voltageLN.desc,
      },
      {
        parameter: t.utility.details.current.label,
        value: `${utilitySnapshot.totalServiceCurrent.toFixed(1)} A`,
        description: t.utility.details.current.desc,
      },
      {
        parameter: t.utility.details.activePower.label,
        value: `${utilitySnapshot.activePowerKw.toFixed(1)} kW`,
        description: t.utility.details.activePower.desc,
      },
      {
        parameter: t.utility.details.apparentPower.label,
        value: `${utilitySnapshot.apparentPowerKva.toFixed(1)} kVA`,
        description: t.utility.details.apparentPower.desc,
      },
      {
        parameter: t.utility.details.reactivePower.label,
        value: `${utilitySnapshot.reactivePowerKvar.toFixed(1)} kVAR`,
        description: t.utility.details.reactivePower.desc,
      },
      {
        parameter: t.utility.details.powerFactor.label,
        value: `${utilitySnapshot.powerFactor.toFixed(3)} ${utilitySnapshot.powerFactorState}`,
        description: t.utility.details.powerFactor.desc,
      },
      {
        parameter: t.utility.details.phaseBalance.label,
        value: `${utilitySnapshot.voltageImbalancePct.toFixed(1)}%`,
        description: t.utility.details.phaseBalance.desc,
      },
      {
        parameter: t.utility.details.source.label,
        value: utilitySnapshot.source,
        description: t.utility.details.source.desc,
      },
    ],
    [t, frequency, utilitySnapshot],
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

  const formFields: GridFormField[] = [
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
      min: "59.9",
      max: "60.1",
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
      max: "0.1",
    },
    { label: t.gridDemand, key: "gridDemandMw" as const, step: "1", min: "0" },
  ];

  return (
    <div className="min-h-screen bg-[#141414] text-[#d6deea]">
      <header className="sticky top-0 z-20 border-b border-[#2a2a2a] bg-[#0d0d0d]/95 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
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
            <HeaderRouteAction
              href="/"
              icon={<Zap className="h-3.5 w-3.5" />}
              label={t.electricalOneLineLink}
            />
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

        <Panel title={t.plcStatus} icon={<CircuitBoard className="h-4 w-4" />}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1c2c40] bg-[#09111d] px-4 py-3">
            <div>
              <div className="font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">{t.controllerHealth}</div>
              <div className="mt-1 font-mono text-sm tracking-[0.16em] text-[#cfe6f4]">{t.controllerHealthStatus}</div>
            </div>
            <div className="flex items-center gap-5 rounded-xl border border-[#243245] bg-[#060d16] px-4 py-3">
              <LED on={state.systemState === "RUN"} color="green" label="RUN" />
              <LED on={state.systemState === "STANDBY" || state.systemState === "STOP"} color="amber" label="STOP" />
              <LED on={state.systemState === "FAULT"} color="red" label="FLT" />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-[#1c2c40] bg-[#09111d] p-4">
              <div className="mb-4 font-display text-sm uppercase tracking-[0.16em] text-[#cfd8e3]">{t.discreteInputs}</div>
              <div className="space-y-3">
                {state.digitalInputs.map((point) => (
                  <div key={point.id} className="flex items-center gap-3 rounded-lg border border-[#142030] bg-[#07101a] px-3 py-2">
                    <LED on={point.on} color={point.id === "DI-04" && point.on ? "amber" : point.id === "DI-06" && !point.on ? "red" : "green"} />
                    <span className="font-mono text-sm tracking-[0.14em] text-[#9fb0c7]">{point.id}</span>
                    <span className="font-display text-sm tracking-[0.08em] text-[#d6deea]">{point.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#1c2c40] bg-[#09111d] p-4">
              <div className="mb-4 font-display text-sm uppercase tracking-[0.16em] text-[#cfd8e3]">{t.discreteOutputs}</div>
              <div className="space-y-3">
                {state.digitalOutputs.map((point) => (
                  <div key={point.id} className="flex items-center gap-3 rounded-lg border border-[#142030] bg-[#07101a] px-3 py-2">
                    <LED on={point.on} color={point.id === "DO-04" ? "red" : point.id === "DO-03" ? "cyan" : "green"} />
                    <span className="font-mono text-sm tracking-[0.14em] text-[#9fb0c7]">{point.id}</span>
                    <span className="font-display text-sm tracking-[0.08em] text-[#d6deea]">{point.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[1fr_1.5fr]">
          <Panel
            title={t.simulationConfig}
            icon={<Gauge className="h-4 w-4" />}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {formFields.map(({ label, key, step, min, max }) => (
                  <label key={key} className="space-y-2">
                    <span className="block font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">
                      {label}
                    </span>
                    <input
                      type="number"
                      min={min}
                      step={step}
                      max={max}
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

        <Panel title={t.alarmsEvents} icon={<Siren className="h-4 w-4" />}>
          <div className="space-y-3">
            {state.alarms.map((alarm) => (
              <div key={alarm.id} className={cn("rounded-2xl border p-3", ALARM_STYLE[alarm.type], alarm.active && alarm.type === "CRITICAL" ? "alarm-blink" : "")}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <LED on color={alarm.type === "CRITICAL" ? "red" : alarm.type === "WARNING" ? "amber" : "cyan"} />
                    <div>
                      <div className="font-display text-sm uppercase tracking-[0.12em]">{alarm.message}</div>
                      <div className="mt-1 font-mono text-xs tracking-[0.14em] text-[#93a6bf]">{format(alarm.timestamp, "yyyy-MM-dd HH:mm:ss")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-md border border-current/20 px-2 py-1 font-mono text-[11px] tracking-[0.18em]">{alarm.type}</span>
                    <span className={cn("rounded-md px-2 py-1 font-mono text-[11px] tracking-[0.18em]", alarm.active ? "bg-[#ffffff14] text-white" : "bg-[#00000026] text-[#9fb0c7]")}>{alarm.active ? t.alarmActive : t.alarmEvent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title={`${t.generatorUnits} — ${SYSTEM.id}`}
          icon={<Droplets className="h-4 w-4" />}
          openUrl={import.meta.env.BASE_URL}
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
              href="/"
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
