import { CircuitBoard } from "lucide-react";
import { LED } from "@/components/LED";
import { Panel } from "@/components/Panel";
import { useTranslation } from "@/context/LanguageContext";
import type { ScadaState } from "@/hooks/use-scada-state";

interface PlcStatusPanelProps {
  t: ReturnType<typeof useTranslation>["t"];
  state: Pick<ScadaState, "systemState" | "digitalInputs" | "digitalOutputs">;
}

export function PlcStatusPanel({ t, state }: PlcStatusPanelProps) {
  return (
    <Panel title={t.plcStatus} icon={<CircuitBoard className="h-4 w-4" />}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1c2c40] bg-[#09111d] px-4 py-3">
        <div>
          <div className="font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">{t.controllerHealth}</div>
          <div className="mt-1 font-mono text-sm tracking-[0.16em] text-[#cfe6f4]">{t.controllerHealthStatus}</div>
        </div>
        <div className="flex items-center gap-5 rounded-xl border border-[#243245] bg-[#060d16] px-4 py-3">
          <LED on={state.systemState === "RUN"} color="green" label="RUN" />
          <LED on={state.systemState === "STANDBY" || state.systemState === "STOP"} color="amber" label="STOP" />
          <LED on={state.systemState === "FAULT"} color="red" label="FLT" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#1c2c40] bg-[#09111d] p-4">
          <div className="mb-4 font-display text-sm uppercase tracking-[0.16em] text-[#cfd8e3]">{t.discreteInputs}</div>
          <div className="space-y-3">
            {state.digitalInputs.map((point) => (
              <div key={point.id} className="flex items-center gap-3 rounded-lg border border-[#142030] bg-[#07101a] px-3 py-2">
                <LED on={point.on} color={point.id === "DI-04" && point.on ? "amber" : point.id === "DI-06" && !point.on ? "red" : "green"} />
                <span className="font-mono text-sm tracking-[0.14em] text-[#9fb0c7]">{point.id}</span>
                <span className="font-display text-sm tracking-[0.08em] text-[#d6deea]">{point.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#1c2c40] bg-[#09111d] p-4">
          <div className="mb-4 font-display text-sm uppercase tracking-[0.16em] text-[#cfd8e3]">{t.discreteOutputs}</div>
          <div className="space-y-3">
            {state.digitalOutputs.map((point) => (
              <div key={point.id} className="flex items-center gap-3 rounded-lg border border-[#142030] bg-[#07101a] px-3 py-2">
                <LED on={point.on} color={point.id === "DO-04" ? "red" : point.id === "DO-03" ? "cyan" : "green"} />
                <span className="font-mono text-sm tracking-[0.14em] text-[#9fb0c7]">{point.id}</span>
                <span className="font-display text-sm tracking-[0.08em] text-[#d6deea]">{point.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
