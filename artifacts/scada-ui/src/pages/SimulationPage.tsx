import type { FormEvent } from "react";
import { Activity, Zap } from "lucide-react";
import { useGeneratorSimulationContext } from "@/context/GeneratorSimulationContext";
import { useGridSimulationContext } from "@/context/GridSimulationContext";
import { useTranslation } from "@/context/LanguageContext";
import {
  AlarmEventsPanel,
  ElecDataCard,
  GeneratorUnitsPanel,
  MetricCard,
  PlcStatusPanel,
  SimulationPageHeader,
  SimulationOverviewSection,
  SimulationSettingsSection,
} from "@/features/simulation";
import { formatVoltageDisplay } from "@/features/simulation/formatters";
import { useSimulationPageModel } from "@/features/simulation/hooks/useSimulationPageModel";
import { useElectricalMetrics } from "@/hooks/use-electrical-metrics";
import { useScadaState } from "@/hooks/use-scada-state";
import { SYSTEM } from "@/config/system";

export default function SimulationPage() {
  const grid = useGridSimulationContext();
  const { statuses: generatorStatuses, start, stop } = useGeneratorSimulationContext();
  const { state } = useScadaState();
  const { powerFactor, activePower, reactivePower, apparentPower } = useElectricalMetrics(
    grid.voltage,
    state.current,
    state.motorPowered,
  );
  const { t, locale, toggleLocale } = useTranslation();

  const model = useSimulationPageModel({
    t,
    voltage: grid.voltage,
    frequency: grid.frequency,
    gridState: grid.gridState,
    history: grid.history,
    config: grid.config,
    gridEnabled: grid.gridEnabled,
    gridDemandMw: grid.gridDemandMw,
    simulationTimeMinutes: grid.simulationTimeMinutes,
    inflowRate: grid.inflowRate,
    reservoirLevel: grid.reservoirLevel,
    generatedPowerMw: grid.generatedPowerMw,
    hydraulicHeadMeters: grid.hydraulicHeadMeters,
    waterFlowActiveUnits: grid.waterFlowActiveUnits,
    waterToWireEfficiency: grid.waterToWireEfficiency,
    hydroDispatchMode: grid.hydroDispatchMode,
    rawWaterPowerMw: grid.rawWaterPowerMw,
    hydraulicCapacityMw: grid.hydraulicCapacityMw,
    hydraulicReserveMw: grid.hydraulicReserveMw,
    importedGridPowerMw: grid.importedGridPowerMw,
    generatorStatuses,
    state,
    activePower,
    reactivePower,
    apparentPower,
    powerFactor,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    grid.applyConfig();
  };

  return (
    <div className="min-h-screen bg-[#141414] text-[#d6deea]">
      <SimulationPageHeader
        t={t}
        locale={locale}
        toggleLocale={toggleLocale}
        statusNominal={model.voltageInBand && model.freqInBand}
        anyGenActive={model.anyGenActive}
      />

      <main className="mx-auto max-w-[1600px] space-y-5 p-5">
        <SimulationOverviewSection
          t={t}
          gridEnabled={grid.gridEnabled}
          gridState={grid.gridState}
          voltage={grid.voltage}
          frequency={grid.frequency}
          freqDeviation={model.freqDeviation}
          hydroUnitCapacityMw={model.hydroUnitCapacityMw}
          hydroUnitCount={model.hydroUnitCount}
          hydroActiveUnits={model.hydroActiveUnits}
          hydroInjectedMw={model.hydroInjectedMw}
          hydroPerUnitMw={model.hydroPerUnitMw}
          gridDemandMw={grid.gridDemandMw}
          hydroGridState={model.hydroGridState}
          demandGapMw={model.demandGapMw}
          hydraulicReserveMw={grid.hydraulicReserveMw}
          curtailedHydraulicMw={model.curtailedHydraulicMw}
          inflowRate={grid.inflowRate}
          waterFlowPct={model.waterFlowPct}
          reservoirLevel={grid.reservoirLevel}
          reservoirPct={model.reservoirPct}
          hydraulicHeadMeters={grid.hydraulicHeadMeters}
          waterToWireEfficiency={grid.waterToWireEfficiency}
          dayBrightness={model.dayBrightness}
          demandCoveragePct={model.demandCoveragePct}
          importedGridPowerMw={grid.importedGridPowerMw}
          hydraulicCeilingMw={model.hydraulicCeilingMw}
          hydroDispatchMode={grid.hydroDispatchMode}
          formattedSimulationTime={model.formattedSimulationTime}
          hydroSteps={model.hydroSteps}
          toggleGrid={grid.toggleGrid}
          formatVoltageDisplay={formatVoltageDisplay}
        />

        <div className="grid gap-5 xl:grid-cols-2">
          <MetricCard
            label={t.sourceVoltage}
            value={formatVoltageDisplay(grid.voltage)}
            nominal={formatVoltageDisplay(grid.config.baseVoltage)}
            deviation={`${Number(model.voltageDeviation) >= 0 ? "+" : ""}${model.voltageDeviation} V`}
            toleranceBand={model.voltageBand}
            inBand={model.voltageInBand}
            icon={<Zap className="h-5 w-5" />}
            color="cyan"
            sparkValues={model.voltageHistory}
            sparkColor="#00dcff"
            t={t}
          />
          <MetricCard
            label={t.gridFrequency}
            value={grid.frequency.toFixed(3)}
            unit="Hz"
            nominal={grid.config.baseFrequency.toFixed(2)}
            deviation={`${Number(model.freqDeviation) >= 0 ? "+" : ""}${model.freqDeviation}`}
            toleranceBand={grid.config.frequencyVariation.toFixed(3)}
            inBand={model.freqInBand}
            icon={<Activity className="h-5 w-5" />}
            color="green"
            sparkValues={model.freqHistory}
            sparkColor="#00f7a1"
            t={t}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ElecDataCard
            tag={t.utility.tag}
            title={t.utility.title}
            subtitle={SYSTEM.utility.provider || t.utility.provider}
            status={model.utilityStatus}
            energized={state.isPowered}
            rows={model.utilityRows}
            t={t}
          />
          <ElecDataCard
            tag={SYSTEM.motor.tag}
            title={t.motorName}
            subtitle={`${SYSTEM.id} / ${SYSTEM.mcc}`}
            status={model.motorStatus}
            energized={state.motorPowered}
            rows={model.motorRows}
            t={t}
          />
        </div>

        <PlcStatusPanel t={t} state={state} />

        <SimulationSettingsSection
          t={t}
          form={grid.form}
          formFields={model.formFields}
          gridDetails={model.gridDetails}
          onSubmit={handleSubmit}
          setForm={grid.setForm}
        />

        <AlarmEventsPanel t={t} alarms={state.alarms} />

        <GeneratorUnitsPanel
          t={t}
          anyGenActive={model.anyGenActive}
          availableGenCount={model.availableGenCount}
          generatorStatuses={generatorStatuses}
          start={start}
          stop={stop}
        />
      </main>
    </div>
  );
}
