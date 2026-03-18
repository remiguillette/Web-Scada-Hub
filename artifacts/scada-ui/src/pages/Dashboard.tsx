import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Activity, AlertTriangle, Cpu, Power, Settings, ShieldAlert, Waves, Zap } from "lucide-react";
import { useScadaState, SystemState } from "@/hooks/use-scada-state";
import { Panel } from "@/components/Panel";
import { LED } from "@/components/LED";
import { ElectricalOneLine } from "@/components/ElectricalOneLine";
import { cn } from "@/lib/utils";

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
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // derived status colors
  const statusColorMap: Record<SystemState, string> = {
    RUN: "text-accent text-glow-green border-accent glow-green",
    STANDBY: "text-warning text-glow-amber border-warning glow-amber",
    STOP: "text-muted-foreground border-muted-foreground",
    FAULT: "text-destructive text-glow-red border-destructive glow-red animate-pulse"
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-primary">
            <Cpu className="w-6 h-6" />
            <h1 className="font-mono text-xl font-bold tracking-wider text-glow-cyan">CAT_FEEDER_SYS_01</h1>
          </div>
          <div className="hidden md:flex gap-4 border-l border-border pl-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-display">VERSION</span>
              <span className="font-mono text-xs">v2.4.1</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-display">NODE</span>
              <span className="font-mono text-xs">N-442</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-display">UPTIME</span>
              <span className="font-mono text-xs text-primary">{formatUptime(state.uptime)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={cn(
            "px-4 py-1 rounded border font-display font-bold tracking-widest text-sm flex items-center gap-2",
            statusColorMap[state.systemState]
          )}>
            <div className="w-2 h-2 rounded-full bg-current" />
            {state.systemState}
          </div>

          <div className="flex items-center gap-2 relative">
            <AlertTriangle className={cn("w-5 h-5", state.alarms.some(a => a.active) ? "text-destructive" : "text-muted-foreground")} />
            {state.alarms.filter(a => a.active).length > 0 && (
              <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {state.alarms.filter(a => a.active).length}
              </span>
            )}
          </div>

          <div className="hidden lg:flex flex-col text-right font-mono">
            <span className="text-sm">{format(time, 'HH:mm:ss')}</span>
            <span className="text-[10px] text-muted-foreground">{format(time, 'yyyy-MM-dd')}</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
        
        {/* PANEL 1: ELECTRICAL DIAGRAM (Cols 1-3) */}
        <Panel title="ELECTRICAL ONE-LINE" className="lg:col-span-3 min-h-[600px]" status={state.isPowered ? "ok" : "warning"}>
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

        {/* MIDDLE COLUMN: PLC & OVERVIEW (Cols 4-8) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <Panel title="PLC-001 STATUS" status="ok">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-background border border-border rounded p-3 flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-display">STATUS</span>
                <span className="text-accent font-mono text-sm font-bold">ONLINE</span>
              </div>
              <div className="bg-background border border-border rounded p-3 flex justify-around">
                <LED on={state.systemState === "RUN"} color="green" label="RUN" size="sm" />
                <LED on={state.systemState === "STOP" || state.systemState === "STANDBY"} color="amber" label="STP" size="sm" />
                <LED on={state.systemState === "FAULT"} color="red" label="FLT" size="sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm font-mono">
              <div className="col-span-2 text-xs font-display text-primary border-b border-border/50 pb-1 mb-1 mt-2">DIGITAL INPUTS</div>
              <LED on={state.disconnectClosed} label="DI-01 MDS-001 ON" />
              <LED on={!state.breakerTripped} label="DI-02 CB-001 OK" />
              <LED on={state.hopperLevel > 70} label="DI-03 HOPPER HIGH" />
              <LED on={state.hopperLevel < 20} label="DI-04 HOPPER LOW" color={state.hopperLevel < 20 ? "red" : "green"} />
              <LED on={state.bowlDetected} label="DI-05 BOWL DETECT" />
              <LED on={!state.estopPressed} label="DI-06 ESTOP NC" color="red" />

              <div className="col-span-2 text-xs font-display text-primary border-b border-border/50 pb-1 mb-1 mt-4">DIGITAL OUTPUTS</div>
              <LED on={state.feedActive} label="DO-01 FEEDER CTR" />
              <LED on={state.feedActive} label="DO-02 HOPPER SOL" />
              <LED on={state.systemState === "RUN" || state.systemState === "STANDBY"} label="DO-03 BEACON GRN" />
              <LED on={state.systemState === "FAULT"} label="DO-04 BEACON RED" color="red" />
            </div>
          </Panel>

          <Panel title="PROCESS OVERVIEW" className="flex-1">
            <div className="flex h-full gap-6">
              {/* Hopper Vis */}
              <div className="w-1/3 flex flex-col items-center">
                <span className="font-display text-xs text-muted-foreground mb-2">HOPPER LEVEL</span>
                <div className="relative w-16 flex-1 bg-background border-2 border-border rounded-b-xl rounded-t flex flex-col justify-end overflow-hidden p-1">
                  <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,.3)_25%,rgba(255,255,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.3)_75%,rgba(255,255,255,.3)_76%,transparent_77%,transparent)] bg-[length:100%_20px]" />
                  <div 
                    className={cn(
                      "w-full rounded-b-lg transition-all duration-1000 ease-out z-10",
                      state.hopperLevel > 50 ? "bg-accent glow-green" : state.hopperLevel > 20 ? "bg-warning glow-amber" : "bg-destructive glow-red"
                    )}
                    style={{ height: `${state.hopperLevel}%` }}
                  />
                </div>
                <span className="font-mono mt-2 text-xl font-bold">{state.hopperLevel}%</span>
                <button 
                  onClick={actions.refillHopper}
                  className="mt-3 px-3 py-1 bg-secondary hover:bg-secondary/80 border border-border rounded text-xs font-display transition-colors active:scale-95"
                >
                  REFILL
                </button>
              </div>

              {/* Stats */}
              <div className="w-2/3 flex flex-col justify-between">
                <div className="bg-background border border-border rounded p-4 relative overflow-hidden">
                  <Activity className="absolute right-2 top-2 text-border w-16 h-16 opacity-20" />
                  <span className="font-display text-xs text-muted-foreground">LIFETIME FEEDS</span>
                  <div className="font-mono text-4xl text-primary text-glow-cyan mt-1">{state.feedCount.toString().padStart(5, '0')}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-background border border-border rounded p-3 flex flex-col">
                    <span className="font-display text-[10px] text-muted-foreground">MOTOR CURRENT</span>
                    <div className="font-mono text-xl mt-1 text-accent">{state.current > 0 ? state.current.toFixed(2) : '0.00'} A</div>
                    <div className="w-full bg-secondary h-1.5 mt-2 rounded overflow-hidden">
                      <div className="h-full bg-accent transition-all duration-300" style={{ width: `${(state.current / 5) * 100}%` }} />
                    </div>
                  </div>
                  
                  <div className="bg-background border border-border rounded p-3 flex flex-col justify-between">
                    <span className="font-display text-[10px] text-muted-foreground">BOWL SENSOR</span>
                    <div className="flex items-center gap-2 mt-2">
                      <LED on={state.bowlDetected} color="cyan" size="lg" />
                      <span className="font-mono text-sm">{state.bowlDetected ? "DETECTED" : "EMPTY"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* RIGHT COLUMN: CONTROLS (Cols 9-12) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Panel title="MANUAL CONTROLS">
            <div className="flex flex-col gap-4">
              
              <div className="bg-background p-4 rounded border border-border">
                <h4 className="font-display text-xs text-muted-foreground mb-3 border-b border-border/50 pb-1">POWER MANAGEMENT</h4>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-sm">MDS-001 (MAIN)</span>
                  <button
                    onClick={actions.toggleDisconnect}
                    className={cn(
                      "px-4 py-2 font-display text-sm font-bold tracking-wider rounded transition-all active:scale-95",
                      state.disconnectClosed 
                        ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,229,255,0.4)]" 
                        : "bg-secondary text-muted-foreground border border-border hover:bg-secondary/80"
                    )}
                  >
                    {state.disconnectClosed ? "ON (CLOSED)" : "OFF (OPEN)"}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">CB-001 (BREAKER)</span>
                  <div className="flex gap-2">
                    <button
                      onClick={actions.tripBreaker}
                      disabled={state.breakerTripped}
                      className="px-3 py-1 bg-secondary text-xs font-display rounded border border-border hover:bg-destructive/20 hover:text-destructive hover:border-destructive transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      TRIP
                    </button>
                    <button
                      onClick={actions.resetBreaker}
                      disabled={!state.breakerTripped}
                      className="px-3 py-1 bg-secondary text-xs font-display rounded border border-border hover:bg-accent/20 hover:text-accent hover:border-accent transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      RESET
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-background p-4 rounded border border-destructive/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[repeating-linear-gradient(45deg,var(--color-destructive),var(--color-destructive)_10px,transparent_10px,transparent_20px)] opacity-50" />
                <h4 className="font-display text-xs text-destructive mb-3">EMERGENCY STOP</h4>
                
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={actions.pressEstop}
                    className={cn(
                      "w-32 h-32 rounded-full font-display font-bold text-2xl transition-all shadow-xl active:scale-90 active:shadow-inner",
                      state.estopPressed 
                        ? "bg-destructive/50 text-white/50 border-4 border-destructive/20 inset-shadow-sm" 
                        : "bg-gradient-to-b from-red-500 to-red-700 text-white border-4 border-red-900 shadow-[0_10px_20px_rgba(255,0,0,0.3)] hover:brightness-110"
                    )}
                  >
                    E-STOP
                  </button>
                  <button
                    onClick={actions.resetEstop}
                    disabled={!state.estopPressed}
                    className="w-full py-2 bg-secondary text-sm font-display rounded border border-border hover:bg-secondary/80 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    PULL TO RESET
                  </button>
                </div>
              </div>

              <div className="bg-background p-4 rounded border border-border mt-auto">
                <button
                  onClick={actions.triggerFeed}
                  disabled={state.systemState !== "STANDBY"}
                  className={cn(
                    "w-full py-4 rounded font-display text-lg font-bold tracking-widest transition-all",
                    state.systemState === "STANDBY"
                      ? "bg-accent text-accent-foreground shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:brightness-110 active:scale-95"
                      : "bg-secondary text-muted-foreground cursor-not-allowed border border-border"
                  )}
                >
                  {state.feedActive ? "DISPENSING..." : "TRIGGER FEED"}
                </button>
                {state.systemState !== "STANDBY" && (
                  <p className="text-center text-[10px] text-warning mt-2 font-mono">
                    SYSTEM MUST BE IN STANDBY TO FEED
                  </p>
                )}
              </div>

            </div>
          </Panel>
        </div>
      </main>

      {/* ALARM BANNER (Bottom) */}
      <footer className="h-48 border-t border-border bg-card flex flex-col shrink-0">
        <div className="px-4 py-1 bg-secondary/50 border-b border-border flex items-center justify-between">
          <span className="font-display text-xs text-primary font-bold tracking-widest">SYSTEM ALARMS & EVENTS</span>
          <span className="font-mono text-[10px] text-muted-foreground">SHOWING LAST 5</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 font-mono text-sm">
          {state.alarms.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground opacity-50">
              NO ACTIVE ALARMS
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {state.alarms.map(alarm => (
                <div 
                  key={alarm.id} 
                  className={cn(
                    "px-3 py-2 flex items-center gap-4 rounded border",
                    alarm.type === "CRITICAL" && "bg-destructive/10 border-destructive/50 text-destructive",
                    alarm.type === "WARNING" && "bg-warning/10 border-warning/50 text-warning",
                    alarm.type === "INFO" && "bg-primary/5 border-primary/20 text-primary",
                    alarm.active && alarm.type === "CRITICAL" && "animate-pulse"
                  )}
                >
                  <span className="w-24 shrink-0 opacity-70">{format(alarm.timestamp, 'HH:mm:ss')}</span>
                  <div className="w-20 shrink-0">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] bg-background/50 border",
                      alarm.type === "CRITICAL" && "border-destructive",
                      alarm.type === "WARNING" && "border-warning",
                      alarm.type === "INFO" && "border-primary"
                    )}>
                      {alarm.type}
                    </span>
                  </div>
                  <span className="flex-1 font-bold">{alarm.message}</span>
                  <span className="text-[10px] px-2 border rounded opacity-70">
                    {alarm.active ? 'ACTIVE' : 'CLEARED'}
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
