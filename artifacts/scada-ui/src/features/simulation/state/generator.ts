import { SYSTEM } from "@/config/system";

export type GenState =
  | "OFFLINE"
  | "STARTING"
  | "STABILIZING"
  | "READY"
  | "LOADED"
  | "STOPPING";

export interface GeneratorLiveStatus {
  state: GenState;
  phaseLabel: string;
  progress: number;
  voltage: number;
  frequency: number;
  current: number;
  activePower: number;
  reactivePower: number;
  voltageHistory: number[];
}

export interface GeneratorConfig {
  nominalVoltage: number;
  nominalFrequency: number;
}

export type Transition = {
  phase: "STARTING" | "STABILIZING" | "STOPPING";
  startedAt: number;
};

export const GENERATOR_SIMULATION = {
  tickMs: 200,
  historyMax: 60,
  startingMs: 4000,
  stabilizingMs: 2500,
  stoppingMs: 4000,
  readyIdleCurrent: 2.5,
  loadedNominalCurrent: 60,
  powerFactor: 0.9,
} as const;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function round(value: number, decimals = 1): number {
  return Number(value.toFixed(decimals));
}

export function computePower(voltage: number, current: number) {
  const apparentPower = voltage * current;
  const activePower = round(apparentPower * GENERATOR_SIMULATION.powerFactor, 1);
  const reactivePower = round(
    Math.sqrt(Math.max(0, apparentPower ** 2 - activePower ** 2)),
    1,
  );

  return { activePower, reactivePower };
}

export function getPhaseLabel(state: GenState): string {
  switch (state) {
    case "OFFLINE":
      return "OFFLINE";
    case "STARTING":
      return "CRANKING";
    case "STABILIZING":
      return "STABILIZING";
    case "READY":
      return "READY FOR ATS TRANSFER";
    case "LOADED":
      return "ON EMERGENCY BUS";
    case "STOPPING":
      return "COASTING DOWN";
    default:
      return "UNKNOWN";
  }
}

export function buildOfflineStatus(): GeneratorLiveStatus {
  return {
    state: "OFFLINE",
    phaseLabel: getPhaseLabel("OFFLINE"),
    progress: 0,
    voltage: 0,
    frequency: 0,
    current: 0,
    activePower: 0,
    reactivePower: 0,
    voltageHistory: [],
  };
}

export function buildReadyStatus(gen: GeneratorConfig): GeneratorLiveStatus {
  const voltage = gen.nominalVoltage;
  const frequency = gen.nominalFrequency;
  const current = GENERATOR_SIMULATION.readyIdleCurrent;
  const { activePower, reactivePower } = computePower(voltage, current);

  return {
    state: "READY",
    phaseLabel: getPhaseLabel("READY"),
    progress: 1,
    voltage,
    frequency,
    current,
    activePower,
    reactivePower,
    voltageHistory: [voltage],
  };
}

export function buildLoadedStatus(gen: GeneratorConfig): GeneratorLiveStatus {
  const voltage = gen.nominalVoltage;
  const frequency = gen.nominalFrequency;
  const current = GENERATOR_SIMULATION.loadedNominalCurrent;
  const { activePower, reactivePower } = computePower(voltage, current);

  return {
    state: "LOADED",
    phaseLabel: getPhaseLabel("LOADED"),
    progress: 1,
    voltage,
    frequency,
    current,
    activePower,
    reactivePower,
    voltageHistory: [voltage],
  };
}

export function pushHistory(history: number[], value: number): number[] {
  return [...history, value].slice(-GENERATOR_SIMULATION.historyMax);
}

export function getGeneratorConfig(idx: number): GeneratorConfig {
  const gen = SYSTEM.generators[idx];
  return {
    nominalVoltage: gen.nominalVoltage,
    nominalFrequency: gen.nominalFrequency,
  };
}
