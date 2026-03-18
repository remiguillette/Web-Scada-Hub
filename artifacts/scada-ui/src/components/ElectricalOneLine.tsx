import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Activity, ArrowRightLeft, Gauge, Power, ShieldAlert, Siren, TowerControl, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ElectricalOneLineProps {
  disconnectClosed: boolean;
  breakerTripped: boolean;
  feederContactor: boolean;
  solenoidContactor: boolean;
  motorPowered: boolean;
  gateOpen: boolean;
  voltage: number;
  current: number;
  onToggleDisconnect: () => void;
  onToggleBreaker: () => void;
}

type WireTone = "active" | "emergency" | "alarm" | "idle";

type AccentTone = "green" | "cyan" | "amber" | "red";

const SCROLL_STEP = 140;

function getWireClasses(tone: WireTone) {
  switch (tone) {
    case "active":
      return "bg-[#00f7a1] shadow-[0_0_12px_rgba(0,247,161,0.82)]";
    case "emergency":
      return "bg-[#ff9f1a] shadow-[0_0_14px_rgba(255,159,26,0.85)]";
    case "alarm":
      return "bg-[#ff4d5a] shadow-[0_0_14px_rgba(255,77,90,0.82)]";
    default:
      return "bg-[#1e293b]";
  }
}

function HWire({ tone, className }: { tone: WireTone; className?: string }) {
  return <div className={cn("h-1.5 rounded-full shrink-0 transition-all duration-300", getWireClasses(tone), className)} />;
}

function VWire({ tone, className, style }: { tone: WireTone; className?: string; style?: CSSProperties }) {
  return <div className={cn("w-1.5 rounded-full shrink-0 transition-all duration-300", getWireClasses(tone), className)} style={style} />;
}

function NodeCard({
  tag,
  title,
  status,
  accent,
  icon,
  onClick,
  className,
}: {
  tag: string;
  title: string;
  status: string;
  accent: AccentTone;
  icon: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const accentMap: Record<AccentTone, string> = {
    green: "border-[#00f7a1] bg-[#0e1a10] text-[#d9ffe8] shadow-[0_0_16px_rgba(0,247,161,0.16)]",
    cyan: "border-[#00dcff] bg-[#09171d] text-[#d7f7ff] shadow-[0_0_16px_rgba(0,220,255,0.16)]",
    amber: "border-[#ffb347] bg-[#1a1207] text-[#ffe8c2] shadow-[0_0_16px_rgba(255,179,71,0.16)]",
    red: "border-[#ff4d5a] bg-[#22070d] text-[#ffe0e3] shadow-[0_0_16px_rgba(255,77,90,0.18)]",
  };

  const content = (
    <div className={cn("w-[142px] rounded-xl border px-3 py-2.5 transition-all duration-300", accentMap[accent], className)}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[8px] tracking-[0.24em] text-[#6f8596]">{tag}</div>
          <div className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] leading-tight">{title}</div>
        </div>
        <div className="mt-0.5 shrink-0">{icon}</div>
      </div>
      <div className="font-mono text-[8px] tracking-[0.12em] leading-tight">{status}</div>
    </div>
  );

  if (!onClick) return content;
  return (
    <button type="button" onClick={onClick} className="text-left transition-transform hover:scale-[1.02] active:scale-[0.98]">
      {content}
    </button>
  );
}

function StatusPill({ label, value, tone }: { label: string; value: string; tone: AccentTone }) {
  const toneClasses: Record<AccentTone, string> = {
    green: "border-[#174d32] bg-[#0f1b14] text-[#a8f5c3]",
    cyan: "border-[#194352] bg-[#0c161b] text-[#9de7ff]",
    amber: "border-[#5a3b12] bg-[#191208] text-[#ffd08a]",
    red: "border-[#5a1820] bg-[#19090c] text-[#ffb1b8]",
  };

  return (
    <div className={cn("rounded-lg border px-3 py-2", toneClasses[tone])}>
      <div className="font-mono text-[8px] tracking-[0.22em] text-[#7d8c9f]">{label}</div>
      <div className="mt-1 font-display text-[11px] font-semibold uppercase tracking-[0.06em]">{value}</div>
    </div>
  );
}

export function ElectricalOneLine(props: ElectricalOneLineProps) {
  const {
    disconnectClosed,
    breakerTripped,
    feederContactor,
    solenoidContactor,
    motorPowered,
    gateOpen,
    voltage,
    current,
    onToggleDisconnect,
    onToggleBreaker,
  } = props;

  const utilityAvailable = voltage > 0;
  const utilityWireTone: WireTone = breakerTripped ? "alarm" : utilityAvailable ? "active" : "idle";
  const generatorRunning = !utilityAvailable;
  const generatorHealthy = generatorRunning && !breakerTripped;
  const generatorWireTone: WireTone = breakerTripped ? "alarm" : generatorHealthy ? "emergency" : "idle";
  const atsPosition = utilityAvailable ? "NORMAL" : generatorHealthy ? "EMERGENCY" : "TRANSITION";
  const transferSequence = !utilityAvailable;
  const mainPanelLive = disconnectClosed && !breakerTripped && (utilityAvailable || generatorHealthy);
  const mainPanelGeneratorLive = disconnectClosed && !breakerTripped && generatorHealthy;
  const scadaHealthy = true;
  const scadaSignalTone: WireTone = breakerTripped ? "alarm" : transferSequence ? "emergency" : "active";
  const mainBusTone: WireTone = breakerTripped ? "alarm" : utilityAvailable ? "active" : mainPanelLive ? "emergency" : "idle";
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const meterStatus = utilityAvailable ? `${voltage.toFixed(1)} VAC` : "SOURCE LOST";
  const generatorStatus = breakerTripped
    ? "FAULT / LOCKOUT"
    : generatorRunning
      ? "RUNNING / STABLE"
      : "STANDBY / READY";

  const metrics = useMemo(
    () => [
      { label: "UTILITY POWER", value: utilityAvailable ? "AVAILABLE" : "LOST", tone: utilityAvailable ? "cyan" : "red" },
      { label: "GENERATOR", value: generatorRunning ? (breakerTripped ? "FAULT" : "RUNNING") : "STANDBY", tone: breakerTripped ? "red" : generatorRunning ? "amber" : "cyan" },
      { label: "ATS POSITION", value: atsPosition, tone: atsPosition === "NORMAL" ? "green" : atsPosition === "EMERGENCY" ? "amber" : "red" },
      { label: "MAIN PANEL", value: mainPanelLive ? "ENERGIZED" : "DE-ENERGIZED", tone: mainPanelLive ? "green" : "red" },
      { label: "ALARMS", value: breakerTripped ? "SOURCE / BREAKER ALARM" : "NORMAL", tone: breakerTripped ? "red" : "green" },
      { label: "ELEC DATA", value: `${voltage.toFixed(1)}V / ${current.toFixed(2)}A / 60.0Hz`, tone: mainPanelLive ? "cyan" : "amber" },
    ],
    [atsPosition, breakerTripped, current, generatorRunning, mainPanelLive, utilityAvailable, voltage],
  );

  const animationSteps = useMemo(
    () => [
      {
        title: "Normal Operation",
        detail: "Utility path glows green from Utility → Meter → ATS → Main Panel while the generator branch remains in standby.",
      },
      {
        title: "Power Loss",
        detail: "On loss of utility, the utility path drops dark/red, ATS enters orange transition, and SCADA raises a source-loss alarm.",
      },
      {
        title: "Generator Startup",
        detail: "After a short delay, the generator path animates orange as the generator starts, stabilizes, and closes through the Main Panel Generator breaker.",
      },
      {
        title: "Emergency Supply",
        detail: "ATS transfers to emergency, the Main Panel is fed from the generator branch, and SCADA reports Generator Running and ATS Emergency.",
      },
      {
        title: "Return to Normal",
        detail: "When utility returns, ATS waits through a re-transfer delay, shifts back to normal, then the generator performs cooldown and shutdown.",
      },
    ],
    [],
  );

  const scrollByAmount = useCallback((left: number, top = 0) => {
    viewportRef.current?.scrollBy({ left, top, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handlePointerUp = () => {
      dragState.current = null;
      setIsDragging(false);
    };

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  return (
    <div
      ref={viewportRef}
      tabIndex={0}
      className={cn(
        "w-full overflow-auto pb-2 select-none outline-none",
        "cursor-grab active:cursor-grabbing",
        isDragging && "cursor-grabbing",
      )}
      onPointerDown={(event) => {
        if (event.button !== 0 || !viewportRef.current) return;
        dragState.current = {
          startX: event.clientX,
          startY: event.clientY,
          scrollLeft: viewportRef.current.scrollLeft,
          scrollTop: viewportRef.current.scrollTop,
        };
        setIsDragging(true);
      }}
      onPointerMove={(event) => {
        const viewport = viewportRef.current;
        const drag = dragState.current;
        if (!viewport || !drag) return;
        viewport.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX);
        viewport.scrollTop = drag.scrollTop - (event.clientY - drag.startY);
      }}
      onPointerLeave={() => {
        dragState.current = null;
        setIsDragging(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollByAmount(-SCROLL_STEP);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollByAmount(SCROLL_STEP);
        }
      }}
      aria-label="Electrical one-line diagram viewport"
    >
      <div className="min-w-[1720px] space-y-6 rounded-2xl border border-[#202020] bg-[#090909] p-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="font-mono text-[10px] tracking-[0.32em] text-[#6a7a8f]">BUILDING MAIN POWER SYSTEM</div>
            <div className="mt-1 font-display text-sm font-semibold uppercase tracking-[0.12em] text-[#dce7f5]">
              Utility / Hydro → Meter → ATS → Main Panel with Generator Backup and SCADA Monitoring
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatusPill label="LINE COLOR" value="GREEN = NORMAL FLOW" tone="green" />
            <StatusPill label="LINE COLOR" value="ORANGE = TRANSFER / EMERGENCY" tone="amber" />
            <StatusPill label="LINE COLOR" value="RED = ALARM / SOURCE LOSS" tone="red" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#1e293b] bg-[#060b10] p-5">
          <div className="flex items-start gap-8">
            <div className="flex flex-col items-center gap-4 pt-2">
              <NodeCard
                tag="UTIL-001"
                title="UTILITY / HYDRO"
                status={utilityAvailable ? "AVAILABLE / ENERGIZED" : "SOURCE LOST"}
                accent={utilityAvailable ? "cyan" : "red"}
                icon={<TowerControl className={cn("h-4 w-4", utilityAvailable ? "text-[#00dcff]" : "text-[#ff4d5a]")} />}
              />
              <NodeCard
                tag="GEN-001"
                title="GENERATOR"
                status={generatorStatus}
                accent={breakerTripped ? "red" : generatorRunning ? "amber" : "cyan"}
                icon={<Zap className={cn("h-4 w-4", generatorRunning ? "text-[#ffb347]" : "text-[#64748b]")} />}
              />
            </div>

            <div className="flex flex-col items-center pt-8">
              <VWire tone={utilityWireTone} style={{ height: 64 }} />
              <VWire tone={generatorWireTone} style={{ height: 64 }} />
            </div>

            <div className="flex flex-col gap-10 pt-2">
              <div className="flex items-center gap-0">
                <HWire tone={utilityWireTone} className="w-8" />
                <NodeCard
                  tag="MTR-UTIL"
                  title="METER"
                  status={meterStatus}
                  accent={utilityAvailable ? "cyan" : "red"}
                  icon={<Gauge className={cn("h-4 w-4", utilityAvailable ? "text-[#00dcff]" : "text-[#ff4d5a]")} />}
                />
                <HWire tone={utilityWireTone} className="w-10" />
                <NodeCard
                  tag="ATS-001"
                  title="AUTOMATIC TRANSFER SWITCH"
                  status={utilityAvailable ? "NORMAL SOURCE SELECTED" : generatorHealthy ? "EMERGENCY SOURCE SELECTED" : "IN TRANSITION"}
                  accent={utilityAvailable ? "green" : generatorHealthy ? "amber" : "red"}
                  icon={<ArrowRightLeft className={cn("h-4 w-4", utilityAvailable ? "text-[#00f7a1]" : generatorHealthy ? "text-[#ffb347]" : "text-[#ff4d5a]")} />}
                />
                <HWire tone={mainBusTone} className="w-10" />
                <NodeCard
                  tag="PNL-001"
                  title="MAIN PANEL"
                  status={mainPanelLive ? "ENERGIZED" : "DE-ENERGIZED"}
                  accent={mainPanelLive ? "green" : "red"}
                  icon={<Power className={cn("h-4 w-4", mainPanelLive ? "text-[#00f7a1]" : "text-[#ff4d5a]")} />}
                />
              </div>

              <div className="ml-[170px] flex items-start gap-0">
                <div className="flex w-[152px] flex-col items-center">
                  <VWire tone={generatorWireTone} style={{ height: 26 }} />
                  <HWire tone={generatorWireTone} className="w-20" />
                </div>
                <NodeCard
                  tag="GBR-001"
                  title="MAIN PANEL GENERATOR"
                  status={mainPanelGeneratorLive ? "BREAKER CLOSED" : generatorRunning ? "READY TO CLOSE" : "OPEN / STANDBY"}
                  accent={mainPanelGeneratorLive ? "amber" : generatorRunning ? "cyan" : "cyan"}
                  icon={<ShieldAlert className={cn("h-4 w-4", mainPanelGeneratorLive ? "text-[#ffb347]" : "text-[#00dcff]")} />}
                />
                <HWire tone={generatorWireTone} className="w-10" />
                <div className="flex flex-col items-center">
                  <VWire tone={generatorWireTone} style={{ height: 26 }} />
                  <div className="font-mono text-[8px] tracking-[0.24em] text-[#7b8ba0]">L-SHAPED GENERATOR TIE</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center pt-2">
              <NodeCard
                tag="SCADA-01"
                title="SCADA MONITORING"
                status={scadaHealthy ? "STATUS / ALARMS / ANALOGS ONLINE" : "COMMUNICATION LOST"}
                accent={scadaHealthy ? "cyan" : "red"}
                icon={<Activity className={cn("h-4 w-4", scadaHealthy ? "text-[#00dcff]" : "text-[#ff4d5a]")} />}
                className="w-[186px]"
              />
              <div className="mt-4 flex items-center gap-3">
                <VWire tone={scadaSignalTone} style={{ height: 50 }} />
                <div className="font-mono text-[8px] tracking-[0.24em] text-[#7b8ba0]">STATUS SIGNALS</div>
              </div>
              <div className="mt-1 grid grid-cols-1 gap-2">
                {["METER", "ATS", "GENERATOR", "MAIN PANEL", "MAIN PANEL GENERATOR"].map((point) => (
                  <div key={point} className="flex items-center gap-2">
                    <HWire tone={scadaSignalTone} className="w-8" />
                    <div className="rounded-lg border border-[#203041] bg-[#0b1116] px-3 py-1 font-mono text-[8px] tracking-[0.2em] text-[#9ec9db]">
                      {point}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <HWire tone={mainBusTone} className="w-[762px]" />
            <NodeCard
              tag="MDS-001"
              title="MAIN DISCONNECT"
              status={disconnectClosed ? "CLOSED" : "OPEN"}
              accent={disconnectClosed ? "green" : "amber"}
              icon={<Power className={cn("h-4 w-4", disconnectClosed ? "text-[#00f7a1]" : "text-[#ffb347]")} />}
              onClick={onToggleDisconnect}
            />
            <HWire tone={disconnectClosed ? mainBusTone : "idle"} className="w-4" />
            <NodeCard
              tag="CB-001"
              title="MAIN BREAKER"
              status={breakerTripped ? "TRIPPED" : "HEALTHY"}
              accent={breakerTripped ? "red" : "green"}
              icon={<ShieldAlert className={cn("h-4 w-4", breakerTripped ? "text-[#ff4d5a]" : "text-[#00f7a1]")} />}
              onClick={onToggleBreaker}
            />
            <HWire tone={disconnectClosed && !breakerTripped ? mainBusTone : breakerTripped ? "alarm" : "idle"} className="w-6" />
            <NodeCard
              tag="LDS-001"
              title="CRITICAL LOADS"
              status={motorPowered || gateOpen ? "PROCESS LOADS ACTIVE" : "READY / MONITORED"}
              accent={motorPowered || gateOpen ? "green" : "cyan"}
              icon={<Zap className={cn("h-4 w-4", motorPowered || gateOpen ? "text-[#00f7a1]" : "text-[#00dcff]")} />}
            />
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4">
          <div className="rounded-2xl border border-[#1f2937] bg-[#0a1015] p-4">
            <div className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.14em] text-[#cfe3f3]">
              SCADA Status Signals and Electrical Summary
            </div>
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((metric) => (
                <StatusPill key={metric.label} label={metric.label} value={metric.value} tone={metric.tone as AccentTone} />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatusPill label="FEEDER CONTACTOR" value={feederContactor ? "ENERGIZED" : "OPEN"} tone={feederContactor ? "green" : "cyan"} />
              <StatusPill label="SOLENOID CONTACTOR" value={solenoidContactor ? "ENERGIZED" : "OPEN"} tone={solenoidContactor ? "green" : "cyan"} />
            </div>
          </div>

          <div className="rounded-2xl border border-[#31220d] bg-[#140e07] p-4">
            <div className="mb-3 flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.14em] text-[#ffe2af]">
              <Siren className="h-4 w-4 text-[#ffb347]" />
              Web SCADA Animation Logic
            </div>
            <div className="space-y-3">
              {animationSteps.map((step, index) => (
                <div key={step.title} className="rounded-xl border border-[#4a3214] bg-[#100b06] px-3 py-2">
                  <div className="font-mono text-[8px] tracking-[0.24em] text-[#d8a861]">STEP {index + 1}</div>
                  <div className="mt-1 font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[#fff0cf]">{step.title}</div>
                  <div className="mt-1 text-[11px] leading-5 text-[#dbc8a1]">{step.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
