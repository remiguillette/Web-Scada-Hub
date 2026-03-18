import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Monitor, Power, ShieldAlert, Zap } from "lucide-react";
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

type Accent = "green" | "cyan" | "red" | "amber" | "violet";

type WireProps = {
  powered: boolean;
  className?: string;
  style?: CSSProperties;
};

type DetailRow = {
  parameter: string;
  value: string;
  description: string;
};

type CompactCardProps = {
  tag: string;
  title: string;
  subtitle?: string;
  status: string;
  active: boolean;
  accent: Accent;
  icon: ReactNode;
  onClick?: () => void;
  width?: number;
  details?: DetailRow[];
};

type BaseNode = CompactCardProps & {
  kind: "source" | "equipment" | "ats";
};

type SourceNode = BaseNode & {
  kind: "source";
};

type EquipmentNode = BaseNode & {
  kind: "equipment";
};

type ATSNode = BaseNode & {
  kind: "ats";
  mode: "utility" | "generator" | "offline";
};

type BusNode = {
  kind: "bus";
  label: string;
  active: boolean;
};

type LoadBranch = {
  kind: "loadBranch";
  control: EquipmentNode;
  load: EquipmentNode;
  loadPowered: boolean;
};

type GeneratorUnit = {
  tag: string;
  title: string;
  status: string;
  active: boolean;
};

type DragState = {
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
};

const CARD_W = 130;
const SOURCE_COL_W = 142;
const SCROLL_STEP = 120;

const CONDUCTORS = [
  { label: "L1", color: "#3b82f6", glow: "rgba(59,130,246,0.55)" },
  { label: "L2", color: "#ef4444", glow: "rgba(239,68,68,0.50)" },
  { label: "N", color: "#d4d4d4", glow: "rgba(210,210,210,0.35)" },
  { label: "GND", color: "#22c55e", glow: "rgba(34,197,94,0.45)" },
] as const;

const BASE_WIRE_CLASSES = "transition-all duration-300 rounded-full shrink-0";

const getWireClasses = (powered: boolean) =>
  cn(
    powered
      ? "bg-[#00f7a1] shadow-[0_0_12px_rgba(0,247,161,0.85)]"
      : "bg-[#1e293b]",
  );

const ACCENT_STYLES: Record<Accent, { active: string; inactive: string }> = {
  green: {
    active:
      "border-[#00f7a1] text-[#00f7a1] bg-[#0e1a10] shadow-[0_0_14px_rgba(0,247,161,0.18)]",
    inactive: "border-[#333333] text-[#5a6a5a] bg-[#1a1a1a]",
  },
  cyan: {
    active:
      "border-[#00dcff] text-[#b8f3ff] bg-[#0d1a1e] shadow-[0_0_14px_rgba(0,220,255,0.16)]",
    inactive: "border-[#333333] text-[#5a6a5a] bg-[#1a1a1a]",
  },
  red: {
    active:
      "border-[#ff4d5a] text-[#ffd8dc] bg-[#22070d] shadow-[0_0_14px_rgba(255,77,90,0.2)]",
    inactive: "border-[#333333] text-[#5a6a5a] bg-[#1a1a1a]",
  },
  amber: {
    active:
      "border-[#ffb347] text-[#ffe2af] bg-[#1e1206] shadow-[0_0_14px_rgba(255,179,71,0.18)]",
    inactive: "border-[#333333] text-[#5a6a5a] bg-[#1a1a1a]",
  },
  violet: {
    active:
      "border-[#a78bfa] text-[#ede9fe] bg-[#130d22] shadow-[0_0_14px_rgba(167,139,250,0.18)]",
    inactive: "border-[#333333] text-[#5a6a5a] bg-[#1a1a1a]",
  },
};

function HWire({ powered, className, style }: WireProps) {
  return (
    <div
      className={cn(
        "h-1.5",
        BASE_WIRE_CLASSES,
        getWireClasses(powered),
        className,
      )}
      style={style}
    />
  );
}

function VWire({ powered, className, style }: WireProps) {
  return (
    <div
      className={cn(
        "w-1.5",
        BASE_WIRE_CLASSES,
        getWireClasses(powered),
        className,
      )}
      style={style}
    />
  );
}

function CompactCard({
  tag,
  title,
  subtitle,
  status,
  active,
  accent,
  icon,
  onClick,
  width = CARD_W,
  details,
}: CompactCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const hasDetails = Boolean(details?.length);
  const content = (
    <>
      <div className="mb-1 flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="truncate font-mono text-[8px] tracking-[0.22em] text-[#70839f]">
            {tag}
          </div>
          <div className="font-display text-[10px] font-semibold uppercase leading-tight tracking-[0.07em]">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-0.5 text-[9px] font-medium leading-tight text-[#b8f3ff]">
              {subtitle}
            </div>
          ) : null}
        </div>
        <div className="mt-0.5 shrink-0">{icon}</div>
      </div>
      <div className="font-mono text-[8px] leading-tight tracking-[0.12em]">{status}</div>
      {hasDetails ? (
        <div className="mt-2 border-t border-white/10 pt-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setDetailsOpen((open) => !open);
            }}
            className="group inline-flex items-center gap-1.5 rounded-full border border-[#1f3b4d] bg-[#08131a] px-2 py-1 font-mono text-[8px] tracking-[0.14em] text-[#8ecae6] transition-all duration-200 hover:scale-[1.02] hover:border-[#2a6078] hover:text-[#d9f7ff]"
            aria-expanded={detailsOpen}
          >
            <span className="text-[10px] font-semibold leading-none transition-transform duration-200 group-data-[state=open]:rotate-90">
              {detailsOpen ? "−" : "+"}
            </span>
            <span>GRID DETAILS</span>
          </button>

          <div
            data-state={detailsOpen ? "open" : "closed"}
            className={cn(
              "grid transition-all duration-300 ease-out",
              detailsOpen
                ? "mt-2 grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="overflow-hidden">
              <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
                <table className="w-full border-collapse text-left font-mono text-[8px]">
                  <thead className="bg-white/5 text-[#9fb3c8]">
                    <tr>
                      <th className="px-2 py-1 font-medium">Parameter</th>
                      <th className="px-2 py-1 font-medium">Abbreviation / Unit</th>
                      <th className="px-2 py-1 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details?.map((detail) => (
                      <tr key={detail.parameter} className="border-t border-white/10 align-top">
                        <td className="px-2 py-1.5 text-[#dce7f3]">{detail.parameter}</td>
                        <td className="px-2 py-1.5 text-[#8ecae6]">{detail.value}</td>
                        <td className="px-2 py-1.5 text-[#9fb3c8]">{detail.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  const cardClasses = cn(
    "rounded-xl border px-2.5 py-2 transition-all duration-300 shrink-0",
    active ? ACCENT_STYLES[accent].active : ACCENT_STYLES[accent].inactive,
  );

  if (!onClick) {
    return (
      <div className={cardClasses} style={{ width }}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className={cardClasses} style={{ width }}>
        {content}
      </div>
    </button>
  );
}

function NodeCard({ node }: { node: SourceNode | EquipmentNode | ATSNode }) {
  return <CompactCard {...node} />;
}

function BusNodeView({ node }: { node: BusNode }) {
  return (
    <div className="flex shrink-0 flex-col items-center">
      <VWire powered={node.active} className="h-10" />
      <div
        className={cn(
          "px-2 font-mono text-[8px] tracking-[0.22em]",
          node.active ? "text-[#00dcff]" : "text-[#475569]",
        )}
      >
        {node.label}
      </div>
      <VWire powered={node.active} className="h-10" />
    </div>
  );
}

function LoadBranchView({ branch }: { branch: LoadBranch }) {
  return (
    <div className="flex items-center gap-0">
      <HWire powered={branch.control.active} className="w-4" />
      <NodeCard node={branch.control} />
      <HWire powered={branch.loadPowered} className="w-4" />
      <NodeCard node={branch.load} />
    </div>
  );
}

function ConductorBundle({
  title,
  width,
  simLabel,
}: {
  title: string;
  width: number;
  simLabel?: string;
}) {
  return (
    <div className="mx-4 flex shrink-0 flex-col gap-[5px]">
      <div className="mb-1 flex items-center gap-2">
        <span className="font-mono text-[9px] tracking-[0.28em] text-[#6b7a6b]">
          {title}
        </span>
        {simLabel ? (
          <div className="rounded-full border border-[#1f3b4d] bg-[#08131a] px-3 py-0.5 font-mono text-[7px] tracking-[0.16em] text-[#8ecae6]">
            {simLabel}
          </div>
        ) : null}
      </div>

      {CONDUCTORS.map((conductor) => (
        <div
          key={`${title}-${conductor.label}`}
          className="flex items-center gap-2"
        >
          <span
            className="w-8 shrink-0 text-right font-mono text-[7.5px] tracking-[0.14em]"
            style={{ color: conductor.color }}
          >
            {conductor.label}
          </span>
          <div
            className="h-[5px] rounded-full"
            style={{
              width,
              backgroundColor: conductor.color,
              boxShadow: `0 0 7px ${conductor.glow}`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function StatusIcon({
  icon,
  activeColor,
  inactiveColor = "text-[#475569]",
  active,
}: {
  icon: "power" | "shield" | "zap" | "monitor";
  activeColor: string;
  inactiveColor?: string;
  active: boolean;
}) {
  const className = cn("h-4 w-4", active ? activeColor : inactiveColor);

  switch (icon) {
    case "power":
      return <Power className={className} />;
    case "shield":
      return <ShieldAlert className={className} />;
    case "zap":
      return <Zap className={className} />;
    case "monitor":
      return <Monitor className={className} />;
    default:
      return null;
  }
}

export function ElectricalOneLine({
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
}: ElectricalOneLineProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const atsRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [atsCenterX, setAtsCenterX] = useState<number | null>(null);

  const state = useMemo(() => {
    const supplyLive = voltage > 0;
    const meterLive = supplyLive;
    const genLive = false;
    const atsNormal = meterLive;
    const atsPowered = atsNormal || genLive;
    const genBrkLive = genLive;
    const mainPanelLive = disconnectClosed && !breakerTripped && atsPowered;
    const busLive = mainPanelLive;

    const atsStatus = atsNormal
      ? "NORMAL / UTILITY"
      : genLive
        ? "EMERGENCY / GEN"
        : "OPEN — NO SOURCE";

    return {
      supplyLive,
      meterLive,
      genLive,
      atsNormal,
      atsPowered,
      genBrkLive,
      mainPanelLive,
      busLive,
      atsStatus,
    };
  }, [voltage, disconnectClosed, breakerTripped]);

  const utilityNode: SourceNode = {
    kind: "source",
    tag: "UTILITY",
    title: "Energized Grid",
    subtitle: "Niagara Peninsula Energy (NPE)",
    status: state.supplyLive ? "ENERGIZED" : "UNAVAILABLE",
    active: state.supplyLive,
    accent: "cyan",
    width: 340,
    details: [
      { parameter: "Frequency", value: "60.00 Hz", description: "Grid stability." },
      { parameter: "Actual Power", value: "kW or MW", description: "Active load consumed." },
      { parameter: "Voltage", value: "V or kV", description: "Phase-to-phase voltage, e.g., 13.8 kV." },
      { parameter: "Current", value: "A (amperes)", description: "Current per phase (Ia, Ib, Ic)." },
      { parameter: "Power Factor", value: "cos φ", description: "Indicates energy efficiency, ideally close to 1.0." },
      { parameter: "Reactive Power", value: "kVAR", description: "Essential for grid management and balance." },
    ],
    icon: (
      <StatusIcon
        icon="zap"
        active={state.supplyLive}
        activeColor="text-[#00dcff]"
      />
    ),
  };

  const atsNode: ATSNode = {
    kind: "ats",
    tag: "ATS-001",
    title: "ATS",
    status: state.atsStatus,
    active: state.atsPowered,
    accent: state.atsNormal ? "cyan" : state.genLive ? "amber" : "red",
    mode: state.atsNormal ? "utility" : state.genLive ? "generator" : "offline",
    icon: (
      <ShieldAlert
        className={cn(
          "h-4 w-4",
          state.atsNormal
            ? "text-[#00dcff]"
            : state.genLive
              ? "text-[#ffb347]"
              : "text-[#475569]",
        )}
      />
    ),
  };

  const busNode: BusNode = {
    kind: "bus",
    label: "BUS",
    active: state.busLive,
  };

  const loadBranches: LoadBranch[] = [
    {
      kind: "loadBranch",
      control: {
        kind: "equipment",
        tag: "CTR-001",
        title: "FEEDER CTR",
        status: feederContactor ? "ENERGIZED" : "DE-ENERGIZED",
        active: feederContactor,
        accent: feederContactor ? "green" : "cyan",
        icon: (
          <StatusIcon
            icon="zap"
            active={feederContactor}
            activeColor="text-[#00f7a1]"
            inactiveColor="text-[#00dcff]"
          />
        ),
      },
      load: {
        kind: "equipment",
        tag: "MTR-001",
        title: "DISPENSER MTR",
        status: motorPowered ? `${current.toFixed(2)} A` : "STOPPED",
        active: motorPowered,
        accent: motorPowered ? "green" : "cyan",
        icon: (
          <div
            className={cn(
              "font-display text-base font-bold leading-none",
              motorPowered ? "text-[#00f7a1]" : "text-[#64748b]",
            )}
          >
            M
          </div>
        ),
      },
      loadPowered: motorPowered,
    },
    {
      kind: "loadBranch",
      control: {
        kind: "equipment",
        tag: "CTR-002",
        title: "SOL CONTACTOR",
        status: solenoidContactor ? "ENERGIZED" : "DE-ENERGIZED",
        active: solenoidContactor,
        accent: solenoidContactor ? "green" : "cyan",
        icon: (
          <StatusIcon
            icon="zap"
            active={solenoidContactor}
            activeColor="text-[#00f7a1]"
            inactiveColor="text-[#00dcff]"
          />
        ),
      },
      load: {
        kind: "equipment",
        tag: "SOL-001",
        title: "HOPPER GATE",
        status: gateOpen ? "OPEN" : "CLOSED",
        active: gateOpen,
        accent: gateOpen ? "green" : "cyan",
        icon: (
          <div
            className={cn(
              "font-display text-base leading-none",
              gateOpen ? "text-[#00f7a1]" : "text-[#64748b]",
            )}
          >
            ◫
          </div>
        ),
      },
      loadPowered: gateOpen,
    },
  ];

  const measureAtsCenter = useCallback(() => {
    const diagram = diagramRef.current;
    const ats = atsRef.current;
    if (!diagram || !ats) return;

    const diagramRect = diagram.getBoundingClientRect();
    const atsRect = ats.getBoundingClientRect();
    setAtsCenterX(atsRect.left - diagramRect.left + atsRect.width / 2);
  }, []);

  useEffect(() => {
    measureAtsCenter();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measureAtsCenter);
      return () => window.removeEventListener("resize", measureAtsCenter);
    }

    const observer = new ResizeObserver(() => measureAtsCenter());
    if (diagramRef.current) observer.observe(diagramRef.current);
    if (atsRef.current) observer.observe(atsRef.current);
    window.addEventListener("resize", measureAtsCenter);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureAtsCenter);
    };
  }, [measureAtsCenter]);

  const generatorUnits: GeneratorUnit[] = [
    {
      tag: "GEN-001",
      title: "GENERATOR 1",
      status: "STANDBY / OFFLINE",
      active: false,
    },
    {
      tag: "GEN-002",
      title: "GENERATOR 2",
      status: "STANDBY / OFFLINE",
      active: false,
    },
    {
      tag: "GEN-003",
      title: "GENERATOR 3",
      status: "STANDBY / OFFLINE",
      active: false,
    },
  ];

  const generatorBranchWireWidth = Math.max(
    0,
    (atsCenterX ?? SOURCE_COL_W + CARD_W / 2) - SOURCE_COL_W - CARD_W / 2,
  );
  const generatorBranchVerticalOffset = Math.max(
    0,
    (atsCenterX ?? SOURCE_COL_W + CARD_W / 2) - 3,
  );

  const scrollByAmount = useCallback((left: number, top = 0) => {
    viewportRef.current?.scrollBy({ left, top, behavior: "smooth" });
  }, []);

  const stopDragging = useCallback(() => {
    dragStateRef.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener("pointerup", stopDragging);
    return () => window.removeEventListener("pointerup", stopDragging);
  }, [stopDragging]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !viewportRef.current) return;

      dragStateRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: viewportRef.current.scrollLeft,
        scrollTop: viewportRef.current.scrollTop,
      };

      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current;
      const drag = dragStateRef.current;
      if (!viewport || !drag) return;

      viewport.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX);
      viewport.scrollTop = drag.scrollTop - (event.clientY - drag.startY);
    },
    [],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      stopDragging();
    },
    [stopDragging],
  );

  return (
    <div
      ref={viewportRef}
      tabIndex={0}
      aria-label="Electrical one-line diagram viewport"
      className={cn(
        "w-full overflow-auto pb-2 select-none outline-none",
        "cursor-grab active:cursor-grabbing",
        isDragging && "cursor-grabbing",
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={stopDragging}
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
    >
      <div ref={diagramRef} className="min-w-max">
        <div className="flex items-center gap-0">
          <div className="flex w-[142px] shrink-0 flex-col items-start">
            <NodeCard node={utilityNode} />
          </div>

          <div className="flex w-7 shrink-0 items-center">
            <VWire powered={state.supplyLive} style={{ height: 46 }} />
          </div>

          <HWire powered={state.supplyLive} className="w-6" />

          <ConductorBundle
            title="CONDUCTORS"
            width={300}
            simLabel="SIM: L1-N = 120V | L2-N = 120V | L1-L2 = 240V"
          />

          <HWire powered={state.supplyLive} className="w-6" />

          <NodeCard
            node={{
              kind: "equipment",
              tag: "POLE-001",
              title: "RISER POLE",
              status: state.supplyLive ? "4.8 KV" : "DEAD",
              active: state.supplyLive,
              accent: "cyan",
              icon: (
                <StatusIcon
                  icon="power"
                  active={state.supplyLive}
                  activeColor="text-[#00dcff]"
                />
              ),
            }}
          />

          <HWire powered={state.supplyLive} className="w-4" />

          <NodeCard
            node={{
              kind: "equipment",
              tag: "CB-UTIL",
              title: "POLE BREAKER",
              status: state.supplyLive ? "CLOSED" : "OPEN",
              active: state.supplyLive,
              accent: state.supplyLive ? "green" : "amber",
              icon: (
                <StatusIcon
                  icon="shield"
                  active={state.supplyLive}
                  activeColor="text-[#00f7a1]"
                  inactiveColor="text-[#ffb347]"
                />
              ),
            }}
          />

          <HWire powered={state.supplyLive} className="w-4" />

          <NodeCard
            node={{
              kind: "equipment",
              tag: "XFMR-001",
              title: "PAD-MOUNT TRANSFORMER",
              status: state.supplyLive ? "4.8K→240V" : "NO FEED",
              active: state.supplyLive,
              accent: "cyan",
              icon: (
                <StatusIcon
                  icon="zap"
                  active={state.supplyLive}
                  activeColor="text-[#00dcff]"
                />
              ),
            }}
          />

          <ConductorBundle title="SECONDARY SERVICE CABLE" width={220} />

          <HWire powered={state.meterLive} className="w-4" />

          <NodeCard
            node={{
              kind: "equipment",
              tag: "MTR-UTIL",
              title: "METER",
              status: state.meterLive ? `${voltage.toFixed(1)} VAC` : "0.0 VAC",
              active: state.meterLive,
              accent: "cyan",
              icon: (
                <StatusIcon
                  icon="zap"
                  active={state.meterLive}
                  activeColor="text-[#00dcff]"
                />
              ),
            }}
          />

          <HWire powered={state.meterLive} className="w-4" />

          <div ref={atsRef} className="shrink-0">
            <NodeCard node={atsNode} />
          </div>

          <HWire powered={state.atsPowered} className="w-4" />

          <NodeCard
            node={{
              kind: "equipment",
              tag: "PNL-001",
              title: "MAIN PANEL",
              status: state.mainPanelLive ? "ENERGIZED" : "OFFLINE",
              active: state.mainPanelLive,
              accent: state.mainPanelLive ? "green" : "amber",
              icon: (
                <StatusIcon
                  icon="power"
                  active={state.mainPanelLive}
                  activeColor="text-[#00f7a1]"
                  inactiveColor="text-[#ffb347]"
                />
              ),
            }}
          />

          <HWire powered={state.atsPowered} className="w-4" />

          <div className="flex shrink-0 flex-col items-center">
            <VWire powered={state.mainPanelLive} style={{ height: 14 }} />
            <NodeCard
              node={{
                kind: "equipment",
                tag: "SCADA-01",
                title: "SCADA MONITOR",
                status: state.mainPanelLive ? "MONITORING" : "OFFLINE",
                active: state.mainPanelLive,
                accent: "violet",
                icon: (
                  <StatusIcon
                    icon="monitor"
                    active={state.mainPanelLive}
                    activeColor="text-[#a78bfa]"
                  />
                ),
              }}
            />
            <VWire powered={state.mainPanelLive} style={{ height: 14 }} />
          </div>

          <HWire powered={state.atsPowered} className="w-4" />

          <NodeCard
            node={{
              kind: "equipment",
              tag: "MDS-001",
              title: "MAIN DISCONNECT",
              status: disconnectClosed ? "CLOSED" : "OPEN",
              active: disconnectClosed && state.atsPowered,
              accent: disconnectClosed ? "green" : "amber",
              icon: (
                <StatusIcon
                  icon="power"
                  active={disconnectClosed}
                  activeColor="text-[#00f7a1]"
                  inactiveColor="text-[#ffb347]"
                />
              ),
              onClick: onToggleDisconnect,
            }}
          />

          <HWire
            powered={disconnectClosed && state.atsPowered}
            className="w-4"
          />

          <NodeCard
            node={{
              kind: "equipment",
              tag: "CB-001",
              title: "CIRCUIT BREAKER",
              status: breakerTripped ? "TRIPPED" : "OK",
              active: !breakerTripped && disconnectClosed && state.atsPowered,
              accent: breakerTripped ? "red" : "green",
              icon: (
                <StatusIcon
                  icon="shield"
                  active={!breakerTripped}
                  activeColor="text-[#00f7a1]"
                  inactiveColor="text-[#ff4d5a]"
                />
              ),
              onClick: onToggleBreaker,
            }}
          />

          <HWire powered={state.busLive} className="w-4" />

          <BusNodeView node={busNode} />

          <div className="ml-0 flex self-stretch flex-col items-stretch justify-center gap-0">
            {loadBranches.map((branch, index) => (
              <div key={`${branch.control.tag}-${branch.load.tag}`}>
                {index > 0 ? <div className="h-3" /> : null}
                <LoadBranchView branch={branch} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start" style={{ height: 28 }}>
          <div
            style={{ width: generatorBranchVerticalOffset, flexShrink: 0 }}
          />
          <VWire powered={state.genBrkLive} style={{ height: 28 }} />
        </div>

        <div className="flex items-start gap-0">
          <div className="flex w-[142px] shrink-0 flex-col items-start gap-3">
            {generatorUnits.map((generator) => (
              <NodeCard
                key={generator.tag}
                node={{
                  kind: "source",
                  tag: generator.tag,
                  title: generator.title,
                  status: generator.status,
                  active: generator.active,
                  accent: "amber",
                  icon: <Zap className="h-4 w-4 text-[#475569]" />,
                }}
              />
            ))}
          </div>

          <div
            className="flex shrink-0 items-center"
            style={{
              width: generatorBranchWireWidth,
              minHeight: generatorUnits.length * 74 - 12,
            }}
          >
            <div className="flex h-full items-center">
              <VWire powered={state.genBrkLive} className="self-stretch" />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-[58px]">
              {generatorUnits.map((generator) => (
                <HWire
                  key={`${generator.tag}-branch`}
                  powered={generator.active}
                  className="w-full"
                />
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            <NodeCard
              node={{
                kind: "equipment",
                tag: "CB-GEN",
                title: "MAIN PANEL GEN",
                status: state.genBrkLive ? "CLOSED" : "OPEN / STANDBY",
                active: state.genBrkLive,
                accent: "amber",
                icon: (
                  <StatusIcon
                    icon="shield"
                    active={state.genBrkLive}
                    activeColor="text-[#ffb347]"
                  />
                ),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
