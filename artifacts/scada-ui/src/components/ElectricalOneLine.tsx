import { useCallback, useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { Power, ShieldAlert, Zap, Monitor } from "lucide-react";
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

function HWire({ powered, className, style }: { powered: boolean; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn(
        "h-1.5 transition-all duration-300 rounded-full shrink-0",
        powered ? "bg-[#00f7a1] shadow-[0_0_12px_rgba(0,247,161,0.85)]" : "bg-[#1e293b]",
        className,
      )}
      style={style}
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
  width,
}: {
  tag: string;
  title: string;
  status: string;
  active: boolean;
  accent: "green" | "cyan" | "red" | "amber" | "violet";
  icon: ReactNode;
  onClick?: () => void;
  width?: number;
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
    violet: active
      ? "border-[#a78bfa] text-[#ede9fe] bg-[#130d22] shadow-[0_0_14px_rgba(167,139,250,0.18)]"
      : "border-[#333333] text-[#5a6a5a] bg-[#1a1a1a]",
  };

  const cardWidth = width ?? 130;

  const body = (
    <div
      className={cn(
        "rounded-xl border px-2.5 py-2 transition-all duration-300 shrink-0",
        accentMap[accent],
      )}
      style={{ width: cardWidth }}
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
  { label: "L1", color: "#3b82f6", glow: "rgba(59,130,246,0.55)" },
  { label: "L2", color: "#ef4444", glow: "rgba(239,68,68,0.50)" },
  { label: "N",  color: "#d4d4d4", glow: "rgba(210,210,210,0.35)" },
  { label: "GND", color: "#22c55e", glow: "rgba(34,197,94,0.45)" },
];

const SCROLL_STEP = 120;

// ─── Layout constants (px) used to pixel-align the generator branch ───
// Sum of all elements widths before the ATS card in row 1:
//   source col 142 + bus 28 + hw 24 + conductors ~372 + hw 24
//   + pole 130 + hw 16 + pole-brk 130 + hw 16 + xfmr 130
//   + sec-cable ~292 + hw 16 + meter 130 + hw 16
const ATS_LEFT_X = 1466;
const CARD_W = 130;
const SOURCE_COL_W = 142;
// Center of ATS card (for VWire alignment)
const ATS_CENTER_X = ATS_LEFT_X + CARD_W / 2;

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
  const atsNormal     = meterLive;           // ATS in normal (utility) position
  const genLive       = false;               // Generator offline
  const atsPowered    = atsNormal || genLive; // ATS output powered by either source
  const genBrkLive    = genLive;             // Gen breaker energized only when gen runs
  const mainPanelLive = disconnectClosed && !breakerTripped && atsPowered;
  const busLive       = mainPanelLive;

  const viewportRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const scrollByAmount = useCallback((left: number, top = 0) => {
    viewportRef.current?.scrollBy({ left, top, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const handlePointerUp = () => { dragState.current = null; setIsDragging(false); };
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  const atsStatus = atsNormal
    ? "NORMAL / UTILITY"
    : genLive
      ? "EMERGENCY / GEN"
      : "OPEN — NO SOURCE";

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
      onPointerLeave={() => { dragState.current = null; setIsDragging(false); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") { event.preventDefault(); scrollByAmount(-SCROLL_STEP); }
        if (event.key === "ArrowRight") { event.preventDefault(); scrollByAmount(SCROLL_STEP); }
      }}
      aria-label="Electrical one-line diagram viewport"
    >
      <div className="min-w-max">

        {/* ══════════════════════════════════════════════════════════
            ROW 1 — UTILITY PATH
            Utility → Conductors → Upstream Equipment → Meter → ATS → Main Panel → … → Loads
            ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-0">

          {/* ── Source: Utility only ── */}
          <div className="flex flex-col shrink-0 items-start" style={{ width: SOURCE_COL_W }}>
            <CompactCard
              tag="UTILITY"
              title="Niagara Peninsula Energy (NPE)"
              status={supplyLive ? "ENERGIZED" : "UNAVAILABLE"}
              active={supplyLive}
              accent="cyan"
              icon={<Zap className={cn("h-4 w-4", supplyLive ? "text-[#00dcff]" : "text-[#475569]")} />}
            />
          </div>

          {/* Vertical junction bus */}
          <div className="flex items-center shrink-0" style={{ width: 28 }}>
            <VWire powered={supplyLive} style={{ height: 46 }} />
          </div>
          <HWire powered={supplyLive} className="w-6" />

          {/* ── Utility Conductors ── */}
          <div className="flex flex-col gap-[5px] shrink-0 mx-4">
            <span className="font-mono text-[9px] tracking-[0.28em] text-[#6b7a6b] mb-1">CONDUCTORS</span>
            {CONDUCTORS.map((c) => (
              <div key={c.label} className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-right font-mono text-[7.5px] tracking-[0.14em]" style={{ color: c.color }}>{c.label}</span>
                <div className="h-[5px] rounded-full" style={{ width: 300, backgroundColor: c.color, boxShadow: `0 0 7px ${c.glow}` }} />
              </div>
            ))}
            <div className="mt-1 ml-[72px] rounded-full border border-[#1f3b4d] bg-[#08131a] px-3 py-0.5 w-fit font-mono text-[7px] tracking-[0.16em] text-[#8ecae6]">
              SIM: L1-N = 120V | L2-N = 120V | L1-L2 = 240V
            </div>
          </div>

          <HWire powered={supplyLive} className="w-6" />

          {/* ── Upstream equipment chain ── */}
          <CompactCard tag="POLE-001" title="RISER POLE" status={supplyLive ? "4.8 KV" : "DEAD"} active={supplyLive} accent="cyan"
            icon={<Power className={cn("h-4 w-4", supplyLive ? "text-[#00dcff]" : "text-[#475569]")} />} />
          <HWire powered={supplyLive} className="w-4" />

          <CompactCard tag="CB-UTIL" title="POLE BREAKER" status={supplyLive ? "CLOSED" : "OPEN"} active={supplyLive}
            accent={supplyLive ? "green" : "amber"}
            icon={<ShieldAlert className={cn("h-4 w-4", supplyLive ? "text-[#00f7a1]" : "text-[#ffb347]")} />} />
          <HWire powered={supplyLive} className="w-4" />

          <CompactCard tag="XFMR-001" title="PAD-MOUNT TRANSFORMER" status={supplyLive ? "4.8K→240V" : "NO FEED"} active={supplyLive} accent="cyan"
            icon={<Zap className={cn("h-4 w-4", supplyLive ? "text-[#00dcff]" : "text-[#475569]")} />} />

          {/* Secondary service cable */}
          <div className="flex flex-col gap-[5px] shrink-0 mx-4">
            <span className="font-mono text-[9px] tracking-[0.28em] text-[#6b7a6b] mb-1">SECONDARY SERVICE CABLE</span>
            {CONDUCTORS.map((c) => (
              <div key={`secondary-${c.label}`} className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-right font-mono text-[7.5px] tracking-[0.14em]" style={{ color: c.color }}>{c.label}</span>
                <div className="h-[5px] rounded-full" style={{ width: 220, backgroundColor: c.color, boxShadow: `0 0 7px ${c.glow}` }} />
              </div>
            ))}
          </div>

          <HWire powered={meterLive} className="w-4" />

          <CompactCard tag="MTR-UTIL" title="METER" status={meterLive ? `${voltage.toFixed(1)} VAC` : "0.0 VAC"} active={meterLive} accent="cyan"
            icon={<Zap className={cn("h-4 w-4", meterLive ? "text-[#00dcff]" : "text-[#475569]")} />} />

          <HWire powered={meterLive} className="w-4" />

          {/* ── ATS (new) ── */}
          <CompactCard
            tag="ATS-001"
            title="ATS"
            status={atsStatus}
            active={atsPowered}
            accent={atsNormal ? "cyan" : genLive ? "amber" : "red"}
            icon={<ShieldAlert className={cn("h-4 w-4", atsNormal ? "text-[#00dcff]" : genLive ? "text-[#ffb347]" : "text-[#475569]")} />}
          />

          <HWire powered={atsPowered} className="w-4" />

          {/* ── Main Panel ── */}
          <CompactCard tag="PNL-001" title="MAIN PANEL" status={mainPanelLive ? "ENERGIZED" : "OFFLINE"} active={mainPanelLive}
            accent={mainPanelLive ? "green" : "amber"}
            icon={<Power className={cn("h-4 w-4", mainPanelLive ? "text-[#00f7a1]" : "text-[#ffb347]")} />} />
          <HWire powered={atsPowered} className="w-4" />

          {/* ── SCADA monitor tap ── */}
          <div className="flex flex-col items-center shrink-0">
            <VWire powered={mainPanelLive} style={{ height: 14 }} />
            <CompactCard tag="SCADA-01" title="SCADA MONITOR" status={mainPanelLive ? "MONITORING" : "OFFLINE"} active={mainPanelLive} accent="violet"
              icon={<Monitor className={cn("h-4 w-4", mainPanelLive ? "text-[#a78bfa]" : "text-[#475569]")} />} />
            <VWire powered={mainPanelLive} style={{ height: 14 }} />
          </div>

          <HWire powered={atsPowered} className="w-4" />

          <CompactCard tag="MDS-001" title="MAIN DISCONNECT" status={disconnectClosed ? "CLOSED" : "OPEN"}
            active={disconnectClosed && atsPowered} accent={disconnectClosed ? "green" : "amber"}
            icon={<Power className={cn("h-4 w-4", disconnectClosed ? "text-[#00f7a1]" : "text-[#ffb347]")} />}
            onClick={onToggleDisconnect} />
          <HWire powered={disconnectClosed && atsPowered} className="w-4" />

          <CompactCard tag="CB-001" title="CIRCUIT BREAKER" status={breakerTripped ? "TRIPPED" : "OK"}
            active={!breakerTripped && disconnectClosed && atsPowered} accent={breakerTripped ? "red" : "green"}
            icon={<ShieldAlert className={cn("h-4 w-4", breakerTripped ? "text-[#ff4d5a]" : "text-[#00f7a1]")} />}
            onClick={onToggleBreaker} />
          <HWire powered={busLive} className="w-4" />

          {/* ── Power Bus junction ── */}
          <div className="flex flex-col items-center shrink-0">
            <VWire powered={busLive} className="h-10" />
            <div className={cn("font-mono text-[8px] tracking-[0.22em] px-2", busLive ? "text-[#00dcff]" : "text-[#475569]")}>BUS</div>
            <VWire powered={busLive} className="h-10" />
          </div>

          {/* ── Load branches ── */}
          <div className="flex flex-col items-stretch gap-0 self-stretch justify-center ml-0">
            {/* Top load: Feeder Contactor + Motor */}
            <div className="flex items-center gap-0">
              <HWire powered={busLive} className="w-4" />
              <CompactCard tag="CTR-001" title="FEEDER CTR" status={feederContactor ? "ENERGIZED" : "DE-ENERGIZED"}
                active={feederContactor} accent={feederContactor ? "green" : "cyan"}
                icon={<Zap className={cn("h-4 w-4", feederContactor ? "text-[#00f7a1]" : "text-[#00dcff]")} />} />
              <HWire powered={motorPowered} className="w-4" />
              <CompactCard tag="MTR-001" title="DISPENSER MTR" status={motorPowered ? `${current.toFixed(2)} A` : "STOPPED"}
                active={motorPowered} accent={motorPowered ? "green" : "cyan"}
                icon={<div className={cn("font-display text-base font-bold leading-none", motorPowered ? "text-[#00f7a1]" : "text-[#64748b]")}>M</div>} />
            </div>

            <div className="h-3" />

            {/* Bottom load: Solenoid Contactor + Hopper Gate */}
            <div className="flex items-center gap-0">
              <HWire powered={busLive} className="w-4" />
              <CompactCard tag="CTR-002" title="SOL CONTACTOR" status={solenoidContactor ? "ENERGIZED" : "DE-ENERGIZED"}
                active={solenoidContactor} accent={solenoidContactor ? "green" : "cyan"}
                icon={<Zap className={cn("h-4 w-4", solenoidContactor ? "text-[#00f7a1]" : "text-[#00dcff]")} />} />
              <HWire powered={gateOpen} className="w-4" />
              <CompactCard tag="SOL-001" title="HOPPER GATE" status={gateOpen ? "OPEN" : "CLOSED"}
                active={gateOpen} accent={gateOpen ? "green" : "cyan"}
                icon={<div className={cn("font-display text-base leading-none", gateOpen ? "text-[#00f7a1]" : "text-[#64748b]")}>◫</div>} />
            </div>
          </div>

        </div>
        {/* end ROW 1 */}

        {/* ══════════════════════════════════════════════════════════
            CONNECTOR — L-shape vertical segment from ATS down to Gen Breaker
            Spacer pushes the VWire to align with the center of ATS-001
            ══════════════════════════════════════════════════════════ */}
        <div className="flex items-start" style={{ height: 28 }}>
          {/* Spacer: from left edge to center of ATS card */}
          <div style={{ width: ATS_CENTER_X - 3, flexShrink: 0 }} />
          <VWire powered={genBrkLive} style={{ height: 28 }} />
        </div>

        {/* ══════════════════════════════════════════════════════════
            ROW 2 — GENERATOR PATH (emergency branch)
            Generator → Gen Breaker (aligned below ATS)
            ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-0">

          {/* ── Generator source ── */}
          <div className="flex flex-col shrink-0 items-start" style={{ width: SOURCE_COL_W }}>
            <CompactCard
              tag="GEN-001"
              title="GENERATOR"
              status="STANDBY / OFFLINE"
              active={false}
              accent="amber"
              icon={<Zap className="h-4 w-4 text-[#475569]" />}
            />
          </div>

          {/* Long H-wire from Generator rightward to Gen Breaker (below ATS) */}
          {/* Width = ATS_LEFT_X - SOURCE_COL_W = 1466 - 142 = 1324 */}
          <HWire powered={genBrkLive} style={{ width: ATS_LEFT_X - SOURCE_COL_W }} />

          {/* ── Main Panel Generator / Generator Breaker ── */}
          <CompactCard
            tag="CB-GEN"
            title="MAIN PANEL GEN"
            status={genBrkLive ? "CLOSED" : "OPEN / STANDBY"}
            active={genBrkLive}
            accent={genBrkLive ? "amber" : "amber"}
            icon={<ShieldAlert className={cn("h-4 w-4", genBrkLive ? "text-[#ffb347]" : "text-[#475569]")} />}
          />

        </div>
        {/* end ROW 2 */}

      </div>
    </div>
  );
}
