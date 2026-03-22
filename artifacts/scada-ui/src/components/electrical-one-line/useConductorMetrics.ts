import { useEffect, useMemo, useState } from "react";
import {
  CONDUCTORS,
  formatBusCurrent,
  formatBusVoltage,
  type StreetBusMetric,
} from "./metrics";

type UseConductorMetricsOptions = {
  voltage: number;
  current: number;
  motorPowered: boolean;
  utilityActive: boolean;
  samplingMs?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useConductorMetrics({
  voltage,
  current,
  motorPowered,
  utilityActive,
  samplingMs = 350,
}: UseConductorMetricsOptions): StreetBusMetric[] {
  const [metricTick, setMetricTick] = useState(0);

  useEffect(() => {
    if (!utilityActive) {
      setMetricTick(0);
      return;
    }

    const interval = window.setInterval(() => {
      setMetricTick((tick) => tick + 1);
    }, samplingMs);

    return () => window.clearInterval(interval);
  }, [samplingMs, utilityActive]);

  const conductorMetrics = useMemo<StreetBusMetric[]>(() => {
    const basePhaseVoltage = clamp(voltage > 0 ? voltage : 347, 338, 354);
    const phaseOffsets = [1, -1, 0.5];
    const phaseCurrents = [current * 1.01, current * 0.98, current * 1.02];
    const elapsedSeconds = (metricTick * samplingMs) / 1000;
    const startingPulse = motorPowered
      ? Math.sin(elapsedSeconds * 3.6) > 0.985
        ? 1.2
        : 1
      : 0;
    const phaseLabels = ["L1", "L2", "L3"] as const;

    const phaseMetrics = phaseLabels.map((label, index) => {
      const drift = Math.sin(elapsedSeconds * (0.18 + index * 0.03)) * 1.2;
      const noise =
        Math.sin(elapsedSeconds * (3.3 + index * 0.4)) *
        (motorPowered ? current * 0.012 : 0);
      const burst = index === 2 ? startingPulse : 1;
      const liveVoltage = utilityActive
        ? clamp(basePhaseVoltage + phaseOffsets[index] + drift, 338, 354)
        : 0;
      const liveCurrent = utilityActive
        ? clamp(phaseCurrents[index] * burst + noise, 0, current * 1.25 + 25)
        : 0;

      return {
        label,
        lines: [
          label,
          formatBusVoltage(liveVoltage),
          formatBusCurrent(liveCurrent),
        ] as [string, string, string],
        color: CONDUCTORS[index].color,
        glow: CONDUCTORS[index].glow,
      };
    });

    const neutralCurrent = utilityActive
      ? clamp(
          Math.abs(
            phaseMetrics.reduce(
              (sum, phase) => sum + Number.parseFloat(phase.lines[2]),
              0,
            ) / 100,
          ) +
            8 +
            Math.sin(elapsedSeconds * 2.1) * 6,
          5,
          25,
        )
      : 0;
    const neutralVoltage = utilityActive
      ? clamp(1.4 + Math.sin(elapsedSeconds * 0.7) * 0.8, 0.5, 3)
      : 0;
    const groundVoltage = utilityActive
      ? clamp(0.15 + Math.sin(elapsedSeconds * 0.45) * 0.05, 0.1, 0.2)
      : 0;

    return [
      ...phaseMetrics,
      {
        label: "N",
        lines: [
          "N",
          `${neutralVoltage.toFixed(1)} V`,
          formatBusCurrent(neutralCurrent),
        ],
        color: CONDUCTORS[3].color,
        glow: CONDUCTORS[3].glow,
      },
      {
        label: "GND",
        lines: ["GND", `${groundVoltage.toFixed(1)} V`, "—"],
        color: CONDUCTORS[4].color,
        glow: CONDUCTORS[4].glow,
      },
    ];
  }, [current, metricTick, motorPowered, samplingMs, utilityActive, voltage]);

  return conductorMetrics;
}
