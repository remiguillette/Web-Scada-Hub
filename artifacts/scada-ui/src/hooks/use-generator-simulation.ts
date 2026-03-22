import { useCallback, useEffect, useRef, useState } from "react";
import { SYSTEM } from "@/config/system";
import {
  GENERATOR_SIMULATION,
  buildLoadedStatus,
  buildOfflineStatus,
  buildReadyStatus,
  clamp,
  computePower,
  getGeneratorConfig,
  getPhaseLabel,
  pushHistory,
  round,
  type GeneratorLiveStatus,
  type Transition,
} from "@/features/simulation/state";

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
                  GENERATOR_SIMULATION.readyIdleCurrent + (Math.random() - 0.5) * 0.6,
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
                  GENERATOR_SIMULATION.loadedNominalCurrent - 8,
                  GENERATOR_SIMULATION.loadedNominalCurrent + 8,
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
            const progress = clamp(elapsed / GENERATOR_SIMULATION.startingMs, 0, 1);

            const voltage = round(gen.nominalVoltage * progress, 1);
            const frequency = round(gen.nominalFrequency * progress, 2);
            const current = round(GENERATOR_SIMULATION.readyIdleCurrent * progress, 2);
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
                current: GENERATOR_SIMULATION.readyIdleCurrent,
                activePower: computePower(
                  gen.nominalVoltage,
                  GENERATOR_SIMULATION.readyIdleCurrent,
                ).activePower,
                reactivePower: computePower(
                  gen.nominalVoltage,
                  GENERATOR_SIMULATION.readyIdleCurrent,
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
            const progress = clamp(elapsed / GENERATOR_SIMULATION.stabilizingMs, 0, 1);

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
            const current = round(GENERATOR_SIMULATION.readyIdleCurrent, 2);
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
            const progress = clamp(1 - elapsed / GENERATOR_SIMULATION.stoppingMs, 0, 1);

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
    }, GENERATOR_SIMULATION.tickMs);

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