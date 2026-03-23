import type { FormEvent } from "react";
import { useGeneratorSimulationContext } from "@/context/GeneratorSimulationContext";
import { useGridSimulationContext } from "@/context/GridSimulationContext";
import { useTranslation } from "@/context/LanguageContext";
import { formatVoltageDisplay } from "@/features/simulation/formatters";
import { useSimulationPageModel } from "@/features/simulation/hooks/useSimulationPageModel";
import { useElectricalMetrics } from "@/hooks/use-electrical-metrics";
import { useScadaState } from "@/hooks/use-scada-state";

export function useSimulationPageController() {
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

  return {
    t,
    locale,
    toggleLocale,
    formatVoltageDisplay,
    model,
    grid,
    state,
    generators: {
      statuses: generatorStatuses,
      start,
      stop,
    },
    handlers: {
      handleSubmit,
    },
  };
}
