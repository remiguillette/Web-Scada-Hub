import { SYSTEM } from "@/config/system";

export interface UtilitySnapshot {
  serviceType: string;
  utilityType: string;
  lineToLineVoltage: number;
  lineToNeutralVoltage: number;
  totalServiceCurrent: number;
  activePowerKw: number;
  apparentPowerKva: number;
  reactivePowerKvar: number;
  powerFactor: number;
  powerFactorState: "lagging" | "leading";
  voltageImbalancePct: number;
  source: string;
}

const NOMINAL_LINE_TO_NEUTRAL_V = 347;
const NOMINAL_LINE_TO_LINE_V = 600;
const BASE_SERVICE_CURRENT_A = 412;
const MIN_POWER_FACTOR = 0.95;
const MAX_POWER_FACTOR = 0.99;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function buildUtilitySnapshot(options: {
  energized: boolean;
  frequency: number;
  current: number;
  apparentPower?: number;
  activePower?: number;
  reactivePower?: number;
  powerFactor?: number;
}): UtilitySnapshot {
  const {
    energized,
    frequency,
    current,
    apparentPower = 0,
    activePower = 0,
    reactivePower = 0,
    powerFactor = 1,
  } = options;

  if (!energized) {
    return {
      serviceType: "600Y/347 V — 3Φ 4-wire grounded",
      utilityType: "Local Distribution Company (LDC)",
      lineToLineVoltage: 0,
      lineToNeutralVoltage: 0,
      totalServiceCurrent: 0,
      activePowerKw: 0,
      apparentPowerKva: 0,
      reactivePowerKvar: 0,
      powerFactor: 0,
      powerFactorState: "lagging",
      voltageImbalancePct: 0,
      source: "13.8 kV feeder → local transformer",
    };
  }

  const phaseSeed = frequency * 10 + current * 0.35;
  const lineToNeutralVoltage = Number(
    clamp(
      NOMINAL_LINE_TO_NEUTRAL_V + Math.sin(phaseSeed) * 1.4,
      344,
      349,
    ).toFixed(1),
  );
  const lineToLineVoltage = Number(
    clamp(lineToNeutralVoltage * Math.sqrt(3), 596, 603).toFixed(1),
  );
  const normalizedPf = clamp(powerFactor, MIN_POWER_FACTOR, MAX_POWER_FACTOR);
  const totalServiceCurrent = Number(
    clamp(
      BASE_SERVICE_CURRENT_A + current * 8.5 + apparentPower / 120,
      180,
      920,
    ).toFixed(1),
  );
  const calculatedApparentPowerKva =
    (Math.sqrt(3) * lineToLineVoltage * totalServiceCurrent) / 1000;
  const apparentPowerKva = Number(
    Math.max(calculatedApparentPowerKva, apparentPower / 1000, 120).toFixed(1),
  );
  const activePowerKw = Number(
    Math.max(apparentPowerKva * normalizedPf, activePower / 1000).toFixed(1),
  );
  const reactivePowerKvar = Number(
    Math.max(
      Math.sqrt(Math.max(0, apparentPowerKva ** 2 - activePowerKw ** 2)),
      reactivePower / 1000,
    ).toFixed(1),
  );
  const voltageImbalancePct = Number(
    clamp(1.05 + Math.cos(phaseSeed / 3) * 0.22, 0.8, 1.4).toFixed(1),
  );

  return {
    serviceType: "600Y/347 V — 3Φ 4-wire grounded",
    utilityType: "Local Distribution Company (LDC)",
    lineToLineVoltage,
    lineToNeutralVoltage,
    totalServiceCurrent,
    activePowerKw,
    apparentPowerKva,
    reactivePowerKvar,
    powerFactor: Number(normalizedPf.toFixed(3)),
    powerFactorState: "lagging",
    voltageImbalancePct,
    source: `${(SYSTEM.utility.nominalVoltage / 1000).toFixed(1)} kV feeder → local transformer`,
  };
}
