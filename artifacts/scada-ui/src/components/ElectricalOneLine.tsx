import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Building2, Monitor, Power, ShieldAlert, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildUtilitySnapshot } from "@/lib/utility-service";
import { SYSTEM } from "@/config/system";
import { useTranslation } from "@/context/LanguageContext";
import type { Translations } from "@/i18n/translations";
import type { GeneratorLiveStatus } from "@/context/GeneratorSimulationContext";

interface ElectricalOneLineProps {
  disconnectClosed: boolean;
  breakerTripped: boolean;
  feederContactor: boolean;
  solenoidContactor: boolean;
  motorPowered: boolean;
  gateOpen: boolean;
  voltage: number;
  current: number;
  frequency?: number;
  powerFactor?: number;
  activePower?: number;
  reactivePower?: number;
  apparentPower?: number;
  generatorLiveStates?: GeneratorLiveStatus[];
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

type FeederLoop = {
  id: string;
  label: string;
  feederTag: string;
  feederStatus: string;
  feederPowered: boolean;
  transformerTag: string;
  transformerLabel: string;
  transformerStatus: string;
  transformerPowered: boolean;
  loadTag: string;
  loadLabel: string;
  loadStatus: string;
  loadPowered: boolean;
};

type GeneratorUnit = {
  tag: string;
  title: string;
  status: string;
  active: boolean;
  width?: number;
  details?: DetailRow[];
};

type DragState = {
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
};

const CARD_W = 130;
const SOURCE_COL_W = 142;
const UTILITY_CARD_GAP = 150;
const SCROLL_STEP = 120;
const DIAGRAM_SCALE = 3;

const CONDUCTORS = [
  { label: "L1", color: "#5a82b5", glow: "rgba(90,130,181,0.18)" },
  { label: "L2", color: "#c96a6a", glow: "rgba(201,106,106,0.16)" },
  { label: "L3", color: "#c48e3b", glow: "rgba(196,142,59,0.16)" },
  { label: "N", color: "#8f8f8f", glow: "rgba(143,143,143,0.1)" },
  { label: "GND", color: "#5b8f6b", glow: "rgba(91,143,107,0.16)" },
] as const;

const STREET_BUS_CONDUCTORS = [
  {
    label: "L1",
    color: "#5a82b5",
    glow: "rgba(90,130,181,0.14)",
  },
  {
    label: "L2",
    color: "#c96a6a",
    glow: "rgba(201,106,106,0.14)",
  },
  {
    label: "L3",
    color: "#c48e3b",
    glow: "rgba(196,142,59,0.14)",
  },
  {
    label: "N",
    color: "#8f8f8f",
    glow: "rgba(143,143,143,0.08)",
  },
  {
    label: "GND",
    color: "#5b8f6b",
    glow: "rgba(91,143,107,0.14)",
  },
] as const;

type StreetBusMetric = {
  label: string;
  lines: string[];
  color: string;
  glow: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatBusVoltage(value: number) {
  return `${Math.round(value)} V`;
}

function formatBusCurrent(value: number) {
  return `${Math.max(0, Math.round(value))} A`;
}

const UTILITY_BUS_GEOMETRY = {
  width: CARD_W + 220,
  height: 500,
  titleY: 100,
  conductorLabelY: 108,
  lineTop: 280,
  lineBottom: 560,
  hSpacing: 25,
  annotationWidth: 44,
} as const;

const BASE_WIRE_CLASSES = "transition-all duration-300 rounded-full shrink-0";

const getWireClasses = (powered: boolean, axis: "h" | "v" = "h") =>
  cn(
    powered
      ? axis === "h"
        ? "wire-powered-h"
        : "wire-powered-v"
      : "bg-[#1e293b]",
  );

const ACCENT_STYLES: Record<Accent, { active: string; inactive: string }> = {
  green: {
    active: "border-[#5aa784] text-[#8bd6b6] bg-[#132a1f]",
    inactive: "border-[#333333] text-[#7a7a7a] bg-[#1a1a1a]",
  },
  cyan: {
    active: "border-[#5bc2db] text-[#9fd8ea] bg-[#0c1f25]",
    inactive: "border-[#333333] text-[#7a7a7a] bg-[#1a1a1a]",
  },
  red: {
    active: "border-[#d55e68] text-[#edb2b5] bg-[#1f0f11]",
    inactive: "border-[#333333] text-[#7a7a7a] bg-[#1a1a1a]",
  },
  amber: {
    active: "border-[#d89a5a] text-[#eed6a2] bg-[#1d150b]",
    inactive: "border-[#333333] text-[#7a7a7a] bg-[#1a1a1a]",
  },
  violet: {
    active: "border-[#9b87c4] text-[#d3ccf8] bg-[#1b1522]",
    inactive: "border-[#333333] text-[#7a7a7a] bg-[#1a1a1a]",
  },
};

function HWire({ powered, className, style }: WireProps) {
  return (
    <div
      className={cn(
        "h-1.5",
        BASE_WIRE_CLASSES,
        getWireClasses(powered, "h"),
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
        getWireClasses(powered, "v"),
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
  const { t } = useTranslation();
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
      <div className="font-mono text-[8px] leading-tight tracking-[0.12em]">
        {status}
      </div>
      {hasDetails ? (
        <div className="mt-2 border-t border-white/10 pt-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setDetailsOpen((open) => !open);
            }}
            className="group inline-flex items-center gap-1.5 rounded-full border border-[#1f3b4d] bg-[#08131a] bg-none px-2 py-1 font-mono text-[8px] tracking-[0.14em] text-[#8ecae6] transition-all duration-200 hover:scale-[1.02] hover:border-[#2a6078] hover:text-[#d9f7ff]"
            aria-expanded={detailsOpen}
          >
            <span className="text-[10px] font-semibold leading-none transition-transform duration-200 group-data-[state=open]:rotate-90">
              {detailsOpen ? "−" : "+"}
            </span>
            <span>
              {detailsOpen
                ? t.utility.details.button.close
                : t.utility.details.button.open}
            </span>
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
              <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20 bg-none">
                <table className="w-full border-collapse text-left font-mono text-[8px]">
                  <thead className="bg-white/5 text-[#9fb3c8]">
                    <tr>
                      <th className="px-2 py-1 font-medium">
                        {t.utility.details.table.parameter}
                      </th>
                      <th className="px-2 py-1 font-medium">
                        {t.utility.details.table.unit}
                      </th>
                      <th className="px-2 py-1 font-medium">
                        {t.utility.details.table.description}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {details?.map((detail) => (
                      <tr
                        key={detail.parameter}
                        className="border-t border-white/10 align-top"
                      >
                        <td className="px-2 py-1.5 text-[#dce7f3]">
                          {detail.parameter}
                        </td>
                        <td className="px-2 py-1.5 text-[#8ecae6]">
                          {detail.value}
                        </td>
                        <td className="px-2 py-1.5 text-[#9fb3c8]">
                          {detail.description}
                        </td>
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

  const effectiveWidth = hasDetails && detailsOpen ? width : CARD_W;

  const cardClasses = cn(
    "rounded-xl border bg-none px-2.5 py-2 transition-all duration-300 shrink-0",
    active ? ACCENT_STYLES[accent].active : ACCENT_STYLES[accent].inactive,
  );

  if (!onClick) {
    return (
      <div className={cardClasses} style={{ width: effectiveWidth }}>
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
      <div className={cardClasses} style={{ width: effectiveWidth }}>
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

function LoopFeederSection({
  feeders,
  powered,
}: {
  feeders: FeederLoop[];
  powered: boolean;
}) {
  return (
    <div className="ml-2 flex shrink-0 flex-col gap-6">
      {feeders.map((feeder) => (
        <div key={feeder.id} className="flex items-center gap-3">
          <div className="flex shrink-0 flex-col items-center gap-1">
            <div
              className={cn(
                "font-mono text-[8px] tracking-[0.28em]",
                feeder.feederPowered ? "text-[#8ecae6]" : "text-[#475569]",
              )}
            >
              {feeder.label}
            </div>
            <ConductorBundle
              title={feeder.feederTag}
              width={190}
              simLabel={feeder.feederStatus}
              powered={feeder.feederPowered}
            />
          </div>

          <NodeCard
            node={{
              kind: "equipment",
              tag: feeder.transformerTag,
              title: feeder.transformerLabel,
              status: feeder.transformerStatus,
              active: feeder.transformerPowered,
              accent: feeder.transformerPowered ? "cyan" : "amber",
              icon: (
                <StatusIcon
                  icon="zap"
                  active={feeder.transformerPowered}
                  activeColor="text-[#00dcff]"
                  inactiveColor="text-[#64748b]"
                />
              ),
            }}
          />

          <HWire powered={feeder.loadPowered} className="w-4" />

          <NodeCard
            node={{
              kind: "equipment",
              tag: feeder.loadTag,
              title: feeder.loadLabel,
              status: feeder.loadStatus,
              active: feeder.loadPowered,
              accent: feeder.loadPowered ? "green" : "cyan",
              icon: (
                <StatusIcon
                  icon="power"
                  active={feeder.loadPowered}
                  activeColor="text-[#00f7a1]"
                  inactiveColor="text-[#64748b]"
                />
              ),
            }}
          />
        </div>
      ))}
    </div>
  );
}

function ConductorBundle({
  title,
  width,
  simLabel,
  powered = true,
}: {
  title: string;
  width: number;
  simLabel?: string;
  powered?: boolean;
}) {
  return (
    <div className="mx-4 flex shrink-0 flex-col gap-[5px]">
      <div className="mb-1 flex items-center gap-2">
        <span
          className={cn(
            "font-mono text-[9px] tracking-[0.28em]",
            powered ? "text-[#6b7a6b]" : "text-[#3a3a3a]",
          )}
        >
          {title}
        </span>
        {simLabel ? (
          <div className="rounded-full border border-[#1f3b4d] bg-[#08131a] px-3 py-0.5 font-mono text-[7px] tracking-[0.16em] text-[#8ecae6]">
            {simLabel}
          </div>
        ) : null}
      </div>

      {CONDUCTORS.map((conductor, index) => (
        <div
          key={`${title}-${conductor.label}`}
          className="flex items-center gap-2"
        >
          <span
            className="w-44 shrink-0 text-right font-mono text-[7.5px] tracking-[0.14em]"
            style={{ color: powered ? conductor.color : "#2a2a2a" }}
          >
            {conductor.label}
          </span>
          <div
            className="relative h-[5px] overflow-hidden rounded-full"
            style={{ width }}
          >
            <div
              className="absolute inset-0 rounded-full transition-all duration-500"
              style={{
                backgroundColor: powered ? conductor.color : "#1e293b",
              }}
            />
            {powered && (
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${conductor.color} 40%, #ffffff44 50%, ${conductor.color} 60%, transparent 100%)`,
                  backgroundSize: "300% 100%",
                  animation: `wire-flow-h 1.4s linear infinite`,
                  animationDelay: `${index * 0.15}s`,
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function UtilityBusBackground({ utilityActive }: { utilityActive: boolean }) {
  const W = UTILITY_BUS_GEOMETRY.width;
  const H = UTILITY_BUS_GEOMETRY.height;
  const lineTop = UTILITY_BUS_GEOMETRY.lineTop;
  const count = STREET_BUS_CONDUCTORS.length;
  const totalHSpan = (count - 1) * UTILITY_BUS_GEOMETRY.hSpacing;
  const firstCX = CARD_W / 2 - totalHSpan / 2;
  const lineBottom = UTILITY_BUS_GEOMETRY.lineBottom;
  const centerY = UTILITY_BUS_GEOMETRY.lineTop - 20;
  const riserX = W - 2;

  return (
    <svg
      className="pointer-events-none absolute top-0 left-0 shrink-0"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-label="Utility street power bus"
      style={{ zIndex: 0, overflow: "visible" }}
    >
      {STREET_BUS_CONDUCTORS.map((conductor, index) => {
        const cx = firstCX + index * UTILITY_BUS_GEOMETRY.hSpacing;
        const tapY = centerY + (index - (count - 1) / 2) * 12;
        const animDelay = `${index * 0.12}s`;

        return (
          <g key={`bus-lines-${conductor.label}`}>
            {/* Base static line */}
            <line
              x1={cx}
              y1={155}
              x2={cx}
              y2={lineBottom}
              stroke={conductor.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={utilityActive ? 0.7 : 0.2}
            />
            {/* Animated flow overlay on vertical bus bar */}
            {utilityActive && (
              <line
                x1={cx}
                y1={155}
                x2={cx}
                y2={lineBottom}
                stroke={conductor.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity={0.9}
                strokeDasharray="10 8"
                style={{
                  animation: `dash-flow 0.9s linear infinite`,
                  animationDelay: animDelay,
                }}
              />
            )}

            {/* Horizontal tap line */}
            <line
              x1={cx}
              y1={tapY}
              x2={riserX - 20}
              y2={tapY}
              stroke={conductor.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={utilityActive ? 0.7 : 0.2}
            />
            {utilityActive && (
              <line
                x1={cx}
                y1={tapY}
                x2={riserX - 20}
                y2={tapY}
                stroke={conductor.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity={0.9}
                strokeDasharray="10 8"
                style={{
                  animation: `dash-flow 0.7s linear infinite`,
                  animationDelay: animDelay,
                }}
              />
            )}

            {/* Diagonal line */}
            <line
              x1={riserX - 20}
              y1={tapY}
              x2={riserX}
              y2={centerY}
              stroke={conductor.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={utilityActive ? 0.7 : 0.2}
            />
            {utilityActive && (
              <line
                x1={riserX - 20}
                y1={tapY}
                x2={riserX}
                y2={centerY}
                stroke={conductor.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity={0.9}
                strokeDasharray="10 8"
                style={{
                  animation: `dash-flow 0.8s linear infinite`,
                  animationDelay: animDelay,
                }}
              />
            )}

            <circle
              cx={cx}
              cy={tapY}
              r="3"
              fill={conductor.color}
              opacity={utilityActive ? 0.95 : 0.2}
            />
          </g>
        );
      })}
    </svg>
  );
}

function UtilityBusAnnotations({
  utilityActive,
  streetLabel,
  conductorMetrics,
}: {
  utilityActive: boolean;
  streetLabel: string;
  conductorMetrics: StreetBusMetric[];
}) {
  const feederLabel = "NPE-FDR-13.8-01";
  const count = STREET_BUS_CONDUCTORS.length;
  const totalHSpan = (count - 1) * UTILITY_BUS_GEOMETRY.hSpacing;
  const firstCX = CARD_W / 2 - totalHSpan / 2;
  const busCenterX = firstCX + totalHSpan / 2;
  const feederLabelShift = 145; // move only the feeder label to the right

  return (
    <div className="pointer-events-none absolute inset-0 z-[10]">
      <div
        className="absolute -translate-x-1/2 text-center font-mono text-[14px] font-bold tracking-[0.4em]"
        style={{
          top: UTILITY_BUS_GEOMETRY.titleY - 12,
          left: busCenterX,
          color: utilityActive ? "#4ade80" : "#4b5563",
          textShadow: utilityActive ? "0 0 10px rgba(74,222,128,0.28)" : "none",
        }}
      >
        <span>{streetLabel}</span>
        <span className="ml-2 text-[10px] font-medium tracking-[0.1em] text-[#cbd5e1]">
          (600Y / 347 V)
        </span>
      </div>

      <div
        className="absolute -translate-x-1/2 text-center font-mono text-[11px] font-semibold tracking-[0.28em] text-[#cbd5e1]"
        style={{
          top: UTILITY_BUS_GEOMETRY.lineTop - 64,
          left: busCenterX + feederLabelShift,
          textShadow: utilityActive ? "0 0 10px rgba(148,163,184,0.2)" : "none",
        }}
      >
        {feederLabel}
      </div>

      {conductorMetrics.map((conductor, index) => {
        const cx = firstCX + index * UTILITY_BUS_GEOMETRY.hSpacing;
        const width = UTILITY_BUS_GEOMETRY.annotationWidth;
        const left = cx - width / 2;

        return (
          <div
            key={`bus-annotation-${conductor.label}`}
            className="absolute flex flex-col items-center px-1 py-1 text-center font-mono"
            style={{
              top: UTILITY_BUS_GEOMETRY.conductorLabelY + 6,
              left,
              width,
              gap: "1px",
              color: conductor.color,
              opacity: utilityActive ? 1 : 0.5,
              textShadow: "none",
            }}
          >
            {conductor.lines.map((line, lineIndex) => {
              const className =
                lineIndex === 0
                  ? "text-[8px] font-semibold tracking-[0.14em]"
                  : lineIndex === 1
                    ? "text-[7px] tracking-[0.08em]"
                    : "text-[6px] tracking-[0.08em] opacity-70";

              return (
                <span
                  key={`${conductor.label}-${line}-${lineIndex}`}
                  className={className}
                >
                  {line}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function UtilityCardInterconnect({
  active,
  cardCount,
}: {
  active: boolean;
  cardCount: number;
}) {
  const cardSpanWidth = CARD_W * cardCount + UTILITY_CARD_GAP * (cardCount - 1);
  const lineStart = 6;
  const lineEnd = cardSpanWidth - 6;

  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2"
      width={cardSpanWidth}
      height={92}
      viewBox={`0 0 ${cardSpanWidth} 92`}
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      {CONDUCTORS.map((conductor, index) => {
        const y = 16 + index * 16;
        const animationDelay = `${index * 0.1}s`;

        return (
          <g key={`utility-card-interconnect-${conductor.label}`}>
            <text
              x={lineStart}
              y={y - 5}
              fill={active ? conductor.color : "#475569"}
              fontSize="8"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
              letterSpacing="1.4"
              opacity={active ? 0.9 : 0.5}
            >
              {conductor.label}
            </text>
            <line
              x1={lineStart + 26}
              y1={y}
              x2={lineEnd}
              y2={y}
              stroke={conductor.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={active ? 0.4 : 0.16}
            />
            {active && (
              <line
                x1={lineStart + 26}
                y1={y}
                x2={lineEnd}
                y2={y}
                stroke={conductor.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="10 8"
                opacity={0.85}
                style={{
                  animation: `dash-flow 0.8s linear infinite`,
                  animationDelay,
                }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function VerticalDivider({
  height,
  label,
}: {
  height: number;
  label?: string;
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-2 px-2">
      {label ? (
        <div className="font-mono text-[8px] tracking-[0.28em] text-[#4b5563]">
          {label}
        </div>
      ) : null}
      <div
        className="w-px bg-gradient-to-b from-[#334155] via-[#64748b] to-[#334155] shadow-[0_0_10px_rgba(100,116,139,0.35)]"
        style={{ height }}
      />
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

function buildUtilityDetails(
  t: Translations,
  frequency: number,
  voltage: number,
  current: number,
  activePower: number,
  apparentPower: number,
  reactivePower: number,
  powerFactor: number,
): DetailRow[] {
  const snapshot = buildUtilitySnapshot({
    energized: voltage > 0,
    frequency,
    current,
    activePower,
    apparentPower,
    reactivePower,
    powerFactor,
  });

  return [
    {
      parameter: t.utility.details.serviceType.label,
      value: snapshot.serviceType,
      description: t.utility.details.serviceType.desc,
    },
    {
      parameter: t.utility.details.utilityType.label,
      value: snapshot.utilityType,
      description: t.utility.details.utilityType.desc,
    },
    {
      parameter: t.utility.details.frequency.label,
      value: `${frequency.toFixed(2)} Hz`,
      description: t.utility.details.frequency.desc,
    },
    {
      parameter: t.utility.details.voltageLL.label,
      value: `${snapshot.lineToLineVoltage.toFixed(1)} V`,
      description: t.utility.details.voltageLL.desc,
    },
    {
      parameter: t.utility.details.voltageLN.label,
      value: `${snapshot.lineToNeutralVoltage.toFixed(1)} V`,
      description: t.utility.details.voltageLN.desc,
    },
    {
      parameter: t.utility.details.current.label,
      value: `${snapshot.totalServiceCurrent.toFixed(1)} A`,
      description: t.utility.details.current.desc,
    },
    {
      parameter: t.utility.details.activePower.label,
      value: `${snapshot.activePowerKw.toFixed(1)} kW`,
      description: t.utility.details.activePower.desc,
    },
    {
      parameter: t.utility.details.apparentPower.label,
      value: `${snapshot.apparentPowerKva.toFixed(1)} kVA`,
      description: t.utility.details.apparentPower.desc,
    },
    {
      parameter: t.utility.details.reactivePower.label,
      value: `${snapshot.reactivePowerKvar.toFixed(1)} kVAR`,
      description: t.utility.details.reactivePower.desc,
    },
    {
      parameter: t.utility.details.powerFactor.label,
      value: `${snapshot.powerFactor.toFixed(3)} ${snapshot.powerFactorState}`,
      description: t.utility.details.powerFactor.desc,
    },
    {
      parameter: t.utility.details.phaseBalance.label,
      value: `${snapshot.voltageImbalancePct.toFixed(1)}%`,
      description: t.utility.details.phaseBalance.desc,
    },
    {
      parameter: t.utility.details.source.label,
      value: snapshot.source,
      description: t.utility.details.source.desc,
    },
  ];
}

function buildMotorDetails(
  t: Translations,
  motorPowered: boolean,
  voltage: number,
  current: number,
  frequency: number,
  activePower: number,
  powerFactor: number,
  reactivePower: number,
): DetailRow[] {
  return [
    {
      parameter: t.voltage,
      value: `${motorPowered ? voltage.toFixed(1) : "0.0"} V`,
      description: t.motorVoltageDesc(SYSTEM.motor.nominalVoltage),
    },
    {
      parameter: t.current,
      value: `${current.toFixed(2)} A`,
      description: motorPowered ? t.motorCurrentRunning : t.motorCurrentStopped,
    },
    {
      parameter: t.frequency,
      value: `${frequency.toFixed(2)} Hz`,
      description: t.motorFreqDesc(SYSTEM.motor.nominalFrequency),
    },
    {
      parameter: t.activePower,
      value: `${activePower.toFixed(1)} W`,
      description: t.motorShaftPowerDelivered,
    },
    {
      parameter: t.powerFactor,
      value: `${motorPowered ? powerFactor.toFixed(3) : "—"} cos\u03C6`,
      description: t.motorPfNominal(SYSTEM.motor.powerFactor),
    },
    {
      parameter: t.reactivePower,
      value: `${reactivePower.toFixed(1)} VAR`,
      description: t.motorMagnitisingReactive,
    },
  ];
}

function buildGeneratorDetails(
  t: Translations,
  gen: (typeof SYSTEM.generators)[number],
  live: GeneratorLiveStatus | undefined,
  isActive: boolean,
): DetailRow[] {
  return [
    {
      parameter: t.frequency,
      value:
        live && live.state !== "OFFLINE"
          ? `${live.frequency.toFixed(2)} Hz`
          : `${gen.nominalFrequency.toFixed(2)} Hz`,
      description: isActive ? t.genLiveFreqDesc : t.genNominalFreqDesc,
    },
    {
      parameter: t.voltage,
      value:
        live && live.state !== "OFFLINE"
          ? `${live.voltage.toFixed(1)} V`
          : `${gen.nominalVoltage} V`,
      description: isActive
        ? t.genLiveVoltageDesc
        : t.genNominalVoltageDescOneline,
    },
    {
      parameter: t.current,
      value: live ? `${live.current.toFixed(2)} A` : "0 A",
      description: isActive ? t.genLiveCurrentDesc : t.genOfflineCurrentDesc,
    },
    {
      parameter: t.activePower,
      value: live ? `${live.activePower.toFixed(1)} W` : "0 W",
      description: isActive
        ? t.genEmergencyPowerDescOneline
        : t.genActivePowerRunning,
    },
    {
      parameter: t.reactivePower,
      value: live ? `${live.reactivePower.toFixed(1)} VAR` : "0 VAR",
      description: t.genReactiveDescFull,
    },
    {
      parameter: t.fuelLevel,
      value: `${gen.fuelLevel}%`,
      description: t.genFuelDescFull,
    },
  ];
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
  frequency = SYSTEM.utility.nominalFrequency,
  powerFactor = 1.0,
  activePower = 0,
  reactivePower = 0,
  apparentPower = 0,
  generatorLiveStates,
  onToggleDisconnect,
  onToggleBreaker,
}: ElectricalOneLineProps) {
  const { t } = useTranslation();
  const utilityActive = voltage > 0;
  const [busSample, setBusSample] = useState(0);

  useEffect(() => {
    if (!utilityActive) {
      setBusSample(0);
      return;
    }

    const interval = window.setInterval(() => {
      setBusSample((sample) => sample + 1);
    }, 350);

    return () => window.clearInterval(interval);
  }, [utilityActive]);

  const conductorMetrics = useMemo<StreetBusMetric[]>(() => {
    const basePhaseVoltage = clamp(voltage > 0 ? voltage : 347, 338, 354);
    const phaseOffsets = [1, -1, 0.5];
    const phaseCurrents = [current * 1.01, current * 0.98, current * 1.02];
    const cycle = Date.now() / 1000;
    const startingPulse = motorPowered
      ? Math.sin(cycle * 3.6) > 0.985
        ? 1.2
        : 1
      : 0;
    const phaseLabels = ["L1", "L2", "L3"];

    const phaseMetrics = phaseLabels.map((label, index) => {
      const drift = Math.sin(cycle * (0.18 + index * 0.03)) * 1.2;
      const noise =
        Math.sin(cycle * (3.3 + index * 0.4)) *
        (motorPowered ? current * 0.012 : 0);
      const burst = index === 2 ? startingPulse : 1;
      const liveVoltage = utilityActive
        ? clamp(basePhaseVoltage + phaseOffsets[index] + drift, 338, 354)
        : 0;
      const liveCurrent = utilityActive
        ? clamp(phaseCurrents[index] * burst + noise, 0, current * 1.25 + 25)
        : 0;

      return {
        label,
        lines: [
          label,
          formatBusVoltage(liveVoltage),
          formatBusCurrent(liveCurrent),
        ],
        color: STREET_BUS_CONDUCTORS[index].color,
        glow: STREET_BUS_CONDUCTORS[index].glow,
      };
    });

    const neutralCurrent = utilityActive
      ? clamp(
          Math.abs(
            phaseMetrics.reduce(
              (sum, phase) => sum + Number.parseFloat(phase.lines[2]),
              0,
            ) / 100,
          ) +
            8 +
            Math.sin(cycle * 2.1) * 6,
          5,
          25,
        )
      : 0;
    const neutralVoltage = utilityActive
      ? clamp(1.4 + Math.sin(cycle * 0.7) * 0.8, 0.5, 3)
      : 0;
    const groundVoltage = utilityActive
      ? clamp(0.15 + Math.sin(cycle * 0.45) * 0.05, 0.1, 0.2)
      : 0;

    return [
      ...phaseMetrics,
      {
        label: "N",
        lines: [
          "N",
          `${neutralVoltage.toFixed(1)} V`,
          formatBusCurrent(neutralCurrent),
        ],
        color: STREET_BUS_CONDUCTORS[3].color,
        glow: STREET_BUS_CONDUCTORS[3].glow,
      },
      {
        label: "GND",
        lines: ["GND", `${groundVoltage.toFixed(1)} V`],
        color: STREET_BUS_CONDUCTORS[4].color,
        glow: STREET_BUS_CONDUCTORS[4].glow,
      },
    ];
  }, [voltage, current, motorPowered, utilityActive, busSample]);

  const genLive =
    generatorLiveStates?.some(
      (s) =>
        s.state === "READY" ||
        s.state === "LOADED" ||
        s.state === "STABILIZING" ||
        (s.state === "STARTING" && s.voltage > 100),
    ) ?? false;
  const viewportRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const atsRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [atsCenterX, setAtsCenterX] = useState<number | null>(null);
  const [diagramSize, setDiagramSize] = useState({ width: 0, height: 0 });

  const state = useMemo(() => {
    const supplyLive = voltage > 0;
    const meterLive = supplyLive;
    const atsNormal = meterLive;
    const atsPowered = atsNormal || genLive;
    const genBrkLive = genLive;
    const mainPanelLive = disconnectClosed && !breakerTripped && atsPowered;
    const busLive = mainPanelLive;

    return {
      supplyLive,
      meterLive,
      genLive,
      atsNormal,
      atsPowered,
      genBrkLive,
      mainPanelLive,
      busLive,
    };
  }, [voltage, disconnectClosed, breakerTripped, genLive]);

  const atsStatus = state.atsNormal
    ? t.atsOnUtility
    : state.genLive
      ? t.atsOnEmergency
      : t.openNoSource;

  const utilityNode: SourceNode = {
    kind: "source",
    tag: SYSTEM.utility.tag,
    title: t.utilityName,
    subtitle: SYSTEM.utility.provider,
    status: state.supplyLive ? t.energized : t.unavailable,
    active: state.supplyLive,
    accent: "cyan",
    width: 340,
    details: buildUtilityDetails(
      t,
      frequency,
      voltage,
      current,
      activePower,
      apparentPower,
      reactivePower,
      powerFactor,
    ),
    icon: (
      <Building2
        className={cn(
          "h-4 w-4",
          state.supplyLive ? "text-[#00dcff]" : "text-[#475569]",
        )}
      />
    ),
  };

  const atsNode: ATSNode = {
    kind: "ats",
    tag: "ATS-001",
    title: "ATS",
    status: atsStatus,
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
    label: t.busBarLabel,
    active: state.busLive,
  };

  const feederLoops: FeederLoop[] = [
    {
      id: "feeder-a",
      label: t.feederALabel,
      feederTag: "UG-FDR-A",
      feederStatus: feederContactor ? t.loopFeedStatus : t.openStandby,
      feederPowered: feederContactor && state.busLive,
      transformerTag: "XFMR-RES",
      transformerLabel: t.loopTransformerResidential,
      transformerStatus:
        feederContactor && state.busLive ? "13.8kV→120/240V" : t.noFeed,
      transformerPowered: feederContactor && state.busLive,
      loadTag: "CAT-FEED",
      loadLabel: t.residentialCatFeed,
      loadStatus: motorPowered ? `${current.toFixed(2)} A` : t.stopped,
      loadPowered: motorPowered,
    },
    {
      id: "feeder-b",
      label: t.feederBLabel,
      feederTag: "UG-FDR-B",
      feederStatus: solenoidContactor ? t.loopFeedStatus : t.openStandby,
      feederPowered: solenoidContactor && state.busLive,
      transformerTag: "XFMR-COM",
      transformerLabel: t.loopTransformerCommercial,
      transformerStatus:
        solenoidContactor && state.busLive ? "13.8kV→347/600V" : t.noFeed,
      transformerPowered: solenoidContactor && state.busLive,
      loadTag: "COMM-001",
      loadLabel: t.commercialLoad,
      loadStatus: gateOpen ? t.energized : t.deEnergized,
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
    const updateLayoutMeasurements = () => {
      const diagram = diagramRef.current;
      if (diagram) {
        setDiagramSize({
          width: diagram.offsetWidth,
          height: diagram.offsetHeight,
        });
      }
      measureAtsCenter();
    };

    updateLayoutMeasurements();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateLayoutMeasurements);
      return () =>
        window.removeEventListener("resize", updateLayoutMeasurements);
    }

    const observer = new ResizeObserver(() => updateLayoutMeasurements());
    if (diagramRef.current) observer.observe(diagramRef.current);
    if (atsRef.current) observer.observe(atsRef.current);
    window.addEventListener("resize", updateLayoutMeasurements);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateLayoutMeasurements);
    };
  }, [measureAtsCenter]);

  const generatorUnits: GeneratorUnit[] = SYSTEM.generators.map((gen, idx) => {
    const live = generatorLiveStates?.[idx];
    const isActive =
      live?.state === "READY" ||
      live?.state === "LOADED" ||
      live?.state === "STABILIZING" ||
      live?.state === "STARTING";
    const statusLabel =
      live && live.state !== "OFFLINE" ? live.phaseLabel : t.standbyOffline;
    return {
      tag: gen.tag,
      title: gen.name,
      status: statusLabel,
      active: isActive ?? false,
      width: 340,
      details: buildGeneratorDetails(t, gen, live, isActive ?? false),
    };
  });

  const generatorBranchWireWidth = Math.max(
    0,
    (atsCenterX ?? SOURCE_COL_W + CARD_W / 2) - SOURCE_COL_W - CARD_W / 2,
  );
  const generatorSpacerWidth = 56;
  const campusDividerHeight = generatorUnits.length * 74 + 24;
  const generatorBranchVerticalOffset = Math.max(
    0,
    (atsCenterX ?? SOURCE_COL_W + CARD_W / 2) - generatorSpacerWidth - 3,
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

      const target = event.target as HTMLElement;
      if (target.closest("button, a, input, select, textarea")) return;

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
        "w-full overflow-auto scrollbar-hidden pb-2 select-none outline-none",
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
      <div
        className="pt-1 pb-8 pl-6 pr-10"
        style={{
          width:
            diagramSize.width > 0
              ? diagramSize.width * DIAGRAM_SCALE + 64
              : undefined,
          height:
            diagramSize.height > 0
              ? diagramSize.height * DIAGRAM_SCALE + 36
              : undefined,
        }}
      >
        <div
          ref={diagramRef}
          className="min-w-max"
          style={{
            transform: `scale(${DIAGRAM_SCALE})`,
            transformOrigin: "top left",
          }}
        >
          <div className="flex items-center gap-0">
            <div
              className="relative shrink-0"
              style={{
                width: CARD_W + 220,
                height: UTILITY_BUS_GEOMETRY.height,
              }}
            >
              <UtilityBusBackground utilityActive={state.supplyLive} />
              <UtilityBusAnnotations
                utilityActive={state.supplyLive}
                streetLabel={t.street}
                conductorMetrics={conductorMetrics}
              />
              <div
                className="absolute left-0 flex items-start"
                style={{
                  width: CARD_W,
                  zIndex: 1,
                  top: UTILITY_BUS_GEOMETRY.lineTop - 98,
                }}
              >
                <NodeCard node={utilityNode} />
              </div>
            </div>

            <div className="relative flex shrink-0 items-center">
              <UtilityCardInterconnect
                active={state.supplyLive}
                cardCount={3}
              />

              <div className="relative z-[1]">
                <NodeCard
                  node={{
                    kind: "equipment",
                    tag: "POLE-001",
                    title: t.riserPole,
                    status: state.supplyLive ? "4.8 KV" : t.dead,
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
              </div>

              <div
                className="relative z-[1]"
                style={{ marginLeft: UTILITY_CARD_GAP }}
              >
                <NodeCard
                  node={{
                    kind: "equipment",
                    tag: "CB-UTIL",
                    title: t.breakerRecloser,
                    status: state.supplyLive ? t.closed : t.openStandby,
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
              </div>

              <div
                className="relative z-[1]"
                style={{ marginLeft: UTILITY_CARD_GAP }}
              >
                <NodeCard
                  node={{
                    kind: "equipment",
                    tag: "SWGR-3W",
                    title: t.padMountedSwitchgear,
                    status: state.supplyLive
                      ? t.switchgear3WayStatus
                      : t.noFeed,
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
              </div>
            </div>

            <HWire powered={state.busLive} className="w-4" />

            <div ref={atsRef} className="shrink-0">
              <BusNodeView node={busNode} />
            </div>

            <HWire powered={state.busLive} className="w-4" />

            <div className="flex shrink-0 flex-col items-center">
              <VWire powered={state.busLive} style={{ height: 14 }} />
              <NodeCard
                node={{
                  kind: "equipment",
                  tag: "SCADA-01",
                  title: t.scadaMonitor,
                  status: state.busLive ? t.monitoring : t.genStateOffline,
                  active: state.busLive,
                  accent: "violet",
                  icon: (
                    <StatusIcon
                      icon="monitor"
                      active={state.busLive}
                      activeColor="text-[#a78bfa]"
                    />
                  ),
                }}
              />
              <VWire powered={state.busLive} style={{ height: 14 }} />
            </div>

            <LoopFeederSection feeders={feederLoops} powered={state.busLive} />
          </div>

          <div className="flex items-start" style={{ height: 28 }}>
            <div
              style={{ width: generatorBranchVerticalOffset, flexShrink: 0 }}
            />
            <VWire powered={state.genBrkLive} style={{ height: 28 }} />
          </div>

          <div className="flex items-start gap-0">
            <div className="w-[486px] shrink-0" />

            <VerticalDivider height={campusDividerHeight} label={t.campus} />

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
                    width: generator.width,
                    details: generator.details,
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
                  title: t.mainPanelGen,
                  status: state.genBrkLive ? t.closed : t.openStandby,
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
    </div>
  );
}
