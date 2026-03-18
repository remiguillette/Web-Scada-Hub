import { useEffect, useMemo, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  Cat,
  CircuitBoard,
  Clock3,
  Database,
  Gauge,
  Power,
  ShieldAlert,
  Siren,
  Zap,
} from "lucide-react";
import { ElectricalOneLine } from "@/components/ElectricalOneLine";
import { LED } from "@/components/LED";
import { Panel } from "@/components/Panel";
import { useScadaState, type Alarm, type SystemState } from "@/hooks/use-scada-state";
import { cn } from "@/lib/utils";

const STATE_STYLE: Record<SystemState, string> = {
  RUN: "border-[#00f7a1]/60 text-[#00f7a1] shadow-[0_0_24px_rgba(0,247,161,0.16)]",
  STANDBY: "border-[#ffb347]/60 text-[#ffb347] shadow-[0_0_24px_rgba(255,179,71,0.14)]",
  STOP: "border-[#334155] text-[#94a3b8]",
  FAULT: "border-[#ff4d5a]/70 text-[#ff4d5a] shadow-[0_0_24px_rgba(255,77,90,0.18)]",
};

const ALARM_STYLE: Record<Alarm["type"], string> = {
  CRITICAL: "border-[#ff4d5a]/30 bg-[#2a0b12] text-[#ffd7dc]",
  WARNING: "border-[#ffb347]/30 bg-[#231708] text-[#ffe4ba]",
  INFO: "border-[#00dcff]/20 bg-[#071723] text-[#c4f5ff]",
};

function formatUptime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function ValueCard({ title, value, unit, icon, accent = "cyan" }: { title: string; value: string; unit?: string; icon: React.ReactNode; accent?: "cyan" | "green" | "amber" | "red"; }) {
  const accents = {
    cyan: "border-[#2a3a3a] from-[#141a1a] to-[#1a2222] text-[#dff8ff]",
    green: "border-[#1a3a28] from-[#0e160e] to-[#121a12] text-[#e8fff4]",
    amber: "border-[#3a2a10] from-[#181208] to-[#1c160a] text-[#fff1d6]",
    red: "border-[#3a1a20] from-[#16090d] to-[#1c0c11] text-[#ffe0e4]",
  };

  return (
    <div className={cn("rounded-2xl border bg-gradient-to-br p-4", accents[accent])}>
      <div className="mb-5 flex items-center justify-between">
        <div className="font-display text-xs uppercase tracking-[0.18em] text-[#8ca5bf]">{title}</div>
        <div className="text-[#00f7a1]">{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <div className="font-mono text-4xl font-semibold tracking-[0.08em]">{value}</div>
        {unit ? <div className="pb-1 font-mono text-sm text-[#8ca5bf]">{unit}</div> : null}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state, actions } = useScadaState();
  const [now, setNow] = useState(new Date());
  const [oneLineExpanded, setOneLineExpanded] = useState(false);
  const toggleOneLine = useCallback(() => setOneLineExpanded((v) => !v), []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeAlarms = useMemo(() => state.alarms.filter((alarm) => alarm.active).length, [state.alarms]);
  const countdownMs = Math.max(0, state.nextFeedingTime.getTime() - now.getTime());
  const countdown = `${String(Math.floor(countdownMs / 60000)).padStart(2, "0")}:${String(Math.floor((countdownMs % 60000) / 1000)).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-[#141414] text-[#d6deea]">
      <header className="sticky top-0 z-20 border-b border-[#2a2a2a] bg-[#0d0d0d]/95 backdrop-blur px-6 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1f8a61]/40 bg-[#161c18] shadow-[0_0_20px_rgba(0,247,161,0.12)]">
              <Cat className="h-6 w-6 text-[#00f7a1]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-semibold tracking-[0.18em] text-white">CAT_FEEDER_SYS_01</h1>
                <span className="rounded-md border border-[#333333] bg-[#1e1e1e] px-3 py-1 font-mono text-xs tracking-[0.18em] text-[#9aaa9a]">AUTO DISPENSER SCADA</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm tracking-[0.16em] text-[#8a9a8a]">
                <span>UPTIME: {formatUptime(state.uptime)}</span>
                <span>NODE: PLC-001 / MCC-FDR-2</span>
                <span>TIME: {format(now, "yyyy-MM-dd HH:mm:ss")}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className={cn("rounded-2xl border bg-[#1a1a1a] px-4 py-3", STATE_STYLE[state.systemState])}>
              <div className="mb-1 font-display text-[11px] uppercase tracking-[0.2em] text-[#8a9a8a]">Overall Status</div>
              <div className="flex items-center gap-2 font-display text-xl tracking-[0.15em]">
                <LED on={state.systemState === "RUN"} color={state.systemState === "FAULT" ? "red" : state.systemState === "STANDBY" ? "amber" : "green"} size="md" />
                {state.systemState}
              </div>
            </div>
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3">
              <div className="mb-1 font-display text-[11px] uppercase tracking-[0.2em] text-[#8a9a8a]">Active Alarms</div>
              <div className={cn("flex items-center gap-2 font-display text-xl tracking-[0.15em]", activeAlarms > 0 ? "text-[#ff4d5a]" : "text-[#00f7a1]") }>
                <AlertTriangle className="h-5 w-5" /> {activeAlarms}
              </div>
            </div>
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3">
              <div className="mb-1 font-display text-[11px] uppercase tracking-[0.2em] text-[#8a9a8a]">Mode</div>
              <div className="font-display text-xl tracking-[0.15em] text-[#b0d4b0]">{state.systemMode}</div>
            </div>
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3">
              <div className="mb-1 font-display text-[11px] uppercase tracking-[0.2em] text-[#8a9a8a]">Next Auto Feed</div>
              <div className="font-mono text-2xl tracking-[0.12em] text-[#e0ece0]">{countdown}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1700px] grid-cols-1 gap-5 p-5 2xl:grid-cols-[1.15fr_1.45fr]">
        <div className="space-y-5">
          <Panel
            title="Electrical One-Line"
            icon={<Zap className="h-4 w-4" />}
            expanded={oneLineExpanded}
            onToggleExpand={toggleOneLine}
          >
            <ElectricalOneLine
              disconnectClosed={state.disconnectClosed}
              breakerTripped={state.breakerTripped}
              feederContactor={state.feederContactor}
              solenoidContactor={state.solenoidContactor}
              motorPowered={state.motorPowered}
              gateOpen={state.gateOpen}
              voltage={state.voltage}
              current={state.current}
              onToggleDisconnect={actions.toggleDisconnect}
              onToggleBreaker={state.breakerTripped ? actions.resetBreaker : actions.tripBreaker}
            />
          </Panel>

          <Panel title="Command / Safety Controls" icon={<Power className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {[
                { label: state.feedActive ? "FEED CYCLE ACTIVE" : "START FEED CYCLE", onClick: actions.triggerFeed, style: "border-[#00f7a1]/45 text-[#00f7a1] hover:bg-[#00f7a1]/10" },
                { label: "REFILL HOPPER", onClick: actions.refillHopper, style: "border-[#00dcff]/45 text-[#00dcff] hover:bg-[#00dcff]/10" },
                { label: state.estopPressed ? "RESET ESTOP" : "EMERGENCY STOP", onClick: state.estopPressed ? actions.resetEstop : actions.pressEstop, style: state.estopPressed ? "border-[#ffb347]/45 text-[#ffb347] hover:bg-[#ffb347]/10" : "border-[#ff4d5a]/45 text-[#ff4d5a] hover:bg-[#ff4d5a]/10" },
                { label: "REMOVE BOWL", onClick: actions.removeBowl, style: "border-[#334155] text-[#9fb0c7] hover:bg-[#111827]" },
                { label: "RESTORE BOWL", onClick: actions.restoreBowl, style: "border-[#334155] text-[#9fb0c7] hover:bg-[#111827]" },
                { label: "EMPTY BOWL", onClick: actions.clearBowl, style: "border-[#334155] text-[#9fb0c7] hover:bg-[#111827]" },
              ].map((button) => (
                <button
                  key={button.label}
                  type="button"
                  onClick={button.onClick}
                  className={cn("rounded-xl border bg-[#0a121f] px-4 py-3 text-left font-display text-sm tracking-[0.14em] transition", button.style)}
                >
                  {button.label}
                </button>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="PLC-001 Status" icon={<CircuitBoard className="h-4 w-4" />}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1c2c40] bg-[#09111d] px-4 py-3">
              <div>
                <div className="font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">Controller Health</div>
                <div className="mt-1 font-mono text-sm tracking-[0.16em] text-[#cfe6f4]">24VDC logic healthy / scan executing</div>
              </div>
              <div className="flex items-center gap-5 rounded-xl border border-[#243245] bg-[#060d16] px-4 py-3">
                <LED on={state.systemState === "RUN"} color="green" label="RUN" />
                <LED on={state.systemState === "STANDBY" || state.systemState === "STOP"} color="amber" label="STOP" />
                <LED on={state.systemState === "FAULT"} color="red" label="FLT" />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-[#1c2c40] bg-[#09111d] p-4">
                <div className="mb-4 font-display text-sm uppercase tracking-[0.16em] text-[#cfd8e3]">Discrete Inputs (DI)</div>
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
                <div className="mb-4 font-display text-sm uppercase tracking-[0.16em] text-[#cfd8e3]">Discrete Outputs (DO)</div>
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

          <Panel title="Real-Time Process Values" icon={<Database className="h-4 w-4" />}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ValueCard title="Supply Voltage" value={state.voltage.toFixed(1)} unit="V" icon={<Zap className="h-5 w-5" />} accent={state.isPowered ? "cyan" : "red"} />
              <ValueCard title="Motor Current" value={state.current.toFixed(2)} unit="A" icon={<Activity className="h-5 w-5" />} accent={state.motorPowered ? "green" : "cyan"} />
              <ValueCard title="Hopper Level" value={state.hopperLevel.toFixed(1)} unit="%" icon={<Gauge className="h-5 w-5" />} accent={state.hopperLow ? "amber" : "green"} />
              <ValueCard title="Bowl Level / Portion" value={state.bowlLevel.toFixed(1)} unit="%" icon={<Database className="h-5 w-5" />} accent={state.bowlLevel <= 20 ? "amber" : "cyan"} />
              <ValueCard title="Today's Feeds" value={String(state.feedCount)} icon={<Clock3 className="h-5 w-5" />} accent="cyan" />
              <ValueCard title="System Mode" value={state.systemMode} icon={<ShieldAlert className="h-5 w-5" />} accent={state.systemMode === "LOCKOUT" ? "red" : state.systemMode === "AUTO" ? "green" : "amber"} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#1c2c40] bg-[#09111d] p-4">
                <div className="mb-2 font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">Last Feed Time</div>
                <div className="font-mono text-lg tracking-[0.14em] text-[#e7edf6]">{state.lastFeedTime ? format(state.lastFeedTime, "yyyy-MM-dd HH:mm:ss") : "--"}</div>
              </div>
              <div className="rounded-2xl border border-[#1c2c40] bg-[#09111d] p-4">
                <div className="mb-2 font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">Process Synopsis</div>
                <div className="font-mono text-sm leading-6 tracking-[0.08em] text-[#b8c6d9]">
                  {state.isFault
                    ? "Feeder locked out due to protection condition. Reset fault inputs before restart."
                    : state.feedActive
                      ? "Motor and hopper gate are energized. Dry feed is being metered into the bowl."
                      : state.isPowered
                        ? "Electrical bus healthy. PLC armed and waiting for bowl demand / scheduled feed."
                        : "Main disconnect open or power unavailable. Downstream control circuit is de-energized."}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Alarms / Events" icon={<Siren className="h-4 w-4" />}>
            <div className="space-y-3">
              {state.alarms.map((alarm) => (
                <div key={alarm.id} className={cn("rounded-2xl border p-3", ALARM_STYLE[alarm.type], alarm.active && alarm.type === "CRITICAL" ? "alarm-blink" : "") }>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <LED on color={alarm.type === "CRITICAL" ? "red" : alarm.type === "WARNING" ? "amber" : "cyan"} />
                      <div>
                        <div className="font-display text-sm uppercase tracking-[0.12em]">{alarm.message}</div>
                        <div className="mt-1 font-mono text-xs tracking-[0.14em] text-[#93a6bf]">{format(alarm.timestamp, "yyyy-MM-dd HH:mm:ss")}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md border border-current/20 px-2 py-1 font-mono text-[11px] tracking-[0.18em]">{alarm.type}</span>
                      <span className={cn("rounded-md px-2 py-1 font-mono text-[11px] tracking-[0.18em]", alarm.active ? "bg-[#ffffff14] text-white" : "bg-[#00000026] text-[#9fb0c7]")}>{alarm.active ? "ACTIVE" : "EVENT"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}
