import { useCallback, useEffect, useRef, useState } from "react";
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

interface GeneratorConfig {
  nominalVoltage: number;
  nominalFrequency: number;
}

const TICK_MS = 200;
const HISTORY_MAX = 60;

const STARTING_MS = 4000;
const STABILIZING_MS = 2500;
const STOPPING_MS = 4000;

const READY_IDLE_CURRENT = 2.5;
const LOADED_NOMINAL_CURRENT = 60;
const POWER_FACTOR = 0.9;

type Transition = {
  phase: "STARTING" | "STABILIZING" | "STOPPING";
  startedAt: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, decimals = 1): number {
  return Number(value.toFixed(decimals));
}

function computePower(voltage: number, current: number) {
  // Approximation simple monophasée / pédagogique.
  // Si tu veux du triphasé 480V réel, remplace par :
  // const apparentPower = Math.sqrt(3) * voltage * current;
  const apparentPower = voltage * current;
  const activePower = round(apparentPower * POWER_FACTOR, 1);
  const reactivePower = round(
    Math.sqrt(Math.max(0, apparentPower ** 2 - activePower ** 2)),
    1,
  );

  return { activePower, reactivePower };
}

function getPhaseLabel(state: GenState): string {
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

function buildOfflineStatus(): GeneratorLiveStatus {
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

function buildReadyStatus(gen: GeneratorConfig): GeneratorLiveStatus {
  const voltage = gen.nominalVoltage;
  const frequency = gen.nominalFrequency;
  const current = READY_IDLE_CURRENT;
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

function buildLoadedStatus(gen: GeneratorConfig): GeneratorLiveStatus {
  const voltage = gen.nominalVoltage;
  const frequency = gen.nominalFrequency;
  const current = LOADED_NOMINAL_CURRENT;
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

function pushHistory(history: number[], value: number): number[] {
  return [...history, value].slice(-HISTORY_MAX);
}

function getGeneratorConfig(idx: number): GeneratorConfig {
  const gen = SYSTEM.generators[idx];
  return {
    nominalVoltage: gen.nominalVoltage,
    nominalFrequency: gen.nominalFrequency,
  };
}

export function useGeneratorSimulation() {
  const [statuses, setStatuses] = useState<GeneratorLiveStatus[]>(() =>
    SYSTEM.generators.map(() => buildOfflineStatus()),
  );

  const transitionsRef = useRef<Array<Transition | null>>(
    SYSTEM.generators.map(() => null),
  );

  const setTransition = (idx: number, phase: Transition["phase"]) => {
    transitionsRef.current[idx] = {
      phase,
      startedAt: Date.now(),
    };
  };

  const clearTransition = (idx: number) => {
    transitionsRef.current[idx] = null;
  };

  const start = useCallback((idx: number) => {
    setStatuses((prev) => {
      const current = prev[idx];
      if (current.state !== "OFFLINE") return prev;

      const next = [...prev];
      next[idx] = {
        ...buildOfflineStatus(),
        state: "STARTING",
        phaseLabel: getPhaseLabel("STARTING"),
        progress: 0,
      };
      return next;
    });

    setTransition(idx, "STARTING");
  }, []);

  const load = useCallback((idx: number) => {
    setStatuses((prev) => {
      const current = prev[idx];
      if (current.state !== "READY") return prev;

      const gen = getGeneratorConfig(idx);
      const next = [...prev];
      next[idx] = {
        ...buildLoadedStatus(gen),
        voltageHistory: pushHistory(current.voltageHistory, gen.nominalVoltage),
      };
      return next;
    });
  }, []);

  const unload = useCallback((idx: number) => {
    setStatuses((prev) => {
      const current = prev[idx];
      if (current.state !== "LOADED") return prev;

      const gen = getGeneratorConfig(idx);
      const next = [...prev];
      next[idx] = {
        ...buildReadyStatus(gen),
        voltageHistory: pushHistory(current.voltageHistory, gen.nominalVoltage),
      };
      return next;
    });
  }, []);

  const stop = useCallback((idx: number) => {
    setStatuses((prev) => {
      const current = prev[idx];
      if (current.state !== "READY" && current.state !== "LOADED") return prev;

      const next = [...prev];
      next[idx] = {
        ...current,
        state: "STOPPING",
        phaseLabel: getPhaseLabel("STOPPING"),
        progress: 1,
      };
      return next;
    });

    setTransition(idx, "STOPPING");
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();

      setStatuses((prev) => {
        let changed = false;

        const next = prev.map<GeneratorLiveStatus>((status, idx) => {
          const gen = getGeneratorConfig(idx);
          const transition = transitionsRef.current[idx];

          if (!transition) {
            if (status.state === "READY") {
              const driftV = (Math.random() - 0.5) * 1.2;
              const driftF = (Math.random() - 0.5) * 0.04;
              const voltage = round(
                clamp(
                  status.voltage + driftV,
                  gen.nominalVoltage - 2,
                  gen.nominalVoltage + 2,
                ),
                1,
              );
              const frequency = round(
                clamp(
                  status.frequency + driftF,
                  gen.nominalFrequency - 0.05,
                  gen.nominalFrequency + 0.05,
                ),
                2,
              );
              const current = round(
                clamp(
                  READY_IDLE_CURRENT + (Math.random() - 0.5) * 0.6,
                  1.5,
                  4,
                ),
                2,
              );
              const { activePower, reactivePower } = computePower(
                voltage,
                current,
              );

              changed = true;
              return {
                ...status,
                voltage,
                frequency,
                current,
                activePower,
                reactivePower,
                voltageHistory: pushHistory(status.voltageHistory, voltage),
              };
            }

            if (status.state === "LOADED") {
              const driftV = (Math.random() - 0.5) * 4;
              const driftF = (Math.random() - 0.5) * 0.06;
              const driftI = (Math.random() - 0.5) * 3;

              const voltage = round(
                clamp(
                  status.voltage + driftV,
                  gen.nominalVoltage - 10,
                  gen.nominalVoltage + 10,
                ),
                1,
              );
              const frequency = round(
                clamp(
                  status.frequency + driftF,
                  gen.nominalFrequency - 0.15,
                  gen.nominalFrequency + 0.15,
                ),
                2,
              );
              const current = round(
                clamp(
                  status.current + driftI,
                  LOADED_NOMINAL_CURRENT - 8,
                  LOADED_NOMINAL_CURRENT + 8,
                ),
                2,
              );
              const { activePower, reactivePower } = computePower(
                voltage,
                current,
              );

              changed = true;
              return {
                ...status,
                voltage,
                frequency,
                current,
                activePower,
                reactivePower,
                voltageHistory: pushHistory(status.voltageHistory, voltage),
              };
            }

            return status;
          }

          const elapsed = now - transition.startedAt;

          if (transition.phase === "STARTING") {
            const progress = clamp(elapsed / STARTING_MS, 0, 1);

            const voltage = round(gen.nominalVoltage * progress, 1);
            const frequency = round(gen.nominalFrequency * progress, 2);
            const current = round(READY_IDLE_CURRENT * progress, 2);
            const { activePower, reactivePower } = computePower(
              voltage,
              current,
            );

            changed = true;

            if (progress >= 1) {
              nextTickToStabilizing(idx);
              return {
                state: "STABILIZING",
                phaseLabel: getPhaseLabel("STABILIZING"),
                progress: 0,
                voltage: gen.nominalVoltage,
                frequency: gen.nominalFrequency,
                current: READY_IDLE_CURRENT,
                activePower: computePower(
                  gen.nominalVoltage,
                  READY_IDLE_CURRENT,
                ).activePower,
                reactivePower: computePower(
                  gen.nominalVoltage,
                  READY_IDLE_CURRENT,
                ).reactivePower,
                voltageHistory: pushHistory(status.voltageHistory, gen.nominalVoltage),
              };
            }

            return {
              ...status,
              state: "STARTING",
              phaseLabel: getPhaseLabel("STARTING"),
              progress,
              voltage,
              frequency,
              current,
              activePower,
              reactivePower,
              voltageHistory: pushHistory(status.voltageHistory, voltage),
            };
          }

          if (transition.phase === "STABILIZING") {
            const progress = clamp(elapsed / STABILIZING_MS, 0, 1);

            const driftV = (Math.random() - 0.5) * 2.5 * (1 - progress);
            const driftF = (Math.random() - 0.5) * 0.08 * (1 - progress);

            const voltage = round(
              clamp(
                gen.nominalVoltage + driftV,
                gen.nominalVoltage - 3,
                gen.nominalVoltage + 3,
              ),
              1,
            );
            const frequency = round(
              clamp(
                gen.nominalFrequency + driftF,
                gen.nominalFrequency - 0.1,
                gen.nominalFrequency + 0.1,
              ),
              2,
            );
            const current = round(READY_IDLE_CURRENT, 2);
            const { activePower, reactivePower } = computePower(
              voltage,
              current,
            );

            changed = true;

            if (progress >= 1) {
              clearTransition(idx);
              return {
                ...buildReadyStatus(gen),
                voltageHistory: pushHistory(status.voltageHistory, gen.nominalVoltage),
              };
            }

            return {
              ...status,
              state: "STABILIZING",
              phaseLabel: getPhaseLabel("STABILIZING"),
              progress,
              voltage,
              frequency,
              current,
              activePower,
              reactivePower,
              voltageHistory: pushHistory(status.voltageHistory, voltage),
            };
          }

          if (transition.phase === "STOPPING") {
            const progress = clamp(1 - elapsed / STOPPING_MS, 0, 1);

            const voltage = round(gen.nominalVoltage * progress, 1);
            const frequency = round(gen.nominalFrequency * progress, 2);
            const current = round(status.current * progress, 2);
            const { activePower, reactivePower } = computePower(
              voltage,
              current,
            );

            changed = true;

            if (progress <= 0) {
              clearTransition(idx);
              return buildOfflineStatus();
            }

            return {
              ...status,
              state: "STOPPING",
              phaseLabel: getPhaseLabel("STOPPING"),
              progress,
              voltage,
              frequency,
              current,
              activePower,
              reactivePower,
              voltageHistory: pushHistory(status.voltageHistory, voltage),
            };
          }

          return status;
        });

        return changed ? next : prev;
      });
    }, TICK_MS);

    function nextTickToStabilizing(idx: number) {
      transitionsRef.current[idx] = {
        phase: "STABILIZING",
        startedAt: Date.now(),
      };
    }

    return () => window.clearInterval(timer);
  }, []);

  return {
    statuses,
    start,
    load,
    unload,
    stop,
  };
}