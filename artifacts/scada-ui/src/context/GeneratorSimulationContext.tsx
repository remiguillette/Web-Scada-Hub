import { createContext, ReactNode, useContext } from "react";
import { useGeneratorSimulation, type GenState, type GeneratorLiveStatus } from "@/hooks/use-generator-simulation";

interface GeneratorSimulationContextValue {
  statuses: GeneratorLiveStatus[];
  start: (idx: number) => void;
  stop: (idx: number) => void;
}

const GeneratorSimulationContext = createContext<GeneratorSimulationContextValue | null>(null);

export function GeneratorSimulationProvider({ children }: { children: ReactNode }) {
  const { statuses, start, stop } = useGeneratorSimulation();
  return (
    <GeneratorSimulationContext.Provider value={{ statuses, start, stop }}>
      {children}
    </GeneratorSimulationContext.Provider>
  );
}

export function useGeneratorSimulationContext(): GeneratorSimulationContextValue {
  const ctx = useContext(GeneratorSimulationContext);
  if (!ctx) throw new Error("useGeneratorSimulationContext must be used inside GeneratorSimulationProvider");
  return ctx;
}

export type { GenState, GeneratorLiveStatus };
