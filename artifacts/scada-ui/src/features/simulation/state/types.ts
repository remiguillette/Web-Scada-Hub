export type SystemState = "RUN" | "STANDBY" | "STOP" | "FAULT";
export type AlarmType = "CRITICAL" | "WARNING" | "INFO";
export type SystemMode = "AUTO" | "MANUAL" | "LOCKOUT";

export interface Alarm {
  id: string;
  timestamp: Date;
  message: string;
  active: boolean;
  type: AlarmType;
}

export interface IoPoint {
  id: string;
  label: string;
  on: boolean;
}

export interface ScadaState {
  disconnectClosed: boolean;
  breakerTripped: boolean;
  estopPressed: boolean;
  hopperLevel: number;
  bowlLevel: number;
  bowlDetected: boolean;
  feedActive: boolean;
  feedCount: number;
  uptime: number;
  voltage: number;
  current: number;
  lastFeedTime: Date | null;
  nextFeedingTime: Date;
  alarms: Alarm[];
  feederContactor: boolean;
  solenoidContactor: boolean;
  motorPowered: boolean;
  gateOpen: boolean;
  hopperLow: boolean;
  hopperHigh: boolean;
  hopperEmpty: boolean;
  estopHealthy: boolean;
  bowlDemand: boolean;
  isFault: boolean;
  systemState: SystemState;
  systemMode: SystemMode;
  isPowered: boolean;
  digitalInputs: IoPoint[];
  digitalOutputs: IoPoint[];
}
