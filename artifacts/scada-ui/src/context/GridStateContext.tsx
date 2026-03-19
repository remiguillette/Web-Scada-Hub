import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";

export interface GridState {
  couplingClosed: boolean;
  powerKw: number;
  energized: boolean;
  voltage: number;
  frequency: number;
  current: number;
}

const DEFAULT_STATE: GridState = {
  couplingClosed: false,
  powerKw: 0,
  energized: false,
  voltage: 0,
  frequency: 0,
  current: 0,
};

interface GridStateContextValue {
  state: GridState;
  setCoupling: (closed: boolean) => Promise<void>;
  setPower: (powerKw: number) => Promise<void>;
}

const GridStateContext = createContext<GridStateContextValue | null>(null);

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_BASE = `${BASE_URL}/api`;

export function GridStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GridState>(DEFAULT_STATE);
  const evtSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const evtSource = new EventSource(`${API_BASE}/grid/events`);
    evtSourceRef.current = evtSource;

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as GridState;
        setState(data);
      } catch {
      }
    };

    evtSource.onerror = () => {
      evtSource.close();
      evtSourceRef.current = null;
      const timer = setTimeout(() => {
        const newEvtSource = new EventSource(`${API_BASE}/grid/events`);
        evtSourceRef.current = newEvtSource;
        newEvtSource.onmessage = evtSource.onmessage;
        newEvtSource.onerror = evtSource.onerror;
      }, 3000);
      return () => clearTimeout(timer);
    };

    fetch(`${API_BASE}/grid/state`)
      .then((r) => r.json())
      .then((data: GridState) => setState(data))
      .catch(() => {});

    return () => {
      evtSource.close();
    };
  }, []);

  const setCoupling = async (closed: boolean) => {
    const res = await fetch(`${API_BASE}/grid/coupling`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ closed }),
    });
    if (res.ok) {
      const data = (await res.json()) as GridState;
      setState(data);
    }
  };

  const setPower = async (powerKw: number) => {
    const res = await fetch(`${API_BASE}/grid/power`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ powerKw }),
    });
    if (res.ok) {
      const data = (await res.json()) as GridState;
      setState(data);
    }
  };

  return (
    <GridStateContext.Provider value={{ state, setCoupling, setPower }}>
      {children}
    </GridStateContext.Provider>
  );
}

export function useGridState(): GridStateContextValue {
  const ctx = useContext(GridStateContext);
  if (!ctx) throw new Error("useGridState must be used inside GridStateProvider");
  return ctx;
}
