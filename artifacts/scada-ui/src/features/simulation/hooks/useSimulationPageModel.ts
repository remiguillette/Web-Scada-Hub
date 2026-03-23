import { useMemo } from "react";
import { buildUtilitySnapshot } from "@/lib/utility-service";
import { formatSimulationTime, formatVoltageDisplay } from "@/features/simulation/formatters";
import { SYSTEM } from "@/config/system";
import type { Alarm } from "@/hooks/use-scada-state";
import type { GridFormField } from "@/features/simulation";
import type { GridCouplingState, HydroDispatchMode } from "@/context/GridSimulationContext";
import type { GeneratorLiveStatus } from "@/context/GeneratorSimulationContext";
import { useTranslation } from "@/context/LanguageContext";

const HYDRO_UNIT_COUNT = 10;
const HYDRO_UNIT_CAPACITY_MW = 54.8;

interface UseSimulationPageModelParams {
  t: ReturnType<typeof useTranslation>["t"];
  voltage: number;
  frequency: number;
  gridState: GridCouplingState;
  history: Array<{ voltage: number; frequency: number }>;
  config: {
    baseVoltage: number;
    voltageVariationPct: number;
    baseFrequency: number;
    frequencyVariation: number;
    updateIntervalMs?: number;
  };
  gridEnabled: boolean;
  gridDemandMw: number;
  simulationTimeMinutes: number;
  inflowRate: number;
  reservoirLevel: number;
  generatedPowerMw: number;
  hydraulicHeadMeters: number;
  waterFlowActiveUnits: number;
  waterToWireEfficiency: number;
  hydroDispatchMode: HydroDispatchMode;
  rawWaterPowerMw: number;
  hydraulicCapacityMw: number;
  hydraulicReserveMw: number;
  importedGridPowerMw: number;
  generatorStatuses: GeneratorLiveStatus[];
  state: {
    current: number;
    motorPowered: boolean;
    isPowered: boolean;
  };
  activePower: number;
  reactivePower: number;
  apparentPower: number;
  powerFactor: number;
}

export function useSimulationPageModel({
  t,
  voltage,
  frequency,
  gridState,
  history,
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
  generatorStatuses,
  state,
  activePower,
  reactivePower,
  apparentPower,
  powerFactor,
}: UseSimulationPageModelParams) {
  const voltageMin = config.baseVoltage * (1 - config.voltageVariationPct);
  const voltageMax = config.baseVoltage * (1 + config.voltageVariationPct);
  const voltageInBand = voltage >= voltageMin && voltage <= voltageMax;
  const voltageDeviation = (voltage - config.baseVoltage).toFixed(2);
  const voltageBand = (config.baseVoltage * config.voltageVariationPct).toFixed(2);

  const freqMin = config.baseFrequency - config.frequencyVariation;
  const freqMax = config.baseFrequency + config.frequencyVariation;
  const freqInBand = frequency >= freqMin && frequency <= freqMax;
  const freqDeviation = (frequency - config.baseFrequency).toFixed(3);

  const voltageHistory = useMemo(() => history.map((reading) => reading.voltage), [history]);
  const freqHistory = useMemo(() => history.map((reading) => reading.frequency), [history]);

  const runningGeneratorFreqs = generatorStatuses
    .filter((status) => status.state !== "OFFLINE")
    .map((status) => status.frequency);
  const plantFrequency =
    runningGeneratorFreqs.length > 0
      ? runningGeneratorFreqs.reduce((sum, currentFrequency) => sum + currentFrequency, 0) /
        runningGeneratorFreqs.length
      : config.baseFrequency;

  const gridDetails = useMemo(
    () => [
      { label: t.nominalVoltage, value: formatVoltageDisplay(config.baseVoltage) },
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
      { label: t.nominalFrequency, value: `${config.baseFrequency.toFixed(2)} Hz` },
      { label: t.liveFrequency, value: `${frequency.toFixed(3)} Hz` },
      { label: t.plantFrequency, value: `${plantFrequency.toFixed(3)} Hz` },
      { label: t.freqMin, value: `${freqMin.toFixed(3)} Hz` },
      { label: t.freqMax, value: `${freqMax.toFixed(3)} Hz` },
      {
        label: t.freqDeviation,
        value: `${Number(freqDeviation) >= 0 ? "+" : ""}${freqDeviation} Hz`,
      },
      { label: t.freqBand, value: `${config.frequencyVariation.toFixed(3)} Hz` },
      { label: t.sampleInterval, value: `${config.updateIntervalMs ?? 1000} ms` },
      { label: t.historySamples, value: `${history.length}` },
      { label: t.voltageStatus, value: voltageInBand ? t.inBand : t.outOfBand },
      { label: t.freqStatus, value: freqInBand ? t.inBand : t.outOfBand },
    ],
    [
      config,
      freqInBand,
      freqMax,
      freqMin,
      freqDeviation,
      frequency,
      gridState,
      history.length,
      plantFrequency,
      t,
      voltage,
      voltageDeviation,
      voltageInBand,
      voltageMax,
      voltageMin,
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
    [activePower, apparentPower, frequency, powerFactor, reactivePower, state.current, state.isPowered],
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
    [frequency, t, utilitySnapshot],
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
        description: state.motorPowered ? t.motorCurrentRunning : t.motorCurrentStopped,
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
        value: `${state.motorPowered ? powerFactor.toFixed(3) : "—"} cosφ`,
        description: t.motorPfDesc(SYSTEM.motor.powerFactor),
      },
    ],
    [activePower, frequency, powerFactor, reactivePower, state.current, state.motorPowered, t, voltage],
  );

  const anyGenActive = generatorStatuses.some((status) => status.state !== "OFFLINE");
  const availableGenCount = generatorStatuses.filter(
    (status) => status.state === "READY" || status.state === "LOADED",
  ).length;
  const hydroActiveUnits = waterFlowActiveUnits;
  const hydroTargetMw = hydroActiveUnits * HYDRO_UNIT_CAPACITY_MW;
  const hydroInjectedMw = generatedPowerMw;
  const hydroPerUnitMw = hydroActiveUnits > 0 ? hydroInjectedMw / hydroActiveUnits : 0;
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
  const reservoirPct = Math.max(0, Math.min(100, ((reservoirLevel - 92) / (108 - 92)) * 100));
  const demandCoveragePct = gridDemandMw > 0 ? Math.min(100, (hydroInjectedMw / gridDemandMw) * 100) : 0;
  const dayBrightness = Math.max(0.35, Math.sin((simulationTimeMinutes / 1440) * Math.PI));

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

  const utilityStatus = state.isPowered ? t.utility.status.energized : t.utility.status.unavailable;
  const motorStatus = state.motorPowered ? t.running : state.isPowered ? t.standby : t.genStateOffline;

  const formFields: GridFormField[] = [
    { label: t.baseVoltage, key: "baseVoltage", step: "0.1", min: "1" },
    { label: t.baseFrequency, key: "baseFrequency", step: "0.001", min: "59.9", max: "60.1" },
    { label: t.voltageTolerance2, key: "voltageTolerancePct", step: "0.1", min: "0" },
    { label: t.frequencyBand, key: "frequencyVariation", step: "0.001", min: "0", max: "0.1" },
    { label: t.gridDemand, key: "gridDemandMw", step: "1", min: "0" },
  ];

  return {
    voltageMin,
    voltageMax,
    voltageInBand,
    voltageDeviation,
    voltageBand,
    freqMin,
    freqMax,
    freqInBand,
    freqDeviation,
    voltageHistory,
    freqHistory,
    gridDetails,
    utilityRows,
    motorRows,
    anyGenActive,
    availableGenCount,
    hydroUnitCount: HYDRO_UNIT_COUNT,
    hydroUnitCapacityMw: HYDRO_UNIT_CAPACITY_MW,
    hydroActiveUnits,
    hydroInjectedMw,
    hydroPerUnitMw,
    curtailedHydraulicMw,
    demandGapMw,
    hydraulicCeilingMw,
    hydroGridState,
    waterFlowPct,
    reservoirPct,
    demandCoveragePct,
    dayBrightness,
    hydroSteps,
    utilityStatus,
    motorStatus,
    formFields,
    formattedSimulationTime: formatSimulationTime(simulationTimeMinutes),
  };
}
