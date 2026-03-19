import { Link } from "wouter";
import {
  Zap,
  GraduationCap,
  Activity,
  Gauge,
  Radio,
} from "lucide-react";
import { useGridState } from "@/context/GridStateContext";
import { cn } from "@/lib/utils";

const CONDUCTORS = [
  { label: "L1", color: "#5a82b5", glow: "rgba(90,130,181,0.5)", offColor: "#1e293b" },
  { label: "L2", color: "#c96a6a", glow: "rgba(201,106,106,0.5)", offColor: "#1e293b" },
  { label: "L3", color: "#c48e3b", glow: "rgba(196,142,59,0.5)", offColor: "#1e293b" },
  { label: "N", color: "#8f8f8f", glow: "rgba(143,143,143,0.3)", offColor: "#1a1a1a" },
  { label: "GND", color: "#5b8f6b", glow: "rgba(91,143,107,0.4)", offColor: "#1a2a1e" },
] as const;

function ConductorBar({
  label,
  color,
  glow,
  offColor,
  energized,
  animationDuration,
}: {
  label: string;
  color: string;
  glow: string;
  offColor: string;
  energized: boolean;
  animationDuration: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 text-right font-mono text-xs font-semibold tracking-[0.16em]" style={{ color: energized ? color : "#334155" }}>
        {label}
      </div>
      <div className="relative flex-1 overflow-hidden rounded-full" style={{ height: 10 }}>
        <div
          className="absolute inset-0 rounded-full transition-all duration-700"
          style={{
            backgroundColor: energized ? color : offColor,
            boxShadow: energized ? `0 0 12px ${glow}, 0 0 4px ${glow}` : "none",
          }}
        />
        {energized && label !== "N" && label !== "GND" && (
          <div
            className="conductor-flow absolute inset-0"
            style={
              {
                "--flow-color": color,
                "--flow-duration": `${animationDuration}s`,
              } as React.CSSProperties
            }
          />
        )}
      </div>
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-500"
        style={{
          borderColor: energized ? `${color}60` : "#1e293b",
          backgroundColor: energized ? `${color}15` : "#0a0a0a",
        }}
      >
        <Zap
          className="h-3 w-3 transition-all duration-300"
          style={{ color: energized ? color : "#334155" }}
        />
      </div>
    </div>
  );
}

function MetricBadge({
  label,
  value,
  unit,
  icon,
  active,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border px-4 py-3 transition-all duration-500",
        active ? "border-[#00dcff]/20 bg-[#060e12]" : "border-[#1e2a2a] bg-[#060c0c]",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={active ? "text-[#00dcff]" : "text-[#334155]"}>{icon}</span>
        <span className="font-display text-[10px] uppercase tracking-[0.2em] text-[#5a7a8a]">
          {label}
        </span>
      </div>
      <div className="flex items-end gap-1">
        <span
          className={cn(
            "font-mono text-xl font-semibold tracking-[0.06em]",
            active ? "text-white" : "text-[#334155]",
          )}
        >
          {value}
        </span>
        <span className="pb-0.5 font-mono text-xs text-[#475569]">{unit}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state } = useGridState();

  const flowDuration = state.energized && state.powerKw > 0
    ? Math.max(0.3, 2.5 - (state.powerKw / 100) * 2.0)
    : 1.5;

  return (
    <div className="min-h-screen bg-[#080c0c] text-[#d6deea]">
      <header className="sticky top-0 z-20 border-b border-[#131e1e] bg-[#060a0a]/95 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00dcff]/25 bg-[#060e12]">
              <GraduationCap className="h-5 w-5 text-[#00dcff]" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold tracking-[0.14em] text-white">
                STUDENT VIEW
              </div>
              <div className="font-mono text-[11px] tracking-[0.16em] text-[#4a6a7a]">
                Local Area Network — Street Distribution Grid
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-[11px] tracking-[0.16em] transition-all duration-500",
                state.energized
                  ? "border-[#00f7a1]/30 bg-[#00f7a1]/8 text-[#00f7a1]"
                  : "border-[#1e2a2a] bg-[#060c0c] text-[#334155]",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-300",
                  state.energized ? "bg-[#00f7a1] shadow-[0_0_6px_#00f7a1]" : "bg-[#334155]",
                )}
              />
              {state.energized ? "GRID LIVE" : "GRID OFFLINE"}
            </div>
            <Link
              href="/teacher"
              className="flex items-center gap-1.5 rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-2 font-mono text-xs tracking-[0.14em] text-[#7f93ac] transition hover:border-[#ffd166]/30 hover:text-[#ffd166]"
            >
              TEACHER PANEL →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="rounded-2xl border border-[#131e1e] bg-[#060c0c] p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-white">
                Distribution Conductors
              </div>
              <div className="mt-0.5 font-mono text-[11px] tracking-[0.1em] text-[#4a6a7a]">
                600Y / 347 V — Street Bus
              </div>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[10px] tracking-[0.14em] transition-all duration-300",
                state.energized
                  ? "border-[#00dcff]/30 bg-[#00dcff]/8 text-[#00dcff]"
                  : "border-[#1e2a2a] bg-transparent text-[#334155]",
              )}
            >
              <Radio className="h-3 w-3" />
              {state.energized ? "FLOW ACTIVE" : "NO FLOW"}
            </div>
          </div>

          <div className="space-y-5">
            {CONDUCTORS.map((c) => (
              <ConductorBar
                key={c.label}
                label={c.label}
                color={c.color}
                glow={c.glow}
                offColor={c.offColor}
                energized={state.energized}
                animationDuration={flowDuration}
              />
            ))}
          </div>

          {!state.energized && (
            <div className="mt-6 rounded-xl border border-[#1e2a2a] bg-[#040808] px-4 py-3 text-center font-mono text-xs tracking-[0.14em] text-[#334155]">
              Waiting for power injection from the Teacher panel...
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricBadge
            label="Voltage"
            value={state.voltage.toFixed(1)}
            unit="V"
            icon={<Zap className="h-3.5 w-3.5" />}
            active={state.energized}
          />
          <MetricBadge
            label="Frequency"
            value={state.frequency.toFixed(2)}
            unit="Hz"
            icon={<Activity className="h-3.5 w-3.5" />}
            active={state.energized}
          />
          <MetricBadge
            label="Current"
            value={state.current.toFixed(2)}
            unit="A"
            icon={<Gauge className="h-3.5 w-3.5" />}
            active={state.energized}
          />
          <MetricBadge
            label="Power"
            value={state.powerKw.toFixed(1)}
            unit="kW"
            icon={<Zap className="h-3.5 w-3.5" />}
            active={state.energized}
          />
        </div>

        <div className="rounded-2xl border border-[#131e1e] bg-[#060c0c] p-5">
          <div className="mb-3 font-display text-xs uppercase tracking-[0.2em] text-[#4a6a7a]">
            Conductor Legend
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {CONDUCTORS.map((c) => (
              <div key={c.label} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: state.energized ? c.color : "#1e293b" }}
                />
                <span
                  className="font-mono text-xs tracking-[0.14em]"
                  style={{ color: state.energized ? c.color : "#334155" }}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#131e1e] bg-[#040808] p-3">
            <Zap className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", state.energized ? "text-[#00dcff]" : "text-[#334155]")} />
            <p className="font-mono text-[11px] leading-5 tracking-[0.08em] text-[#5a7a8a]">
              {state.energized
                ? `Energy flowing at ${state.powerKw.toFixed(1)} kW — ${state.voltage.toFixed(1)} V / ${state.frequency.toFixed(2)} Hz. Arrow animation speed reflects injected power.`
                : "No energy flow detected. The coupling circuit breaker on the Teacher panel must be closed to energize the grid."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
