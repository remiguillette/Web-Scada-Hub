import { useCallback, useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { Power, ShieldAlert, Zap } from "lucide-react";
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

function HWire({ powered, className }: { powered: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "h-1.5 transition-all duration-300 rounded-full shrink-0",
        powered ? "bg-[#00f7a1] shadow-[0_0_12px_rgba(0,247,161,0.85)]" : "bg-[#1e293b]",
        className,
      )}
    />
  );
}

function VWire({ powered, className, style }: { powered: boolean; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn(
        "w-1.5 transition-all duration-300 rounded-full shrink-0",
        powered ? "bg-[#00f7a1] shadow-[0_0_12px_rgba(0,247,161,0.85)]" : "bg-[#1e293b]",
        className,
      )}
      style={style}
    />
  );
}

function CompactCard({
  tag,
  title,
  status,
  active,
  accent,
  icon,
  onClick,
}: {
  tag: string;
  title: string;
  status: string;
  active: boolean;
  accent: "green" | "cyan" | "red" | "amber";
  icon: ReactNode;
  onClick?: () => void;
}) {
  const accentMap = {
    green: active
      ? "border-[#00f7a1] text-[#00f7a1] bg-[#0e1a10] shadow-[0_0_14px_rgba(0,247,161,0.18)]"
      : "border-[#333333] text-[#5a6a5a] bg-[#1a1a1a]",
    cyan: active
      ? "border-[#00dcff] text-[#b8f3ff] bg-[#0d1a1e] shadow-[0_0_14px_rgba(0,220,255,0.16)]"
      : "border-[#333333] text-[#5a6a5a] bg-[#1a1a1a]",
    red: active
      ? "border-[#ff4d5a] text-[#ffd8dc] bg-[#22070d] shadow-[0_0_14px_rgba(255,77,90,0.2)]"
      : "border-[#333333] text-[#5a6a5a] bg-[#1a1a1a]",
    amber: active
      ? "border-[#ffb347] text-[#ffe2af] bg-[#1e1206] shadow-[0_0_14px_rgba(255,179,71,0.18)]"
      : "border-[#333333] text-[#5a6a5a] bg-[#1a1a1a]",
  };

  const body = (
    <div
      className={cn(
        "rounded-xl border px-2.5 py-2 transition-all duration-300 w-[130px] shrink-0",
        accentMap[accent],
      )}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className="min-w-0">
          <div className="font-mono text-[8px] tracking-[0.22em] text-[#70839f] truncate">{tag}</div>
          <div className="font-display text-[10px] font-semibold uppercase tracking-[0.07em] leading-tight truncate">{title}</div>
        </div>
        <div className="shrink-0 mt-0.5">{icon}</div>
      </div>
      <div className="font-mono text-[8px] tracking-[0.12em] leading-tight truncate">{status}</div>
    </div>
  );

  if (!onClick) return body;
  return (
    <button type="button" onClick={onClick} className="text-left transition-transform hover:scale-[1.02] active:scale-[0.98]">
      {body}
    </button>
  );
}

const CONDUCTORS = [
  { label: "L1 / BLUE", color: "#3b82f6", glow: "rgba(59,130,246,0.55)" },
  { label: "L2 / RED",  color: "#ef4444", glow: "rgba(239,68,68,0.50)" },
  { label: "N / WHITE", color: "#d4d4d4", glow: "rgba(210,210,210,0.35)" },
  { label: "GND / GRN", color: "#22c55e", glow: "rgba(34,197,94,0.45)" },
];

const SCROLL_STEP = 120;
const SOURCE_COLUMN_WIDTH = 142;
const SOURCE_BUS_WIDTH = 34;

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

  const supplyLive    = voltage > 0;
  const meterLive     = supplyLive;
  const mainPanelLive = disconnectClosed && !breakerTripped && supplyLive;
  const busLive       = mainPanelLive;
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const scrollByAmount = useCallback((left: number, top = 0) => {
    viewportRef.current?.scrollBy({
      left,
      top,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

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
      <div className="min-w-max">

        {/* ─── UTILITY CONDUCTORS ─── */}
        <div className="mb-4 flex items-center gap-0" style={{ paddingLeft: SOURCE_COLUMN_WIDTH }}>
          <span className="shrink-0 font-mono text-[9px] tracking-[0.28em] text-[#6b7a6b] mr-3">
            UTILITY CONDUCTORS
          </span>
          <div className="flex flex-col gap-[5px]">
            {CONDUCTORS.map((c) => (
              <div key={c.label} className="flex items-center gap-2">
                <span
                  className="w-16 shrink-0 text-right font-mono text-[7.5px] tracking-[0.14em]"
                  style={{ color: c.color }}
                >
                  {c.label}
                </span>
                <div
                  className="h-[5px] rounded-full"
                  style={{
                    minWidth: 600,
                    backgroundColor: c.color,
                    boxShadow: `0 0 7px ${c.glow}`,
                  }}
                />
              </div>
            ))}
            <div className="mt-1 ml-[72px] rounded-full border border-[#1f3b4d] bg-[#08131a] px-3 py-0.5 w-fit font-mono text-[7px] tracking-[0.16em] text-[#8ecae6]">
              SIM: L1-N = 120V | L2-N = 120V | L1-L2 = 240V
            </div>
          </div>
        </div>

        {/* ─── MAIN HORIZONTAL FLOW ─── */}
        <div className="flex items-center gap-0">

          {/* ── Sources column (Hydro One top, Generator bottom) ── */}
          <div className="flex flex-col shrink-0 items-start" style={{ width: 142 }}>
            {/* Hydro One */}
            <CompactCard
              tag="UTILITY"
              title="HYDRO ONE"
              status={supplyLive ? "ENERGIZED" : "UNAVAILABLE"}
              active={supplyLive}
              accent="cyan"
              icon={<Zap className={cn("h-4 w-4", supplyLive ? "text-[#00dcff]" : "text-[#475569]")} />}
            />

            {/* Vertical wire between sources — fixed short height */}
            <div className="flex justify-center" style={{ width: 130 }}>
              <VWire powered={supplyLive} style={{ height: 10 }} />
            </div>

            {/* Generator */}
            <CompactCard
              tag="GEN-001"
              title="GENERATOR"
              status="STANDBY / OFFLINE"
              active={false}
              accent="amber"
              icon={<Zap className="h-4 w-4 text-[#475569]" />}
            />
          </div>

          {/* Vertical junction bus + horizontal stub out */}
          <div className="flex items-center shrink-0" style={{ width: 28 }}>
            <VWire powered={supplyLive} style={{ height: 138 }} />
          </div>
          <HWire powered={supplyLive} className="w-6" />

          {/* ── Upstream equipment chain ── */}
          <div className="flex items-center gap-0">

            <CompactCard
              tag="POLE-001"
              title="RISER POLE"
              status={supplyLive ? "4.8 KV" : "DEAD"}
              active={supplyLive}
              accent="cyan"
              icon={<Power className={cn("h-4 w-4", supplyLive ? "text-[#00dcff]" : "text-[#475569]")} />}
            />
            <HWire powered={supplyLive} className="w-4" />

            <CompactCard
              tag="CB-UTIL"
              title="POLE BREAKER"
              status={supplyLive ? "CLOSED" : "OPEN"}
              active={supplyLive}
              accent={supplyLive ? "green" : "amber"}
              icon={<ShieldAlert className={cn("h-4 w-4", supplyLive ? "text-[#00f7a1]" : "text-[#ffb347]")} />}
            />
            <HWire powered={supplyLive} className="w-4" />

            <CompactCard
              tag="UG-PRI"
              title="UG TRANSITION"
              status={supplyLive ? "ACTIVE" : "DEAD"}
              active={supplyLive}
              accent="cyan"
              icon={<Zap className={cn("h-4 w-4", supplyLive ? "text-[#00dcff]" : "text-[#475569]")} />}
            />
            <HWire powered={supplyLive} className="w-4" />

            <CompactCard
              tag="LAT-001"
              title="SVC LATERAL"
              status={supplyLive ? "4.8 KV IN CONDUIT" : "DEAD"}
              active={supplyLive}
              accent="cyan"
              icon={<Zap className={cn("h-4 w-4", supplyLive ? "text-[#00dcff]" : "text-[#475569]")} />}
            />
            <HWire powered={supplyLive} className="w-4" />

            <CompactCard
              tag="XFMR-001"
              title="PAD-MOUNT XFMR"
              status={supplyLive ? "4.8K→240V" : "NO FEED"}
              active={supplyLive}
              accent="cyan"
              icon={<Zap className={cn("h-4 w-4", supplyLive ? "text-[#00dcff]" : "text-[#475569]")} />}
            />
            <HWire powered={meterLive} className="w-4" />

            <CompactCard
              tag="MTR-UTIL"
              title="METER BASE"
              status={meterLive ? `${voltage.toFixed(1)} VAC` : "0.0 VAC"}
              active={meterLive}
              accent="cyan"
              icon={<Zap className={cn("h-4 w-4", meterLive ? "text-[#00dcff]" : "text-[#475569]")} />}
            />
            <HWire powered={meterLive} className="w-4" />

            <CompactCard
              tag="PNL-001"
              title="MAIN PANEL"
              status={mainPanelLive ? "ENERGIZED" : "OFFLINE"}
              active={mainPanelLive}
              accent={mainPanelLive ? "green" : "amber"}
              icon={<Power className={cn("h-4 w-4", mainPanelLive ? "text-[#00f7a1]" : "text-[#ffb347]")} />}
            />
            <HWire powered={supplyLive} className="w-4" />

            <CompactCard
              tag="MDS-001"
              title="MAIN DISCONNECT"
              status={disconnectClosed ? "CLOSED" : "OPEN"}
              active={disconnectClosed && supplyLive}
              accent={disconnectClosed ? "green" : "amber"}
              icon={<Power className={cn("h-4 w-4", disconnectClosed ? "text-[#00f7a1]" : "text-[#ffb347]")} />}
              onClick={onToggleDisconnect}
            />
            <HWire powered={disconnectClosed && supplyLive} className="w-4" />

            <CompactCard
              tag="CB-001"
              title="CIRCUIT BREAKER"
              status={breakerTripped ? "TRIPPED" : "OK"}
              active={!breakerTripped && disconnectClosed && supplyLive}
              accent={breakerTripped ? "red" : "green"}
              icon={<ShieldAlert className={cn("h-4 w-4", breakerTripped ? "text-[#ff4d5a]" : "text-[#00f7a1]")} />}
              onClick={onToggleBreaker}
            />
            <HWire powered={busLive} className="w-4" />

            {/* ── Power Bus junction ── */}
            <div className="flex flex-col items-center shrink-0">
              <VWire powered={busLive} className="h-10" />
              <div className={cn("font-mono text-[8px] tracking-[0.22em] px-2", busLive ? "text-[#00dcff]" : "text-[#475569]")}>
                BUS
              </div>
              <VWire powered={busLive} className="h-10" />
            </div>

            {/* ── Load branches ── */}
            <div className="flex flex-col items-stretch gap-0 self-stretch justify-center ml-0">
              {/* Top load: Feeder Contactor + Motor */}
              <div className="flex items-center gap-0">
                <HWire powered={busLive} className="w-4" />
                <CompactCard
                  tag="CTR-001"
                  title="FEEDER CTR"
                  status={feederContactor ? "ENERGIZED" : "DE-ENERGIZED"}
                  active={feederContactor}
                  accent={feederContactor ? "green" : "cyan"}
                  icon={<Zap className={cn("h-4 w-4", feederContactor ? "text-[#00f7a1]" : "text-[#00dcff]")} />}
                />
                <HWire powered={motorPowered} className="w-4" />
                <CompactCard
                  tag="MTR-001"
                  title="DISPENSER MTR"
                  status={motorPowered ? `${current.toFixed(2)} A` : "STOPPED"}
                  active={motorPowered}
                  accent={motorPowered ? "green" : "cyan"}
                  icon={
                    <div className={cn("font-display text-base font-bold leading-none", motorPowered ? "text-[#00f7a1]" : "text-[#64748b]")}>M</div>
                  }
                />
              </div>

              {/* Gap between load branches */}
              <div className="h-3" />

              {/* Bottom load: Solenoid Contactor + Hopper Gate */}
              <div className="flex items-center gap-0">
                <HWire powered={busLive} className="w-4" />
                <CompactCard
                  tag="CTR-002"
                  title="SOL CONTACTOR"
                  status={solenoidContactor ? "ENERGIZED" : "DE-ENERGIZED"}
                  active={solenoidContactor}
                  accent={solenoidContactor ? "green" : "cyan"}
                  icon={<Zap className={cn("h-4 w-4", solenoidContactor ? "text-[#00f7a1]" : "text-[#00dcff]")} />}
                />
                <HWire powered={gateOpen} className="w-4" />
                <CompactCard
                  tag="SOL-001"
                  title="HOPPER GATE"
                  status={gateOpen ? "OPEN" : "CLOSED"}
                  active={gateOpen}
                  accent={gateOpen ? "green" : "cyan"}
                  icon={
                    <div className={cn("font-display text-base leading-none", gateOpen ? "text-[#00f7a1]" : "text-[#64748b]")}>◫</div>
                  }
                />
              </div>
            </div>

          </div>
          {/* end equipment chain */}

        </div>
        {/* end main horizontal flow */}

      </div>
    </div>
  );
}
