import { useEffect, useState } from "react";

export interface GridSimulationConfig {
  baseVoltage: number;
  voltageVariationPct: number;
  baseFrequency: number;
  frequencyVariation: number;
  updateIntervalMs?: number;
}

interface GridSimulationState {
  voltage: number;
  frequency: number;
}

const DEFAULT_UPDATE_INTERVAL_MS = 1000;
const VOLTAGE_MAX_TICK_RATIO = 0.005;
const FREQUENCY_MAX_TICK_DELTA = 0.03;

function clampWithBounce(nextValue: number, minAllowed: number, maxAllowed: number, delta: number) {
  if (nextValue > maxAllowed) {
    return maxAllowed - Math.abs(delta);
  }

  if (nextValue < minAllowed) {
    return minAllowed + Math.abs(delta);
  }

  return nextValue;
}

export function useGridSimulation(config: GridSimulationConfig): GridSimulationState {
  const [state, setState] = useState<GridSimulationState>({
    voltage: config.baseVoltage,
    frequency: config.baseFrequency,
  });

  useEffect(() => {
    setState({
      voltage: config.baseVoltage,
      frequency: config.baseFrequency,
    });

    const intervalId = window.setInterval(() => {
      setState((prev) => {
        const voltageTickDelta = config.baseVoltage * VOLTAGE_MAX_TICK_RATIO;
        const voltageDelta = (Math.random() - 0.5) * 2 * voltageTickDelta;
        const voltageMaxAllowed = config.baseVoltage * (1 + config.voltageVariationPct);
        const voltageMinAllowed = config.baseVoltage * (1 - config.voltageVariationPct);
        const nextVoltage = clampWithBounce(prev.voltage + voltageDelta, voltageMinAllowed, voltageMaxAllowed, voltageDelta);

        const frequencyDelta = (Math.random() - 0.5) * 2 * FREQUENCY_MAX_TICK_DELTA;
        const frequencyMaxAllowed = config.baseFrequency + config.frequencyVariation;
        const frequencyMinAllowed = config.baseFrequency - config.frequencyVariation;
        const nextFrequency = clampWithBounce(prev.frequency + frequencyDelta, frequencyMinAllowed, frequencyMaxAllowed, frequencyDelta);

        return {
          voltage: Number(nextVoltage.toFixed(2)),
          frequency: Number(nextFrequency.toFixed(3)),
        };
      });
    }, config.updateIntervalMs ?? DEFAULT_UPDATE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [
    config.baseFrequency,
    config.baseVoltage,
    config.frequencyVariation,
    config.updateIntervalMs,
    config.voltageVariationPct,
  ]);

  return state;
}
