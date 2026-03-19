import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useGridSimulation, type GridSimulationConfig } from "@/hooks/use-grid-simulation";

export interface GridFormValues {
  baseVoltage: number;
  baseFrequency: number;
  voltageTolerancePct: number;
  frequencyVariation: number;
}

export interface GridReading {
  ts: number;
  voltage: number;
  frequency: number;
}

const HISTORY_MAX = 60;

const DEFAULT_FORM: GridFormValues = {
  baseVoltage: 120,
  baseFrequency: 60,
  voltageTolerancePct: 2,
  frequencyVariation: 0.05,
};

const DEFAULT_CONFIG: GridSimulationConfig = {
  baseVoltage: 120,
  voltageVariationPct: 0.02,
  baseFrequency: 60,
  frequencyVariation: 0.05,
  updateIntervalMs: 1000,
};

interface GridSimulationContextValue {
  voltage: number;
  frequency: number;
  history: GridReading[];
  form: GridFormValues;
  config: GridSimulationConfig;
  setForm: (updater: (prev: GridFormValues) => GridFormValues) => void;
  applyConfig: () => void;
}

const GridSimulationContext = createContext<GridSimulationContextValue | null>(null);

export function GridSimulationProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<GridFormValues>(DEFAULT_FORM);
  const [config, setConfig] = useState<GridSimulationConfig>(DEFAULT_CONFIG);
  const [history, setHistory] = useState<GridReading[]>([]);

  const { voltage, frequency } = useGridSimulation(config);

  const applyConfig = useCallback(() => {
    setConfig({
      baseVoltage: form.baseVoltage,
      voltageVariationPct: form.voltageTolerancePct / 100,
      baseFrequency: form.baseFrequency,
      frequencyVariation: form.frequencyVariation,
      updateIntervalMs: 1000,
    });
  }, [form]);

  const prevVoltageRef = useRef(voltage);
  const prevFrequencyRef = useRef(frequency);

  useEffect(() => {
    if (voltage !== prevVoltageRef.current || frequency !== prevFrequencyRef.current) {
      prevVoltageRef.current = voltage;
      prevFrequencyRef.current = frequency;
      setHistory((prev) => {
        const next: GridReading = { ts: Date.now(), voltage, frequency };
        return [...prev, next].slice(-HISTORY_MAX);
      });
    }
  }, [voltage, frequency]);

  return (
    <GridSimulationContext.Provider value={{ voltage, frequency, history, form, config, setForm, applyConfig }}>
      {children}
    </GridSimulationContext.Provider>
  );
}

export function useGridSimulationContext(): GridSimulationContextValue {
  const ctx = useContext(GridSimulationContext);
  if (!ctx) throw new Error("useGridSimulationContext must be used inside GridSimulationProvider");
  return ctx;
}
