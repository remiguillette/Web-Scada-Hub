import type { GridFormValues } from "@/context/GridSimulationContext";
import type { Alarm, AlarmType, IoPoint, ScadaState } from "./types";

const GRID_BASE_FREQUENCY_MIN = 59.9;
const GRID_BASE_FREQUENCY_MAX = 60.1;
const GRID_FREQUENCY_VARIATION_MAX = 0.1;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function sanitizeGridForm(form: GridFormValues): GridFormValues {
  return {
    ...form,
    baseFrequency: Number(clamp(form.baseFrequency, GRID_BASE_FREQUENCY_MIN, GRID_BASE_FREQUENCY_MAX).toFixed(3)),
    frequencyVariation: Number(clamp(form.frequencyVariation, 0, GRID_FREQUENCY_VARIATION_MAX).toFixed(3)),
  };
}

export interface ScadaCoreState {
  disconnectClosed: boolean;
  breakerTripped: boolean;
  estopPressed: boolean;
  hopperLevel: number;
  bowlLevel: number;
  bowlDetected: boolean;
  feedActive: boolean;
}

export function deriveScadaState(core: ScadaCoreState) {
  const isPowered = core.disconnectClosed && !core.breakerTripped;
  const feederContactor = isPowered && !core.estopPressed && core.feedActive;
  const solenoidContactor = isPowered && !core.estopPressed && core.feedActive;
  const motorPowered = feederContactor;
  const gateOpen = solenoidContactor;
  const hopperLow = core.hopperLevel <= 25;
  const hopperHigh = core.hopperLevel >= 55;
  const hopperEmpty = core.hopperLevel <= 0;
  const estopHealthy = !core.estopPressed;
  const bowlDemand = core.bowlLevel <= 35;
  const isFault = core.breakerTripped || core.estopPressed || hopperEmpty;
  const systemState: ScadaState["systemState"] = isFault
    ? "FAULT"
    : core.feedActive
      ? "RUN"
      : isPowered
        ? "STANDBY"
        : "STOP";
  const systemMode: ScadaState["systemMode"] = isFault
    ? "LOCKOUT"
    : core.disconnectClosed
      ? "AUTO"
      : "MANUAL";

  return {
    isPowered,
    feederContactor,
    solenoidContactor,
    motorPowered,
    gateOpen,
    hopperLow,
    hopperHigh,
    hopperEmpty,
    estopHealthy,
    bowlDemand,
    isFault,
    systemState,
    systemMode,
  };
}

export function buildDigitalInputs(params: {
  disconnectClosed: boolean;
  breakerTripped: boolean;
  hopperHigh: boolean;
  hopperLow: boolean;
  bowlDetected: boolean;
  estopHealthy: boolean;
}): IoPoint[] {
  return [
    { id: "DI-01", label: "MDS-001 ON", on: params.disconnectClosed },
    { id: "DI-02", label: "CB-001 OK", on: !params.breakerTripped },
    { id: "DI-03", label: "HOPPER HIGH", on: params.hopperHigh },
    { id: "DI-04", label: "HOPPER LOW", on: params.hopperLow },
    { id: "DI-05", label: "BOWL DETECT", on: params.bowlDetected },
    { id: "DI-06", label: "ESTOP NC", on: params.estopHealthy },
  ];
}

export function buildDigitalOutputs(params: {
  feederContactor: boolean;
  solenoidContactor: boolean;
  systemState: ScadaState["systemState"];
}): IoPoint[] {
  return [
    { id: "DO-01", label: "FEEDER CTR", on: params.feederContactor },
    { id: "DO-02", label: "HOPPER SOL", on: params.solenoidContactor },
    { id: "DO-03", label: "BEACON GRN", on: params.systemState === "RUN" || params.systemState === "STANDBY" },
    { id: "DO-04", label: "BEACON RED", on: params.systemState === "FAULT" },
  ];
}

export function createAlarm(message: string, type: AlarmType, active: boolean): Alarm {
  return {
    id: Math.random().toString(36).slice(2, 10),
    timestamp: new Date(),
    message,
    active,
    type,
  };
}
