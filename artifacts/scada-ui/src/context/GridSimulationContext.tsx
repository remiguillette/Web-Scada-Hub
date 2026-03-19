import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useGridSimulation, type GridSimulationConfig } from "@/hooks/use-grid-simulation";

export interface GridFormValues {
  baseVoltage: number;
  baseFrequency: number;
  voltageTolerancePct: number;
  frequencyVariation: number;
  gridDemandMw: number;
}

export interface GridReading {
  ts: number;
  voltage: number;
  frequency: number;
}

export type GridCouplingState = "DISCONNECTED" | "SYNCHRONIZING" | "CONNECTED";

const HISTORY_MAX = 60;
const SYNC_DELAY_MS = 2500;

const DEFAULT_FORM: GridFormValues = {
  baseVoltage: 13800,
  baseFrequency: 60,
  voltageTolerancePct: 2,
  frequencyVariation: 0.05,
  gridDemandMw: 400,
};

const GRID_ENABLED_STORAGE_KEY = "scada.grid.enabled";

const DEFAULT_CONFIG: GridSimulationConfig = {
  baseVoltage: 13800,
  voltageVariationPct: 0.02,
  baseFrequency: 60,
  frequencyVariation: 0.05,
  updateIntervalMs: 1000,
};

interface GridSimulationContextValue {
  voltage: number;
  frequency: number;
  gridState: GridCouplingState;
  history: GridReading[];
  form: GridFormValues;
  config: GridSimulationConfig;
  gridEnabled: boolean;
  gridDemandMw: number;
  toggleGrid: () => void;
  requestGridConnection: (nextConnected: boolean) => void;
  setForm: (updater: (prev: GridFormValues) => GridFormValues) => void;
  applyConfig: () => void;
}

const GridSimulationContext = createContext<GridSimulationContextValue | null>(null);

export function GridSimulationProvider({ children }: { children: ReactNode }) {
  const [gridEnabled, setGridEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;

    const saved = window.localStorage.getItem(GRID_ENABLED_STORAGE_KEY);
    return saved === "true";
  });
  const [gridState, setGridState] = useState<GridCouplingState>(gridEnabled ? "CONNECTED" : "DISCONNECTED");
  const [form, setForm] = useState<GridFormValues>(DEFAULT_FORM);
  const [config, setConfig] = useState<GridSimulationConfig>(DEFAULT_CONFIG);
  const [history, setHistory] = useState<GridReading[]>([]);
  const syncTimeoutRef = useRef<number | null>(null);

  const persistGridEnabled = useCallback((value: boolean) => {
    setGridEnabledState(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(GRID_ENABLED_STORAGE_KEY, String(value));
    }
  }, []);

  const clearSyncTimeout = useCallback(() => {
    if (syncTimeoutRef.current !== null) {
      window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, []);

  const disconnectGrid = useCallback(() => {
    clearSyncTimeout();
    setGridState("DISCONNECTED");
    persistGridEnabled(false);
  }, [clearSyncTimeout, persistGridEnabled]);

  const requestGridConnection = useCallback((nextConnected: boolean) => {
    if (!nextConnected) {
      disconnectGrid();
      return;
    }

    if (gridState === "CONNECTED" || gridState === "SYNCHRONIZING") {
      return;
    }

    clearSyncTimeout();
    setGridState("SYNCHRONIZING");
    persistGridEnabled(false);
    syncTimeoutRef.current = window.setTimeout(() => {
      setGridState("CONNECTED");
      persistGridEnabled(true);
      syncTimeoutRef.current = null;
    }, SYNC_DELAY_MS);
  }, [clearSyncTimeout, disconnectGrid, gridState, persistGridEnabled]);

  const { voltage: rawVoltage, frequency: rawFrequency } = useGridSimulation(config);

  const voltage = gridEnabled ? rawVoltage : 0;
  const frequency = gridEnabled ? rawFrequency : 0;
  const gridDemandMw = form.gridDemandMw;

  const toggleGrid = useCallback(() => {
    requestGridConnection(gridState !== "CONNECTED");
  }, [gridState, requestGridConnection]);

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
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== GRID_ENABLED_STORAGE_KEY) return;
      const enabled = event.newValue === "true";
      clearSyncTimeout();
      setGridEnabledState(enabled);
      setGridState(enabled ? "CONNECTED" : "DISCONNECTED");
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [clearSyncTimeout]);

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

  useEffect(() => () => clearSyncTimeout(), [clearSyncTimeout]);

  return (
    <GridSimulationContext.Provider value={{ voltage, frequency, gridState, history, form, config, gridEnabled, gridDemandMw, toggleGrid, requestGridConnection, setForm, applyConfig }}>
      {children}
    </GridSimulationContext.Provider>
  );
}

export function useGridSimulationContext(): GridSimulationContextValue {
  const ctx = useContext(GridSimulationContext);
  if (!ctx) throw new Error("useGridSimulationContext must be used inside GridSimulationProvider");
  return ctx;
}
