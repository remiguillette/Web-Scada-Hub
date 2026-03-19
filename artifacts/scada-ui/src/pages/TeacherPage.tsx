import { useState } from "react";
import { Link } from "wouter";
import {
  Factory,
  ToggleLeft,
  ToggleRight,
  Zap,
  Radio,
  ArrowLeft,
  Activity,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Power,
} from "lucide-react";
import { useGridState } from "@/context/GridStateContext";
import { cn } from "@/lib/utils";

function SyncIndicator({ frequency, energized }: { frequency: number; energized: boolean }) {
  const inSync = energized && frequency >= 49.5 && frequency <= 50.5;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-xs tracking-[0.14em] transition-all duration-300",
        inSync
          ? "border-[#00f7a1]/40 bg-[#00f7a1]/8 text-[#00f7a1]"
          : energized
            ? "border-[#ffb347]/40 bg-[#ffb347]/8 text-[#ffb347]"
            : "border-[#334155]/60 bg-[#1a1a1a] text-[#475569]",
      )}
    >
      <Radio className="h-3.5 w-3.5" />
      {inSync
        ? `SYNC OK — ${frequency.toFixed(2)} Hz`
        : energized
          ? `SYNC PENDING — ${frequency.toFixed(2)} Hz`
          : "OFFLINE — 0.00 Hz"}
    </div>
  );
}

function MetricTile({
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
        "rounded-2xl border p-4 transition-all duration-300",
        active
          ? "border-[#00dcff]/30 bg-gradient-to-br from-[#0d1a1e] to-[#0a1318]"
          : "border-[#2a2a2a] bg-[#111]",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={active ? "text-[#00dcff]" : "text-[#334155]"}>{icon}</span>
        <span className="font-display text-[10px] uppercase tracking-[0.2em] text-[#6a8a9f]">
          {label}
        </span>
      </div>
      <div className="flex items-end gap-1.5">
        <span
          className={cn(
            "font-mono text-3xl font-semibold tracking-[0.06em]",
            active ? "text-white" : "text-[#334155]",
          )}
        >
          {value}
        </span>
        <span className="pb-0.5 font-mono text-sm text-[#5a7a8a]">{unit}</span>
      </div>
    </div>
  );
}

export default function TeacherPage() {
  const { state, setCoupling, setPower } = useGridState();
  const [pendingPower, setPendingPower] = useState<number | null>(null);

  const displayPower = pendingPower ?? state.powerKw;

  const handleCouplingToggle = () => {
    setCoupling(!state.couplingClosed);
    if (state.couplingClosed) {
      setPendingPower(null);
    }
  };

  const handlePowerCommit = () => {
    if (pendingPower !== null) {
      setPower(pendingPower);
      setPendingPower(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e0e] text-[#d6deea]">
      <header className="sticky top-0 z-20 border-b border-[#1e2a2a] bg-[#080c0c]/95 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-2 font-mono text-xs tracking-[0.14em] text-[#7f93ac] transition hover:border-[#00f7a1]/30 hover:text-[#00f7a1]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              STUDENT VIEW
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ffd166]/30 bg-[#1a1400]">
                <Factory className="h-5 w-5 text-[#ffd166]" />
              </div>
              <div>
                <div className="font-display text-lg font-semibold tracking-[0.14em] text-white">
                  TEACHER CONTROL PANEL
                </div>
                <div className="font-mono text-[11px] tracking-[0.16em] text-[#5a7a8a]">
                  Power Plant / Injection Station
                </div>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-xs tracking-[0.18em] transition-all duration-500",
              state.energized
                ? "border-[#00f7a1]/40 bg-[#00f7a1]/8 text-[#00f7a1]"
                : "border-[#334155]/60 bg-[#111] text-[#475569]",
            )}
          >
            {state.energized ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            {state.energized ? "GRID ENERGIZED" : "GRID OFFLINE"}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="rounded-2xl border border-[#1e2a1e] bg-gradient-to-br from-[#0a120a] to-[#0c160c] p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ffd166]/30 bg-[#1a1400]">
              <Factory className="h-5 w-5 text-[#ffd166]" />
            </div>
            <div>
              <div className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-white">
                Power Plant
              </div>
              <div className="font-mono text-[11px] tracking-[0.12em] text-[#5a7a8a]">
                GEN-PLANT-01 — Energy Source
              </div>
            </div>
            <div className="ml-auto">
              <SyncIndicator frequency={state.frequency} energized={state.energized} />
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between rounded-2xl border border-[#1e2e1e] bg-[#060e06] p-5">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-500",
                  state.couplingClosed
                    ? "border-[#00f7a1]/50 bg-[#00f7a1]/10"
                    : "border-[#2a2a2a] bg-[#111]",
                )}
              >
                <Power
                  className={cn(
                    "h-6 w-6 transition-colors duration-300",
                    state.couplingClosed ? "text-[#00f7a1]" : "text-[#334155]",
                  )}
                />
              </div>
              <div>
                <div className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-white">
                  Coupling Circuit Breaker
                </div>
                <div className="font-mono text-[11px] tracking-[0.1em] text-[#5a7a8a]">
                  CB-COUP-01 — Injection Point
                </div>
                <div
                  className={cn(
                    "mt-1.5 inline-block rounded border px-2 py-0.5 font-mono text-[10px] tracking-[0.18em]",
                    state.couplingClosed
                      ? "border-[#00f7a1]/30 bg-[#00f7a1]/8 text-[#00f7a1]"
                      : "border-[#334155]/60 bg-[#1a1a1a] text-[#475569]",
                  )}
                >
                  {state.couplingClosed ? "CLOSED — INJECTING" : "OPEN — ISOLATED"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCouplingToggle}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border px-5 py-3 font-display text-sm font-semibold tracking-[0.1em] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                state.couplingClosed
                  ? "border-[#ff4d5a]/40 bg-[#ff4d5a]/8 text-[#ff4d5a] hover:bg-[#ff4d5a]/15"
                  : "border-[#00f7a1]/40 bg-[#00f7a1]/8 text-[#00f7a1] hover:bg-[#00f7a1]/15",
              )}
            >
              {state.couplingClosed ? (
                <>
                  <ToggleRight className="h-5 w-5" />
                  OPEN BREAKER
                </>
              ) : (
                <>
                  <ToggleLeft className="h-5 w-5" />
                  CLOSE BREAKER
                </>
              )}
            </button>
          </div>

          <div
            className={cn(
              "rounded-2xl border p-5 transition-all duration-500",
              state.couplingClosed
                ? "border-[#00dcff]/20 bg-[#060e12]"
                : "border-[#1e2a2a] bg-[#060c0c] opacity-50 pointer-events-none",
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className={cn("h-4 w-4", state.couplingClosed ? "text-[#00dcff]" : "text-[#334155]")} />
                <span className="font-display text-xs uppercase tracking-[0.18em] text-[#8ca5bf]">
                  Injected Power
                </span>
              </div>
              <span className="font-mono text-2xl font-semibold tracking-[0.06em] text-white">
                {displayPower.toFixed(1)}
                <span className="ml-1 text-sm text-[#5a7a8a]">kW</span>
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={displayPower}
              disabled={!state.couplingClosed}
              onChange={(e) => setPendingPower(Number(e.target.value))}
              onMouseUp={handlePowerCommit}
              onTouchEnd={handlePowerCommit}
              className="w-full cursor-pointer accent-[#00dcff]"
            />

            <div className="mt-2 flex justify-between font-mono text-[10px] tracking-[0.14em] text-[#475569]">
              <span>0 kW</span>
              <span>25 kW</span>
              <span>50 kW</span>
              <span>75 kW</span>
              <span>100 kW</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[0, 25, 50, 75, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={!state.couplingClosed}
                  onClick={() => {
                    setPendingPower(preset);
                    setPower(preset);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-1 font-mono text-xs tracking-[0.14em] transition hover:scale-[1.02]",
                    displayPower === preset
                      ? "border-[#00dcff]/40 bg-[#00dcff]/10 text-[#00dcff]"
                      : "border-[#2a2a2a] bg-[#111] text-[#7f93ac] hover:border-[#00dcff]/20",
                  )}
                >
                  {preset} kW
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricTile
            label="Voltage"
            value={state.voltage.toFixed(1)}
            unit="V"
            icon={<Zap className="h-4 w-4" />}
            active={state.energized}
          />
          <MetricTile
            label="Frequency"
            value={state.frequency.toFixed(2)}
            unit="Hz"
            icon={<Activity className="h-4 w-4" />}
            active={state.energized}
          />
          <MetricTile
            label="Current"
            value={state.current.toFixed(2)}
            unit="A"
            icon={<Gauge className="h-4 w-4" />}
            active={state.energized}
          />
          <MetricTile
            label="Power"
            value={state.powerKw.toFixed(1)}
            unit="kW"
            icon={<Factory className="h-4 w-4" />}
            active={state.energized}
          />
        </div>

        <div className="rounded-2xl border border-[#1e2a2a] bg-[#060c0c] p-5">
          <div className="mb-3 font-display text-xs uppercase tracking-[0.2em] text-[#5a7a8a]">
            Injection Flow Diagram
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#ffd166]/30 bg-[#1a1400]">
                <Factory className="h-5 w-5 text-[#ffd166]" />
              </div>
              <span className="font-mono text-[9px] tracking-[0.1em] text-[#5a7a8a]">POWER PLANT</span>
            </div>

            <div
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-500",
                state.couplingClosed ? "bg-[#00f7a1]" : "bg-[#1e2a2a]",
              )}
            />

            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-500",
                  state.couplingClosed
                    ? "border-[#00f7a1]/40 bg-[#00f7a1]/8"
                    : "border-[#2a2a2a] bg-[#111]",
                )}
              >
                {state.couplingClosed ? (
                  <ToggleRight className="h-5 w-5 text-[#00f7a1]" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-[#334155]" />
                )}
              </div>
              <span className="font-mono text-[9px] tracking-[0.1em] text-[#5a7a8a]">COUPLER</span>
            </div>

            <div
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-500",
                state.energized ? "bg-[#00dcff]" : "bg-[#1e2a2a]",
              )}
            />

            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-500",
                  state.energized ? "border-[#00dcff]/40 bg-[#00dcff]/8" : "border-[#2a2a2a] bg-[#111]",
                )}
              >
                <Zap
                  className={cn(
                    "h-5 w-5 transition-colors duration-300",
                    state.energized ? "text-[#00dcff]" : "text-[#334155]",
                  )}
                />
              </div>
              <span className="font-mono text-[9px] tracking-[0.1em] text-[#5a7a8a]">DISTRIBUTION</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
