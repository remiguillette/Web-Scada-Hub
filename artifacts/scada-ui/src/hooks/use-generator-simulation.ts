import { useCallback, useEffect, useRef, useState } from "react";
import { SYSTEM } from "@/config/system";

export type GenState = "OFFLINE" | "STARTING" | "RUNNING" | "STOPPING";

export interface GeneratorLiveStatus {
  state: GenState;
  rampProgress: number;
  voltage: number;
  frequency: number;
  current: number;
  activePower: number;
  reactivePower: number;
  phaseLabel: string;
  voltageHistory: number[];
}

const RAMP_UP_MS = 7000;
const RAMP_DOWN_MS = 4000;
const TICK_MS = 200;
const HISTORY_MAX = 60;

const GEN_NOMINAL_CURRENT = 60;
const GEN_POWER_FACTOR = 0.9;

function getPhaseLabel(state: GenState, progress: number): string {
  if (state === "OFFLINE") return "OFFLINE";
  if (state === "RUNNING") return "READY FOR ATS TRANSFER";
  if (state === "STOPPING") {
    if (progress > 0.7) return "UNLOADING";
    if (progress > 0.3) return "SPINNING DOWN";
    return "COASTING TO STOP";
  }
  if (progress < 0.2) return "CRANKING";
  if (progress < 0.55) return "BUILDING VOLTAGE";
  if (progress < 0.88) return "REACHING RATED SPEED";
  return "READY FOR ATS TRANSFER";
}

function computePower(v: number, c: number) {
  const sP = v * c;
  const aP = Number((sP * GEN_POWER_FACTOR).toFixed(1));
  const rP = Number(Math.sqrt(Math.max(0, sP ** 2 - aP ** 2)).toFixed(1));
  return { activePower: aP, reactivePower: rP };
}

function buildOfflineStatus(): GeneratorLiveStatus {
  return {
    state: "OFFLINE",
    rampProgress: 0,
    voltage: 0,
    frequency: 0,
    current: 0,
    activePower: 0,
    reactivePower: 0,
    phaseLabel: "OFFLINE",
    voltageHistory: [],
  };
}

export function useGeneratorSimulation() {
  const [statuses, setStatuses] = useState<GeneratorLiveStatus[]>(() =>
    SYSTEM.generators.map(() => buildOfflineStatus()),
  );

  const startTimestampsRef = useRef<(number | null)[]>(
    SYSTEM.generators.map(() => null),
  );

  const start = useCallback((idx: number) => {
    setStatuses((prev) => {
      if (prev[idx].state !== "OFFLINE") return prev;
      const next = [...prev];
      next[idx] = {
        ...buildOfflineStatus(),
        state: "STARTING",
        phaseLabel: "CRANKING",
      };
      return next;
    });
    startTimestampsRef.current[idx] = Date.now();
  }, []);

  const stop = useCallback((idx: number) => {
    setStatuses((prev) => {
      if (prev[idx].state !== "RUNNING") return prev;
      const next = [...prev];
      next[idx] = { ...prev[idx], state: "STOPPING", phaseLabel: "UNLOADING" };
      return next;
    });
    startTimestampsRef.current[idx] = Date.now();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      setStatuses((prev) => {
        let anyChanged = false;

        const next = prev.map((s, idx) => {
          const gen = SYSTEM.generators[idx];
          const startedAt = startTimestampsRef.current[idx] ?? now;
          const elapsed = now - startedAt;

          if (s.state === "OFFLINE") return s;

          anyChanged = true;

          if (s.state === "RUNNING") {
            const driftV = (Math.random() - 0.5) * 4;
            const driftI = (Math.random() - 0.5) * 2;
            const v = Number(
              Math.max(
                gen.nominalVoltage - 10,
                Math.min(gen.nominalVoltage + 10, s.voltage + driftV),
              ).toFixed(1),
            );
            const c = Number(
              Math.max(
                GEN_NOMINAL_CURRENT - 5,
                Math.min(GEN_NOMINAL_CURRENT + 5, s.current + driftI),
              ).toFixed(2),
            );
            const { activePower, reactivePower } = computePower(v, c);
            const voltageHistory = [...s.voltageHistory, v].slice(-HISTORY_MAX);
            return {
              ...s,
              voltage: v,
              current: c,
              activePower,
              reactivePower,
              voltageHistory,
            };
          }

          if (s.state === "STARTING") {
            const progress = Math.min(1, elapsed / RAMP_UP_MS);
            const v = Number((gen.nominalVoltage * progress).toFixed(1));
            const freq = Number(
              (gen.nominalFrequency * Math.min(1, progress * 1.4)).toFixed(2),
            );
            const c = Number(
              (GEN_NOMINAL_CURRENT * progress * progress).toFixed(2),
            );
            const { activePower, reactivePower } = computePower(v, c);
            const voltageHistory = [...s.voltageHistory, v].slice(-HISTORY_MAX);

            if (progress >= 1) {
              startTimestampsRef.current[idx] = null;
              const fullV = gen.nominalVoltage;
              const fullC = GEN_NOMINAL_CURRENT;
              const { activePower: fAP, reactivePower: fRP } = computePower(
                fullV,
                fullC,
              );
              return {
                state: "RUNNING" as GenState,
                rampProgress: 1,
                voltage: fullV,
                frequency: gen.nominalFrequency,
                current: fullC,
                activePower: fAP,
                reactivePower: fRP,
                phaseLabel: "READY FOR ATS TRANSFER",
                voltageHistory: [...voltageHistory, fullV].slice(-HISTORY_MAX),
              };
            }

            return {
              ...s,
              rampProgress: progress,
              voltage: v,
              frequency: freq,
              current: c,
              activePower,
              reactivePower,
              phaseLabel: getPhaseLabel("STARTING", progress),
              voltageHistory,
            };
          }

          if (s.state === "STOPPING") {
            const progress = Math.max(0, 1 - elapsed / RAMP_DOWN_MS);
            const v = Number((gen.nominalVoltage * progress).toFixed(1));
            const freq = Number((gen.nominalFrequency * progress).toFixed(2));
            const c = Number((GEN_NOMINAL_CURRENT * progress).toFixed(2));
            const { activePower, reactivePower } = computePower(v, c);
            const voltageHistory = [...s.voltageHistory, v].slice(-HISTORY_MAX);

            if (progress <= 0) {
              startTimestampsRef.current[idx] = null;
              return buildOfflineStatus();
            }

            return {
              ...s,
              rampProgress: progress,
              voltage: v,
              frequency: freq,
              current: c,
              activePower,
              reactivePower,
              phaseLabel: getPhaseLabel("STOPPING", progress),
              voltageHistory,
            };
          }

          return s;
        });

        return anyChanged ? next : prev;
      });
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, []);

  return { statuses, start, stop };
}
