import {
  buildDigitalInputs,
  buildDigitalOutputs,
  type Alarm,
  type IoPoint,
  type ScadaState,
  type SystemMode,
  type SystemState,
} from "@/features/simulation/state";

interface BuildScadaIoParams {
  disconnectClosed: boolean;
  breakerTripped: boolean;
  hopperHigh: boolean;
  hopperLow: boolean;
  bowlDetected: boolean;
  estopHealthy: boolean;
  feederContactor: boolean;
  solenoidContactor: boolean;
  systemState: SystemState;
}

export function buildScadaIoState({
  disconnectClosed,
  breakerTripped,
  hopperHigh,
  hopperLow,
  bowlDetected,
  estopHealthy,
  feederContactor,
  solenoidContactor,
  systemState,
}: BuildScadaIoParams): { digitalInputs: IoPoint[]; digitalOutputs: IoPoint[] } {
  return {
    digitalInputs: buildDigitalInputs({
      disconnectClosed,
      breakerTripped,
      hopperHigh,
      hopperLow,
      bowlDetected,
      estopHealthy,
    }),
    digitalOutputs: buildDigitalOutputs({
      feederContactor,
      solenoidContactor,
      systemState,
    }),
  };
}

interface BuildScadaStateShapeParams {
  disconnectClosed: boolean;
  breakerTripped: boolean;
  estopPressed: boolean;
  hopperLevel: number;
  bowlLevel: number;
  bowlDetected: boolean;
  feedActive: boolean;
  feederContactor: boolean;
  solenoidContactor: boolean;
  motorPowered: boolean;
  gateOpen: boolean;
  hopperLow: boolean;
  hopperHigh: boolean;
  hopperEmpty: boolean;
  feedCount: number;
  uptime: number;
  voltage: number;
  current: number;
  lastFeedTime: Date | null;
  nextFeedingTime: Date;
  systemState: SystemState;
  systemMode: SystemMode;
  alarms: Alarm[];
  isPowered: boolean;
  isFault: boolean;
  estopHealthy: boolean;
  bowlDemand: boolean;
  digitalInputs: IoPoint[];
  digitalOutputs: IoPoint[];
}

export function buildScadaStateShape(params: BuildScadaStateShapeParams): ScadaState {
  return {
    disconnectClosed: params.disconnectClosed,
    breakerTripped: params.breakerTripped,
    estopPressed: params.estopPressed,
    hopperLevel: params.hopperLevel,
    bowlLevel: params.bowlLevel,
    bowlDetected: params.bowlDetected,
    feedActive: params.feedActive,
    feederContactor: params.feederContactor,
    solenoidContactor: params.solenoidContactor,
    motorPowered: params.motorPowered,
    gateOpen: params.gateOpen,
    hopperLow: params.hopperLow,
    hopperHigh: params.hopperHigh,
    hopperEmpty: params.hopperEmpty,
    feedCount: params.feedCount,
    uptime: params.uptime,
    voltage: params.voltage,
    current: params.current,
    lastFeedTime: params.lastFeedTime,
    nextFeedingTime: params.nextFeedingTime,
    systemState: params.systemState,
    systemMode: params.systemMode,
    alarms: params.alarms,
    isPowered: params.isPowered,
    isFault: params.isFault,
    estopHealthy: params.estopHealthy,
    bowlDemand: params.bowlDemand,
    digitalInputs: params.digitalInputs,
    digitalOutputs: params.digitalOutputs,
  };
}
