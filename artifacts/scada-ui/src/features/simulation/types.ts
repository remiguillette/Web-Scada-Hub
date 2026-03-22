export type MetricCardColor = "cyan" | "green";

export interface SimulationTableRow {
  parameter: string;
  value: string;
  description: string;
}

export interface GridFormField {
  label: string;
  key: "baseVoltage" | "baseFrequency" | "voltageTolerancePct" | "frequencyVariation" | "gridDemandMw";
  step: string;
  min: string;
  max?: string;
}

export interface GenStateConfig {
  border: string;
  bg: string;
  badgeText: string;
  badgeStyle: string;
  ledColor: "green" | "amber" | "red" | "cyan";
  ledOn: boolean;
}

export type RampPhaseTranslationKey =
  | "phaseCranking"
  | "phaseBuildingVoltage"
  | "phaseReachingRatedSpeed"
  | "phaseReadyForAts";

export interface RampPhase {
  key: RampPhaseTranslationKey;
  label: string;
  threshold: number;
}
