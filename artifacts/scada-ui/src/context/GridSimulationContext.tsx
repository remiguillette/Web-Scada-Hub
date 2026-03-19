import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useGridSimulation,
  type GridSimulationConfig,
} from "@/hooks/use-grid-simulation";

export type HydroDispatchMode = "PHYSICS" | "GRID_FOLLOW";

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
const HYDRO_MAX_UNITS = 10;
const HYDRO_UNIT_CAPACITY_MW = 54.8;
const WATER_TO_WIRE_EFFICIENCY = 0.9;
const WATER_DENSITY_KG_PER_M3 = 1000;
const GRAVITY_M_PER_S2 = 9.81;
const DEFAULT_SIM_TIME_MINUTES = 8 * 60;
const DEFAULT_INFLOW_RATE = 500;
const DEFAULT_RESERVOIR_LEVEL = 100;
const GRID_BASE_FREQUENCY_MIN = 59.9;
const GRID_BASE_FREQUENCY_MAX = 60.1;
const GRID_FREQUENCY_VARIATION_MAX = 0.1;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function sanitizeGridForm(form: GridFormValues): GridFormValues {
  return {
    ...form,
    baseFrequency: Number(
      clamp(form.baseFrequency, GRID_BASE_FREQUENCY_MIN, GRID_BASE_FREQUENCY_MAX).toFixed(3),
    ),
    frequencyVariation: Number(
      clamp(form.frequencyVariation, 0, GRID_FREQUENCY_VARIATION_MAX).toFixed(3),
    ),
  };
}

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
  simulationTimeMinutes: number;
  inflowRate: number;
  reservoirLevel: number;
  generatedPowerMw: number;
  hydraulicHeadMeters: number;
  waterFlowActiveUnits: number;
  waterToWireEfficiency: number;
  hydroDispatchMode: HydroDispatchMode;
  rawWaterPowerMw: number;
  hydraulicCapacityMw: number;
  hydraulicReserveMw: number;
  importedGridPowerMw: number;
  toggleGrid: () => void;
  requestGridConnection: (nextConnected: boolean) => void;
  setForm: (updater: (prev: GridFormValues) => GridFormValues) => void;
  applyConfig: () => void;
}

const GridSimulationContext = createContext<GridSimulationContextValue | null>(
  null,
);

export function GridSimulationProvider({ children }: { children: ReactNode }) {
  const [gridEnabled, setGridEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;

    const saved = window.localStorage.getItem(GRID_ENABLED_STORAGE_KEY);
    return saved === "true";
  });
  const [gridState, setGridState] = useState<GridCouplingState>(
    gridEnabled ? "CONNECTED" : "DISCONNECTED",
  );
  const [form, setForm] = useState<GridFormValues>(sanitizeGridForm(DEFAULT_FORM));
  const [config, setConfig] = useState<GridSimulationConfig>(DEFAULT_CONFIG);
  const [history, setHistory] = useState<GridReading[]>([]);
  const [simulationTimeMinutes, setSimulationTimeMinutes] = useState(
    DEFAULT_SIM_TIME_MINUTES,
  );
  const [inflowRate, setInflowRate] = useState(DEFAULT_INFLOW_RATE);
  const [reservoirLevel, setReservoirLevel] = useState(DEFAULT_RESERVOIR_LEVEL);
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

  const requestGridConnection = useCallback(
    (nextConnected: boolean) => {
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
    },
    [clearSyncTimeout, disconnectGrid, gridState, persistGridEnabled],
  );

  const { voltage: rawVoltage, frequency: rawFrequency } =
    useGridSimulation(config);

  const voltage = gridEnabled ? rawVoltage : 0;
  const frequency = gridEnabled ? rawFrequency : 0;
  const demandFactor =
    Math.sin((simulationTimeMinutes / 1440) * Math.PI * 2 - Math.PI / 2) + 1.2;
  const gridDemandMw = Number(
    Math.max(120, form.gridDemandMw * (0.65 + demandFactor * 0.32)).toFixed(1),
  );
  const hydraulicHeadMeters = Number(
    (48 + (reservoirLevel - 100) * 0.35).toFixed(1),
  );
  const rawWaterPowerMw = Number(
    (
      (WATER_DENSITY_KG_PER_M3 *
        GRAVITY_M_PER_S2 *
        inflowRate *
        hydraulicHeadMeters *
        WATER_TO_WIRE_EFFICIENCY) /
      1_000_000
    ).toFixed(1),
  );
  const hydraulicCapacityMw = Math.min(
    HYDRO_MAX_UNITS * HYDRO_UNIT_CAPACITY_MW,
    rawWaterPowerMw,
  );
  const hydroDispatchMode: HydroDispatchMode = "PHYSICS";
  const dispatchedPowerMw = Math.min(gridDemandMw, hydraulicCapacityMw);
  const hydraulicReserveMw = Math.max(
    0,
    hydraulicCapacityMw - dispatchedPowerMw,
  );
  const importedGridPowerMw = Math.max(0, gridDemandMw - dispatchedPowerMw);
  const waterFlowActiveUnits =
    gridEnabled && dispatchedPowerMw > 0
      ? Math.min(
          HYDRO_MAX_UNITS,
          Math.max(1, Math.ceil(dispatchedPowerMw / HYDRO_UNIT_CAPACITY_MW)),
        )
      : 0;
  const generatedPowerMw = gridEnabled
    ? Number(dispatchedPowerMw.toFixed(1))
    : 0;

  const toggleGrid = useCallback(() => {
    requestGridConnection(gridState !== "CONNECTED");
  }, [gridState, requestGridConnection]);

  const applyConfig = useCallback(() => {
    const sanitizedForm = sanitizeGridForm(form);

    setForm(sanitizedForm);
    setConfig({
      baseVoltage: sanitizedForm.baseVoltage,
      voltageVariationPct: sanitizedForm.voltageTolerancePct / 100,
      baseFrequency: sanitizedForm.baseFrequency,
      frequencyVariation: sanitizedForm.frequencyVariation,
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
    if (
      voltage !== prevVoltageRef.current ||
      frequency !== prevFrequencyRef.current
    ) {
      prevVoltageRef.current = voltage;
      prevFrequencyRef.current = frequency;
      setHistory((prev) => {
        const next: GridReading = { ts: Date.now(), voltage, frequency };
        return [...prev, next].slice(-HISTORY_MAX);
      });
    }
  }, [voltage, frequency]);

  useEffect(() => () => clearSyncTimeout(), [clearSyncTimeout]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSimulationTimeMinutes((prev) => (prev + 1) % 1440);
      setInflowRate((prev) => {
        const variation = Math.random() * 10 - 5;
        return Number(
          Math.max(400, Math.min(600, prev + variation)).toFixed(1),
        );
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setReservoirLevel((prev) => {
      const outflow = generatedPowerMw * 1.1;
      const nextLevel = prev + (inflowRate - outflow) * 0.001;
      return Number(Math.max(92, Math.min(108, nextLevel)).toFixed(2));
    });
  }, [generatedPowerMw, inflowRate]);

  return (
    <GridSimulationContext.Provider
      value={{
        voltage,
        frequency,
        gridState,
        history,
        form,
        config,
        gridEnabled,
        gridDemandMw,
        simulationTimeMinutes,
        inflowRate,
        reservoirLevel,
        generatedPowerMw,
        hydraulicHeadMeters,
        waterFlowActiveUnits,
        waterToWireEfficiency: WATER_TO_WIRE_EFFICIENCY,
        hydroDispatchMode,
        rawWaterPowerMw,
        hydraulicCapacityMw,
        hydraulicReserveMw,
        importedGridPowerMw,
        toggleGrid,
        requestGridConnection,
        setForm,
        applyConfig,
      }}
    >
      {children}
    </GridSimulationContext.Provider>
  );
}

export function useGridSimulationContext(): GridSimulationContextValue {
  const ctx = useContext(GridSimulationContext);
  if (!ctx)
    throw new Error(
      "useGridSimulationContext must be used inside GridSimulationProvider",
    );
  return ctx;
}
