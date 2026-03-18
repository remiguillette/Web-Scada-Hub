import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Activity, AlertTriangle, Cpu, Power,
  ShieldAlert, Zap, Database, Radio
} from "lucide-react";
import { useScadaState, SystemState } from "@/hooks/use-scada-state";
import { Panel } from "@/components/Panel";
import { LED } from "@/components/LED";
import { ElectricalOneLine } from "@/components/ElectricalOneLine";
import { cn } from "@/lib/utils";

const STATE_STYLE: Record<SystemState, { badge: string; icon: string }> = {
  RUN:    { badge: "border-[#00ff50] text-[#00ff50] shadow-[0_0_12px_rgba(0,255,80,0.4)]",  icon: "bg-[#00ff50] led-pulse shadow-[0_0_8px_rgba(0,255,80,0.9)]" },
  STANDBY:{ badge: "border-[#ffb300] text-[#ffb300] shadow-[0_0_12px_rgba(255,175,0,0.4)]", icon: "bg-[#ffb300] led-pulse shadow-[0_0_8px_rgba(255,175,0,0.9)]" },
  STOP:   { badge: "border-[#4a6a7a] text-[#6a8a9a]", icon: "bg-[#3a4a5a]" },
  FAULT:  { badge: "border-[#ff3232] text-[#ff3232] shadow-[0_0_12px_rgba(255,50,50,0.5)] animate-pulse", icon: "bg-[#ff3232] led-pulse shadow-[0_0_8px_rgba(255,50,50,0.9)]" },
};

export default function Dashboard() {
  const { state, actions } = useScadaState();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const activeAlarms = state.alarms.filter(a => a.active).length;

  return (
    <div className="min-h-screen bg-[#060b12] text-[#c8d8e8] flex flex-col font-sans overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="h-[52px] border-b border-[#1a2e42] bg-[#060e1a] flex items-center justify-between px-5 shrink-0 z-10">
        {/* Left: logo + metadata */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded border border-[#00dcff]/40 bg-[#00dcff]/10 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-[#00dcff]" />
            </div>
            <div>
              <div className="font-mono text-[13px] font-bold tracking-[0.12em] text-[#00dcff] text-glow-cyan leading-none">
                CAT_FEEDER_SYS_01
              </div>
              <div className="font-mono text-[9px] text-[#3a6070] tracking-wider mt-0.5">
                NODE: N-442 &nbsp;|&nbsp; UPTIME: {formatUptime(state.uptime)}
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 ml-2">
            <span className="font-mono text-[10px] text-[#1e3a50] border border-[#1e3a50] rounded px-2 py-0.5 tracking-widest">
              v2.4.1
            </span>
          </div>
        </div>

        {/* Right: status badge + alarm counter + clock */}
        <div className="flex items-center gap-4">
          {/* System Status */}
          <div className="flex flex-col items-center">
            <span className="font-display text-[8px] text-[#3a5a6a] tracking-[0.15em] mb-1">SYSTEM STATUS</span>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded border font-display text-[11px] font-bold tracking-[0.15em]",
              STATE_STYLE[state.systemState].badge
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", STATE_STYLE[state.systemState].icon)} />
              {state.systemState}
            </div>
          </div>

          {/* Active Alarms */}
          <div className="flex flex-col items-center">
            <span className="font-display text-[8px] text-[#3a5a6a] tracking-[0.15em] mb-1">ACTIVE ALARMS</span>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded border font-display text-[11px] font-bold tracking-[0.15em]",
              activeAlarms > 0
                ? "border-[#ff3232]/60 text-[#ff3232] bg-[#ff3232]/5"
                : "border-[#1e3a50] text-[#3a5a6a]"
            )}>
              <AlertTriangle className="w-3 h-3" />
              {activeAlarms}
            </div>
          </div>

          {/* Clock */}
          <div className="hidden lg:flex flex-col items-end font-mono">
            <span className="text-[13px] text-[#8aaabb] tracking-widest">{format(time, "HH:mm:ss")}</span>
            <span className="text-[9px] text-[#3a5a6a] tracking-wider">{format(time, "yyyy-MM-dd")}</span>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto">

        {/* PANEL 1: ELECTRICAL ONE-LINE (3 cols) */}
        <Panel
          title="Electrical One-Line"
          icon={<Zap className="w-3.5 h-3.5" />}
          className="lg:col-span-3 min-h-[620px]"
          status={state.isPowered ? "ok" : "warning"}
        >
          <ElectricalOneLine
            disconnectClosed={state.disconnectClosed}
            breakerTripped={state.breakerTripped}
            feedActive={state.feedActive}
            isPowered={state.isPowered}
            voltage={state.voltage}
            current={state.current}
            onToggleDisconnect={actions.toggleDisconnect}
            onTripBreaker={actions.tripBreaker}
            onResetBreaker={actions.resetBreaker}
          />
        </Panel>

        {/* MIDDLE: PLC STATUS + PROCESS (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">

          {/* PLC-001 STATUS */}
          <Panel
            title="PLC-001 Status"
            icon={<Cpu className="w-3.5 h-3.5" />}
            status="ok"
          >
            {/* RUN / STOP / FLT indicator row */}
            <div className="flex items-center justify-end gap-4 mb-4 pb-3 border-b border-[#1a2e42]">
              <LED on={state.systemState === "RUN"}    color="green" label="RUN" size="sm" />
              <LED on={state.systemState === "STOP" || state.systemState === "STANDBY"} color="amber" label="STOP" size="sm" />
              <LED on={state.systemState === "FAULT"}  color="red"   label="FLT" size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
              {/* DI header */}
              <div className="col-span-1 text-[9px] font-display text-[#00dcff]/70 border-b border-[#1a2e42] pb-1 mb-1 tracking-[0.18em]">
                DISCRETE INPUTS (DI)
              </div>
              <div className="col-span-1 text-[9px] font-display text-[#00dcff]/70 border-b border-[#1a2e42] pb-1 mb-1 tracking-[0.18em]">
                DISCRETE OUTPUTS (DO)
              </div>

              <LED on={state.disconnectClosed}             label="DI-01 MDS-001 ON" />
              <LED on={state.feedActive}                   label="DO-01 FEEDER CTR" />

              <LED on={!state.breakerTripped}              label="DI-02 CB-001 OK" />
              <LED on={state.feedActive}                   label="DO-02 HOPPER SOL" />

              <LED on={state.hopperLevel > 70}             label="DI-03 HOPPER HIGH" />
              <LED on={state.systemState === "RUN" || state.systemState === "STANDBY"} label="DO-03 BEACON GRN" />

              <LED on={state.hopperLevel < 20} color={state.hopperLevel < 20 ? "red" : "green"} label="DI-04 HOPPER LOW" />
              <LED on={state.systemState === "FAULT"}      color="red" label="DO-04 BEACON RED" />

              <LED on={state.bowlDetected}                 label="DI-05 BOWL DETECT" />
              <div />

              <LED on={!state.estopPressed}  color="red"  label="DI-06 ESTOP NC" />
              <div />
            </div>
          </Panel>

          {/* REAL-TIME PROCESS VALUES */}
          <Panel
            title="Real-Time Process Values"
            icon={<Database className="w-3.5 h-3.5" />}
            className="flex-1"
          >
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Supply Voltage */}
              <div className="bg-[#030912] border border-[#1a2e42] rounded p-3 relative overflow-hidden">
                <div className="absolute right-2 top-2 opacity-10">
                  <Zap className="w-10 h-10 text-[#00dcff]" />
                </div>
                <span className="font-display text-[9px] text-[#4a6a7a] tracking-widest">SUPPLY VOLTAGE</span>
                <div className="font-mono text-3xl font-bold text-[#00dcff] text-glow-cyan mt-1 leading-none">
                  {state.voltage.toFixed(1)}
                  <span className="text-base font-normal text-[#3a6070] ml-1">V</span>
                </div>
              </div>

              {/* Motor Current */}
              <div className="bg-[#030912] border border-[#1a2e42] rounded p-3 relative overflow-hidden">
                <div className="absolute right-2 top-2 opacity-10">
                  <Activity className="w-10 h-10 text-[#00ff50]" />
                </div>
                <span className="font-display text-[9px] text-[#4a6a7a] tracking-widest">MOTOR CURRENT</span>
                <div className="font-mono text-3xl font-bold text-[#00ff50] text-glow-green mt-1 leading-none">
                  {state.current > 0 ? state.current.toFixed(2) : "0.00"}
                  <span className="text-base font-normal text-[#2a5030] ml-1">A</span>
                </div>
                <div className="w-full bg-[#0d1e12] h-1 mt-2 rounded overflow-hidden">
                  <div
                    className="h-full bg-[#00ff50] transition-all duration-300 shadow-[0_0_6px_rgba(0,255,80,0.6)]"
                    style={{ width: `${Math.min((state.current / 5) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Hopper Level */}
              <div className="bg-[#030912] border border-[#1a2e42] rounded p-3">
                <span className="font-display text-[9px] text-[#4a6a7a] tracking-widest block mb-2">HOPPER LEVEL</span>
                <div className="flex items-end gap-3">
                  {/* Mini bar */}
                  <div className="w-6 h-20 bg-[#0d1e12] border border-[#1a2e42] rounded-sm overflow-hidden flex flex-col justify-end relative">
                    <div
                      className={cn(
                        "w-full transition-all duration-1000 ease-out",
                        state.hopperLevel > 50 ? "bg-[#00ff50] shadow-[0_0_8px_rgba(0,255,80,0.5)]"
                          : state.hopperLevel > 20 ? "bg-[#ffb300] shadow-[0_0_8px_rgba(255,175,0,0.5)]"
                          : "bg-[#ff3232] shadow-[0_0_8px_rgba(255,50,50,0.5)]"
                      )}
                      style={{ height: `${state.hopperLevel}%` }}
                    />
                  </div>
                  <div>
                    <div className={cn(
                      "font-mono text-2xl font-bold leading-none",
                      state.hopperLevel > 50 ? "text-[#00ff50] text-glow-green"
                        : state.hopperLevel > 20 ? "text-[#ffb300] text-glow-amber"
                        : "text-[#ff3232] text-glow-red"
                    )}>
                      {state.hopperLevel}
                      <span className="text-sm font-normal ml-0.5">%</span>
                    </div>
                    <button
                      onClick={actions.refillHopper}
                      className="mt-2 px-2 py-0.5 bg-[#0a1e2a] border border-[#1e3a50] hover:border-[#00dcff]/50 rounded text-[9px] font-display tracking-widest text-[#4a6a7a] hover:text-[#00dcff] transition-all"
                    >
                      REFILL
                    </button>
                  </div>
                </div>
              </div>

              {/* Today's Feeds */}
              <div className="bg-[#030912] border border-[#1a2e42] rounded p-3 relative overflow-hidden">
                <div className="absolute right-2 top-2 opacity-10">
                  <Activity className="w-10 h-10 text-[#00dcff]" />
                </div>
                <span className="font-display text-[9px] text-[#4a6a7a] tracking-widest">TODAY'S FEEDS</span>
                <div className="font-mono text-3xl font-bold text-[#00dcff] text-glow-cyan mt-1 leading-none">
                  {state.feedCount.toString().padStart(5, "0")}
                </div>
                <span className="font-display text-[8px] text-[#3a5a6a] tracking-wider">LIFETIME TOTAL</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* RIGHT: CONTROLS (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Panel title="Manual Controls" icon={<Radio className="w-3.5 h-3.5" />}>
            <div className="flex flex-col gap-3">

              {/* Power Management */}
              <div className="bg-[#030912] rounded border border-[#1a2e42] p-3">
                <div className="text-[9px] font-display text-[#3a5a6a] tracking-[0.18em] mb-3 pb-1.5 border-b border-[#1a2e42]">
                  POWER MANAGEMENT
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[11px] text-[#8aaabb]">MDS-001 (MAIN)</span>
                  <button
                    onClick={actions.toggleDisconnect}
                    className={cn(
                      "px-4 py-1.5 font-display text-[11px] font-bold tracking-wider rounded border transition-all active:scale-95",
                      state.disconnectClosed
                        ? "bg-[#00dcff]/10 text-[#00dcff] border-[#00dcff]/50 shadow-[0_0_12px_rgba(0,220,255,0.25)]"
                        : "bg-[#0a1628] text-[#4a6a7a] border-[#1e3048] hover:border-[#3a5a6a]"
                    )}
                  >
                    {state.disconnectClosed ? "ON (CLOSED)" : "OFF (OPEN)"}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#8aaabb]">CB-001 (BREAKER)</span>
                  <div className="flex gap-2">
                    <button
                      onClick={actions.tripBreaker}
                      disabled={state.breakerTripped}
                      className="px-3 py-1 text-[10px] font-display rounded border border-[#1e3048] text-[#4a6a7a] hover:border-[#ff3232]/60 hover:text-[#ff3232] transition-all disabled:opacity-40 disabled:pointer-events-none"
                    >
                      TRIP
                    </button>
                    <button
                      onClick={actions.resetBreaker}
                      disabled={!state.breakerTripped}
                      className="px-3 py-1 text-[10px] font-display rounded border border-[#1e3048] text-[#4a6a7a] hover:border-[#00ff50]/60 hover:text-[#00ff50] transition-all disabled:opacity-40 disabled:pointer-events-none"
                    >
                      RESET
                    </button>
                  </div>
                </div>
              </div>

              {/* E-STOP */}
              <div className="bg-[#030912] rounded border border-[#ff3232]/25 p-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-[repeating-linear-gradient(90deg,#ff3232_0px,#ff3232_8px,transparent_8px,transparent_16px)] opacity-40" />
                <div className="text-[9px] font-display text-[#ff3232]/80 tracking-[0.18em] mb-3">
                  EMERGENCY STOP
                </div>
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={actions.pressEstop}
                    className={cn(
                      "w-28 h-28 rounded-full font-display font-bold text-xl transition-all shadow-xl active:scale-90",
                      state.estopPressed
                        ? "bg-[#1a0505] text-[#ff3232]/40 border-4 border-[#ff3232]/20"
                        : "bg-gradient-to-b from-[#cc1111] to-[#880000] text-white border-4 border-[#550000] shadow-[0_0_24px_rgba(255,0,0,0.35),0_8px_20px_rgba(0,0,0,0.5)] hover:brightness-110"
                    )}
                  >
                    E-STOP
                  </button>
                  <button
                    onClick={actions.resetEstop}
                    disabled={!state.estopPressed}
                    className="w-full py-1.5 bg-[#0a1628] text-[11px] font-display tracking-widest rounded border border-[#1e3048] text-[#4a6a7a] hover:text-[#8aaabb] hover:border-[#3a5a6a] disabled:opacity-40 disabled:pointer-events-none transition-all"
                  >
                    PULL TO RESET
                  </button>
                </div>
              </div>

              {/* Trigger Feed */}
              <div className="bg-[#030912] rounded border border-[#1a2e42] p-3">
                <button
                  onClick={actions.triggerFeed}
                  disabled={state.systemState !== "STANDBY"}
                  className={cn(
                    "w-full py-4 rounded font-display text-base font-bold tracking-[0.2em] transition-all border",
                    state.systemState === "STANDBY"
                      ? "bg-[#00ff50]/10 text-[#00ff50] border-[#00ff50]/50 shadow-[0_0_20px_rgba(0,255,80,0.3)] hover:bg-[#00ff50]/20 active:scale-95"
                      : "bg-[#0a1628] text-[#3a5a6a] border-[#1e3048] cursor-not-allowed"
                  )}
                >
                  {state.feedActive ? "DISPENSING..." : "TRIGGER FEED"}
                </button>
                {state.systemState !== "STANDBY" && (
                  <p className="text-center text-[9px] text-[#ffb300] mt-2 font-mono tracking-wider">
                    SYSTEM MUST BE IN STANDBY TO FEED
                  </p>
                )}
              </div>

            </div>
          </Panel>
        </div>
      </main>

      {/* ── ALARM BANNER ───────────────────────────────────────────────── */}
      <footer className="h-44 border-t border-[#1a2e42] bg-[#040a14] flex flex-col shrink-0">
        <div className="px-4 py-1.5 bg-[#060e1a] border-b border-[#1a2e42] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[3px] h-4 bg-[#00dcff] rounded-full" />
            <span className="font-display text-[10px] text-[#00dcff] font-semibold tracking-[0.2em]">
              SYSTEM ALARMS &amp; EVENTS
            </span>
          </div>
          <span className="font-mono text-[9px] text-[#3a5a6a] tracking-wider">SHOWING LAST 5</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px]">
          {state.alarms.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#2a4a5a] text-xs tracking-widest">
              NO ACTIVE ALARMS
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {state.alarms.map(alarm => (
                <div
                  key={alarm.id}
                  className={cn(
                    "px-3 py-1.5 flex items-center gap-4 rounded border",
                    alarm.type === "CRITICAL" && "border-[#ff3232]/40 text-[#ff5050]",
                    alarm.type === "WARNING"  && "border-[#ffb300]/30 text-[#ffb300]",
                    alarm.type === "INFO"     && "border-[#00dcff]/20 text-[#00aacc]",
                    alarm.active && alarm.type === "CRITICAL" && "alarm-blink"
                  )}
                  style={{
                    backgroundColor:
                      alarm.type === "CRITICAL" ? "rgba(255,50,50,0.06)"
                      : alarm.type === "WARNING" ? "rgba(255,175,0,0.05)"
                      : "rgba(0,220,255,0.03)"
                  }}
                >
                  <span className="w-20 shrink-0 text-[#3a5a6a]">{format(alarm.timestamp, "HH:mm:ss")}</span>
                  <span className={cn(
                    "w-16 shrink-0 text-[9px] px-1.5 py-0.5 rounded border text-center font-display tracking-widest",
                    alarm.type === "CRITICAL" && "border-[#ff3232]/50 text-[#ff5050]",
                    alarm.type === "WARNING"  && "border-[#ffb300]/50 text-[#ffb300]",
                    alarm.type === "INFO"     && "border-[#00dcff]/30 text-[#00aacc]"
                  )}>
                    {alarm.type}
                  </span>
                  <span className="flex-1 font-bold tracking-wide">{alarm.message}</span>
                  <span className={cn(
                    "text-[9px] px-2 py-0.5 border rounded tracking-widest",
                    alarm.active ? "border-current opacity-80" : "border-[#1a2e42] text-[#3a5a6a]"
                  )}>
                    {alarm.active ? "ACTIVE" : "CLEARED"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
