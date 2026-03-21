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

type MiniStatus = {
  label: string;
  tag: string;
  status: string;
  active: boolean;
};

type CompactCardProps = {
  tag: string;
  title: string;
  subtitle?: string;
  status: string;
  active: boolean;
  accent: Accent;
  icon?: ReactNode;
  onClick?: () => void;
  width?: number;
  details?: DetailRow[];
  statusDot?: boolean;
  miniStatuses?: MiniStatus[];
  cardClassName?: string;
  cardStyle?: CSSProperties;
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
  active: boolean;
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
  offsetX: number;
  offsetY: number;
};

type PinchState = {
  pointerIds: [number, number];
  startDistance: number;
  startZoom: number;
  midpointX: number;
  midpointY: number;
  contentX: number;
  contentY: number;
};

const CARD_W = 130;
const SOURCE_COL_W = 142;
const UTILITY_CARD_GAP = 150;
const UTILITY_TO_RISER_GAP = 0;
const UTILITY_SUPPLEMENTARY_CARD_GAP = 26;
const UTILITY_SUPPLEMENTARY_COUNT = 4;
const UTILITY_LEFT_CLUSTER_WIDTH =
  UTILITY_SUPPLEMENTARY_COUNT * CARD_W +
  (UTILITY_SUPPLEMENTARY_COUNT - 1) * UTILITY_SUPPLEMENTARY_CARD_GAP +
  UTILITY_SUPPLEMENTARY_CARD_GAP;
const PAN_STEP = 120;
const BASE_DIAGRAM_SCALE = 3;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 2.6;
const ZOOM_STEP = 0.0015;
const KEYBOARD_ZOOM_STEP = 0.1;
const BUTTON_ZOOM_STEP = 0.15;

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

function clampOffset(
  offset: number,
  viewportSize: number,
  contentSize: number,
) {
  if (contentSize <= viewportSize) {
    return (viewportSize - contentSize) / 2;
  }

  return clamp(offset, viewportSize - contentSize, 0);
}

function formatBusVoltage(value: number) {
  return `${Math.round(value)} V`;
}

function formatBusCurrent(value: number) {
  return `${Math.max(0, Math.round(value))} A`;
}

const UTILITY_BUS_GEOMETRY = {
  width: UTILITY_LEFT_CLUSTER_WIDTH + CARD_W + 240,
  height: 500,
  titleY: 100,
  conductorLabelY: 108,
  lineTop: 280,
  lineBottom: 560,
  hSpacing: 25,
  annotationWidth: 44,
  feederLabelY: 216,
  feederRiserInset: 20,
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
  statusDot = false,
  miniStatuses,
  cardClassName,
  cardStyle,
}: CompactCardProps) {
  const { t } = useTranslation();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const hasDetails = Boolean(details?.length);
  const hasMiniStatuses = Boolean(miniStatuses?.length);
  const hasExpandableContent = hasDetails || hasMiniStatuses;
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
        <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
          {statusDot ? (
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full border border-white/30",
                active ? "bg-[#00f7a1]" : "bg-[#ef4444]",
              )}
              aria-hidden="true"
            />
          ) : null}
          {icon ? <div>{icon}</div> : null}
        </div>
      </div>
      <div className="whitespace-pre-line font-mono text-[8px] leading-tight tracking-[0.12em]">
        {status}
      </div>
      {hasExpandableContent ? (
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
        </div>
      ) : null}
    </>
  );

  const cardClasses = cn(
    "rounded-xl border bg-none px-2.5 py-2 transition-all duration-300 shrink-0",
    active ? ACCENT_STYLES[accent].active : ACCENT_STYLES[accent].inactive,
    cardClassName,
  );

  const cardBody = (
    <div className={cardClasses} style={{ ...cardStyle }}>
      {content}
    </div>
  );

  const detailOverlay = hasExpandableContent ? (
    <div
      className="pointer-events-none absolute left-0 top-full z-20 pt-2"
      style={{ width }}
    >
      <div
        data-state={detailsOpen ? "open" : "closed"}
        className={cn(
          "origin-top-left transition-all duration-300 ease-out",
          detailsOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "translate-y-[-4px] scale-[0.98] opacity-0",
        )}
      >
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#08131a]/95 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className="overflow-hidden rounded-[inherit] border border-black/20">
            {hasDetails ? (
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
            ) : null}

            {hasMiniStatuses ? (
              <div className="divide-y divide-white/10">
                {miniStatuses?.map((miniStatus) => (
                  <div
                    key={`${miniStatus.label}-${miniStatus.tag}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-2 font-mono text-[8px] tracking-[0.12em]"
                  >
                    <div className="min-w-0">
                      <div className="text-[#dce7f3]">{miniStatus.label}</div>
                      <div className="mt-0.5 text-[#70839f]">
                        {miniStatus.tag}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "self-center whitespace-nowrap text-right",
                        miniStatus.active ? "text-[#8bd6b6]" : "text-[#edb2b5]",
                      )}
                    >
                      {miniStatus.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  if (!onClick) {
    return (
      <div className="relative shrink-0" style={{ width }}>
        {cardBody}
        {detailOverlay}
      </div>
    );
  }

  return (
    <div className="relative shrink-0" style={{ width }}>
      <button
        type="button"
        onClick={onClick}
        className="text-left transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {cardBody}
      </button>
      {detailOverlay}
    </div>
  );
}

function NodeCard({ node }: { node: SourceNode | EquipmentNode | ATSNode }) {
  return <CompactCard {...node} />;
}

function BusNodeView({ node }: { node: BusNode }) {
  return (
    <div
      className={cn("shrink-0", node.active ? "" : "opacity-70")}
      aria-hidden="true"
    />
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

function getUtilityBusLayout() {
  const width = UTILITY_BUS_GEOMETRY.width;
  const height = UTILITY_BUS_GEOMETRY.height;
  const count = STREET_BUS_CONDUCTORS.length;
  const totalHSpan = (count - 1) * UTILITY_BUS_GEOMETRY.hSpacing;
  const firstCX = UTILITY_LEFT_CLUSTER_WIDTH + CARD_W / 2 - totalHSpan / 2;
  const busCenterX = firstCX + totalHSpan / 2;
  const centerY = UTILITY_BUS_GEOMETRY.lineTop - 20;
  const lineBottom = UTILITY_BUS_GEOMETRY.lineBottom;
  const riserX = width - 2;
  const riserTapX = riserX - UTILITY_BUS_GEOMETRY.feederRiserInset;
  const feederLabelX = (busCenterX + riserX) / 2;

  return {
    width,
    height,
    count,
    totalHSpan,
    firstCX,
    busCenterX,
    centerY,
    lineBottom,
    riserX,
    riserTapX,
    feederLabelX,
  };
}

function UtilityBusBackground({ utilityActive }: { utilityActive: boolean }) {
  const {
    width,
    height,
    count,
    firstCX,
    lineBottom,
    centerY,
    riserX,
    riserTapX,
  } = getUtilityBusLayout();

  return (
    <svg
      className="pointer-events-none absolute top-0 left-0 shrink-0"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
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
              x2={riserTapX}
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
                x2={riserTapX}
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
              x1={riserTapX}
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
                x1={riserTapX}
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
  const { count, firstCX, busCenterX, feederLabelX } = getUtilityBusLayout();

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
          top: UTILITY_BUS_GEOMETRY.feederLabelY,
          left: feederLabelX,
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
  leadInWidth = 0,
}: {
  active: boolean;
  cardCount: number;
  leadInWidth?: number;
}) {
  const cardSpanWidth = CARD_W * cardCount + UTILITY_CARD_GAP * (cardCount - 1);
  const svgHeight = 92;
  const anchorY = svgHeight / 2;
  const conductorSpread = 8;
  const breakoutLength = 18;
  const convergeLength = 22;
  const totalWidth = cardSpanWidth + leadInWidth;

  const cards = Array.from({ length: cardCount }, (_, index) => {
    const left = leadInWidth + index * (CARD_W + UTILITY_CARD_GAP);
    return { left, right: left + CARD_W };
  });

  const firstCard = cards[0];
  const gaps = cards.slice(1).map((target, index) => ({
    source: cards[index],
    target,
  }));

  return (
    <svg
      className="pointer-events-none absolute top-1/2 z-0 -translate-y-1/2"
      width={totalWidth}
      height={svgHeight}
      viewBox={`0 0 ${totalWidth} ${svgHeight}`}
      aria-hidden="true"
      style={{ overflow: "visible", left: -leadInWidth }}
    >
      {firstCard && leadInWidth > 0 ? (
        <g key="utility-card-entry">
          <circle
            cx={firstCard.left}
            cy={anchorY}
            r="3"
            fill={active ? "#cbd5e1" : "#475569"}
            opacity={active ? 0.9 : 0.4}
          />

          {CONDUCTORS.map((conductor, index) => {
            const offset =
              (index - (CONDUCTORS.length - 1) / 2) * conductorSpread;
            const conductorY = anchorY + offset;
            const animationDelay = `${index * 0.1}s`;
            const fanoutStartX = firstCard.left;
            const fanoutEndX = firstCard.left + breakoutLength;

            return (
              <g key={`utility-card-entry-${conductor.label}`}>
                <path
                  d={`M ${fanoutStartX} ${anchorY} L ${fanoutEndX} ${conductorY} L ${firstCard.right} ${conductorY}`}
                  fill="none"
                  stroke={conductor.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={active ? 0.45 : 0.16}
                />
                {active && (
                  <path
                    d={`M ${fanoutStartX} ${anchorY} L ${fanoutEndX} ${conductorY} L ${firstCard.right} ${conductorY}`}
                    fill="none"
                    stroke={conductor.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="10 8"
                    opacity={0.9}
                    style={{
                      animation: `dash-flow 0.8s linear infinite`,
                      animationDelay,
                    }}
                  />
                )}
              </g>
            );
          })}
        </g>
      ) : null}

      {gaps.map((gap, gapIndex) => {
        const sourceAnchorX = gap.source.right;
        const targetAnchorX = gap.target.left;
        const parallelStartX = sourceAnchorX + breakoutLength;
        const parallelEndX = targetAnchorX - convergeLength;

        return (
          <g key={`utility-card-gap-${gapIndex}`}>
            <circle
              cx={sourceAnchorX}
              cy={anchorY}
              r="3"
              fill={active ? "#cbd5e1" : "#475569"}
              opacity={active ? 0.9 : 0.4}
            />
            <circle
              cx={targetAnchorX}
              cy={anchorY}
              r="3"
              fill={active ? "#cbd5e1" : "#475569"}
              opacity={active ? 0.9 : 0.4}
            />

            {CONDUCTORS.map((conductor, index) => {
              const offset =
                (index - (CONDUCTORS.length - 1) / 2) * conductorSpread;
              const conductorY = anchorY + offset;
              const animationDelay = `${index * 0.1}s`;

              return (
                <g
                  key={`utility-card-interconnect-${gapIndex}-${conductor.label}`}
                >
                  <path
                    d={`M ${sourceAnchorX} ${anchorY} L ${parallelStartX} ${conductorY} L ${parallelEndX} ${conductorY} L ${targetAnchorX} ${anchorY}`}
                    fill="none"
                    stroke={conductor.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={active ? 0.45 : 0.16}
                  />
                  {active && (
                    <path
                      d={`M ${sourceAnchorX} ${anchorY} L ${parallelStartX} ${conductorY} L ${parallelEndX} ${conductorY} L ${targetAnchorX} ${anchorY}`}
                      fill="none"
                      stroke={conductor.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="10 8"
                      opacity={0.9}
                      style={{
                        animation: `dash-flow 0.8s linear infinite`,
                        animationDelay,
                      }}
                    />
                  )}
                </g>
              );
            })}
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
  const pinchStateRef = useRef<PinchState | null>(null);
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const [isDragging, setIsDragging] = useState(false);
  const [atsCenterX, setAtsCenterX] = useState<number | null>(null);
  const [diagramSize, setDiagramSize] = useState({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

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

  const supplementaryUtilityNodes: EquipmentNode[] = [
    {
      kind: "equipment",
      tag: "UTIL-WTR",
      title: "Water",
      status: "Available",
      active: state.supplyLive,
      accent: "cyan",
      icon: (
        <StatusIcon
          icon="power"
          active={state.supplyLive}
          activeColor="text-[#00dcff]"
        />
      ),
    },
    {
      kind: "equipment",
      tag: "UTIL-WW",
      title: "Wastewater",
      status: "Available",
      active: state.supplyLive,
      accent: "cyan",
      icon: (
        <StatusIcon
          icon="power"
          active={state.supplyLive}
          activeColor="text-[#00dcff]"
        />
      ),
    },
    {
      kind: "equipment",
      tag: "UTIL-GAS",
      title: "Gas",
      status: "Available",
      active: state.supplyLive,
      accent: "cyan",
      icon: (
        <StatusIcon
          icon="power"
          active={state.supplyLive}
          activeColor="text-[#00dcff]"
        />
      ),
    },
    {
      kind: "equipment",
      tag: "UTIL-TEL",
      title: "Telecom",
      status: "Available",
      active: state.supplyLive,
      accent: "cyan",
      icon: (
        <StatusIcon
          icon="monitor"
          active={state.supplyLive}
          activeColor="text-[#00dcff]"
        />
      ),
    },
  ];

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
    active: state.busLive,
  };

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
      const viewport = viewportRef.current;
      if (viewport) {
        setViewportSize({
          width: viewport.clientWidth,
          height: viewport.clientHeight,
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

  const contentMetrics = useMemo(() => {
    const width = diagramSize.width * BASE_DIAGRAM_SCALE * zoom;
    const height = diagramSize.height * BASE_DIAGRAM_SCALE * zoom;

    return { width, height };
  }, [diagramSize.height, diagramSize.width, zoom]);

  useEffect(() => {
    if (!viewportSize.width || !viewportSize.height) return;

    setOffset((current) => ({
      x: clampOffset(current.x, viewportSize.width, contentMetrics.width),
      y: clampOffset(current.y, viewportSize.height, contentMetrics.height),
    }));
  }, [
    contentMetrics.height,
    contentMetrics.width,
    viewportSize.height,
    viewportSize.width,
  ]);

  const panBy = useCallback(
    (deltaX: number, deltaY: number) => {
      setOffset((current) => ({
        x: clampOffset(
          current.x + deltaX,
          viewportSize.width,
          contentMetrics.width,
        ),
        y: clampOffset(
          current.y + deltaY,
          viewportSize.height,
          contentMetrics.height,
        ),
      }));
    },
    [
      contentMetrics.height,
      contentMetrics.width,
      viewportSize.height,
      viewportSize.width,
    ],
  );

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

  const stopDragging = useCallback(() => {
    dragStateRef.current = null;
    pinchStateRef.current = null;
    if (activePointersRef.current.size <= 1) {
      setIsDragging(false);
    }
  }, []);

  const zoomAroundPoint = useCallback(
    (nextZoom: number, pointerX: number, pointerY: number) => {
      if (!viewportRef.current || !diagramSize.width || !diagramSize.height)
        return;

      const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      const nextContentWidth =
        diagramSize.width * BASE_DIAGRAM_SCALE * clampedZoom;
      const nextContentHeight =
        diagramSize.height * BASE_DIAGRAM_SCALE * clampedZoom;
      const contentX = (pointerX - offset.x) / zoom;
      const contentY = (pointerY - offset.y) / zoom;

      setZoom(clampedZoom);
      setOffset({
        x: clampOffset(
          pointerX - contentX * clampedZoom,
          viewportSize.width,
          nextContentWidth,
        ),
        y: clampOffset(
          pointerY - contentY * clampedZoom,
          viewportSize.height,
          nextContentHeight,
        ),
      });
    },
    [
      diagramSize.height,
      diagramSize.width,
      offset.x,
      offset.y,
      viewportSize.height,
      viewportSize.width,
      zoom,
    ],
  );

  const zoomByStep = useCallback(
    (delta: number) => {
      if (!viewportRef.current) return;

      const rect = viewportRef.current.getBoundingClientRect();
      zoomAroundPoint(zoom + delta, rect.width / 2, rect.height / 2);
    },
    [zoom, zoomAroundPoint],
  );

  useEffect(() => {
    const resetInteraction = () => {
      activePointersRef.current.clear();
      stopDragging();
    };

    window.addEventListener("pointercancel", resetInteraction);
    window.addEventListener("blur", resetInteraction);
    return () => {
      window.removeEventListener("pointercancel", resetInteraction);
      window.removeEventListener("blur", resetInteraction);
    };
  }, [stopDragging]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!viewportRef.current) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      const target = event.target as HTMLElement;
      if (target.closest("button, a, input, select, textarea")) return;

      activePointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      event.currentTarget.setPointerCapture(event.pointerId);

      if (activePointersRef.current.size >= 2) {
        const entries = Array.from(activePointersRef.current.entries()).slice(
          0,
          2,
        );
        const [[firstId, first], [secondId, second]] = entries;
        const midpointX = (first.x + second.x) / 2;
        const midpointY = (first.y + second.y) / 2;
        const startDistance =
          Math.hypot(second.x - first.x, second.y - first.y) || 1;
        const rect = viewportRef.current.getBoundingClientRect();
        const pointerX = midpointX - rect.left;
        const pointerY = midpointY - rect.top;

        pinchStateRef.current = {
          pointerIds: [firstId, secondId],
          startDistance,
          startZoom: zoom,
          midpointX: pointerX,
          midpointY: pointerY,
          contentX: (pointerX - offset.x) / zoom,
          contentY: (pointerY - offset.y) / zoom,
        };
        dragStateRef.current = null;
        setIsDragging(false);
        return;
      }

      pinchStateRef.current = null;
      dragStateRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      };

      setIsDragging(true);
    },
    [offset.x, offset.y, zoom],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activePointersRef.current.has(event.pointerId)) {
        activePointersRef.current.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
      }

      const pinch = pinchStateRef.current;
      if (pinch) {
        const [firstId, secondId] = pinch.pointerIds;
        const first = activePointersRef.current.get(firstId);
        const second = activePointersRef.current.get(secondId);
        if (!first || !second) return;

        const distance =
          Math.hypot(second.x - first.x, second.y - first.y) ||
          pinch.startDistance;
        const nextZoom = clamp(
          pinch.startZoom * (distance / pinch.startDistance),
          MIN_ZOOM,
          MAX_ZOOM,
        );
        const nextContentWidth =
          diagramSize.width * BASE_DIAGRAM_SCALE * nextZoom;
        const nextContentHeight =
          diagramSize.height * BASE_DIAGRAM_SCALE * nextZoom;

        setZoom(nextZoom);
        setOffset({
          x: clampOffset(
            pinch.midpointX - pinch.contentX * nextZoom,
            viewportSize.width,
            nextContentWidth,
          ),
          y: clampOffset(
            pinch.midpointY - pinch.contentY * nextZoom,
            viewportSize.height,
            nextContentHeight,
          ),
        });
        return;
      }

      const drag = dragStateRef.current;
      if (!drag) return;

      setOffset({
        x: clampOffset(
          drag.offsetX + (event.clientX - drag.startX),
          viewportSize.width,
          contentMetrics.width,
        ),
        y: clampOffset(
          drag.offsetY + (event.clientY - drag.startY),
          viewportSize.height,
          contentMetrics.height,
        ),
      });
    },
    [
      contentMetrics.height,
      contentMetrics.width,
      diagramSize.height,
      diagramSize.width,
      viewportSize.height,
      viewportSize.width,
    ],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      activePointersRef.current.delete(event.pointerId);

      if (activePointersRef.current.size >= 2) {
        const entries = Array.from(activePointersRef.current.entries()).slice(
          0,
          2,
        );
        const [[firstId, first], [secondId, second]] = entries;
        const midpointX = (first.x + second.x) / 2;
        const midpointY = (first.y + second.y) / 2;
        const rect = viewportRef.current?.getBoundingClientRect();
        if (rect) {
          const pointerX = midpointX - rect.left;
          const pointerY = midpointY - rect.top;
          pinchStateRef.current = {
            pointerIds: [firstId, secondId],
            startDistance:
              Math.hypot(second.x - first.x, second.y - first.y) || 1,
            startZoom: zoom,
            midpointX: pointerX,
            midpointY: pointerY,
            contentX: (pointerX - offset.x) / zoom,
            contentY: (pointerY - offset.y) / zoom,
          };
        }
        setIsDragging(false);
        return;
      }

      pinchStateRef.current = null;

      const remainingPointer = Array.from(
        activePointersRef.current.values(),
      )[0];
      if (remainingPointer) {
        dragStateRef.current = {
          startX: remainingPointer.x,
          startY: remainingPointer.y,
          offsetX: offset.x,
          offsetY: offset.y,
        };
        setIsDragging(true);
        return;
      }

      stopDragging();
    },
    [offset.x, offset.y, stopDragging, zoom],
  );

  return (
    <div
      ref={viewportRef}
      tabIndex={0}
      aria-label="Electrical one-line diagram viewport"
      className={cn(
        "relative h-full w-full overflow-hidden rounded-[28px] border border-[#163041] bg-[#050b10] select-none outline-none",
        "cursor-grab active:cursor-grabbing touch-none",
        isDragging && "cursor-grabbing",
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={stopDragging}
      onWheel={(event) => {
        event.preventDefault();

        const viewport = viewportRef.current;
        if (!viewport || !diagramSize.width || !diagramSize.height) return;

        const nextZoom = clamp(
          zoom - event.deltaY * ZOOM_STEP,
          MIN_ZOOM,
          MAX_ZOOM,
        );
        if (nextZoom === zoom) return;

        const rect = viewport.getBoundingClientRect();
        zoomAroundPoint(
          nextZoom,
          event.clientX - rect.left,
          event.clientY - rect.top,
        );
      }}
      onDoubleClick={() => {
        setZoom(1);
        setOffset({
          x: clampOffset(
            0,
            viewportSize.width,
            diagramSize.width * BASE_DIAGRAM_SCALE,
          ),
          y: clampOffset(
            0,
            viewportSize.height,
            diagramSize.height * BASE_DIAGRAM_SCALE,
          ),
        });
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          panBy(PAN_STEP, 0);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          panBy(-PAN_STEP, 0);
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          panBy(0, PAN_STEP);
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          panBy(0, -PAN_STEP);
        }
        if (
          (event.key === "+" || event.key === "=") &&
          !event.metaKey &&
          !event.ctrlKey
        ) {
          event.preventDefault();
          zoomByStep(KEYBOARD_ZOOM_STEP);
        }
        if (event.key === "-" && !event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          zoomByStep(-KEYBOARD_ZOOM_STEP);
        }
      }}
    >
      <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex items-center justify-between rounded-2xl border border-white/10 bg-black/35 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#8fb3c9] backdrop-blur">
        <span>Drag to pan · Wheel/pinch or +/- to zoom</span>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Zoom out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/35 text-sm text-[#d9f7ff] transition hover:border-[#2a6078] hover:bg-[#08131a]"
            onClick={() => zoomByStep(-BUTTON_ZOOM_STEP)}
          >
            −
          </button>
          <span className="min-w-14 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/35 text-sm text-[#d9f7ff] transition hover:border-[#2a6078] hover:bg-[#08131a]"
            onClick={() => zoomByStep(BUTTON_ZOOM_STEP)}
          >
            +
          </button>
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="pt-1 pb-8 pl-6 pr-10"
          style={{
            width:
              diagramSize.width > 0
                ? diagramSize.width * BASE_DIAGRAM_SCALE
                : undefined,
            height:
              diagramSize.height > 0
                ? diagramSize.height * BASE_DIAGRAM_SCALE
                : undefined,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "top left",
            willChange: "transform",
          }}
        >
          <div
            ref={diagramRef}
            className="min-w-max"
            style={{
              transform: `scale(${BASE_DIAGRAM_SCALE})`,
              transformOrigin: "top left",
            }}
          >
            <div className="flex items-center gap-0">
              <div
                className="relative shrink-0"
                style={{
                  width: UTILITY_BUS_GEOMETRY.width,
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
                    zIndex: 1,
                    top: UTILITY_BUS_GEOMETRY.lineTop - 98,
                    gap: UTILITY_SUPPLEMENTARY_CARD_GAP,
                  }}
                >
                  {supplementaryUtilityNodes.map((node) => (
                    <NodeCard key={node.tag} node={node} />
                  ))}
                  <NodeCard node={utilityNode} />
                </div>
              </div>

              <div
                className="relative flex shrink-0 items-center"
                style={{ marginLeft: UTILITY_TO_RISER_GAP }}
              >
                <UtilityCardInterconnect
                  active={state.supplyLive}
                  cardCount={2}
                  leadInWidth={UTILITY_TO_RISER_GAP}
                />

                <div className="relative z-[1]">
                  <NodeCard
                    node={{
                      kind: "equipment",
                      tag: "POLE-0326",
                      title: t.riserPole,
                      subtitle: t.structureLabel,
                      status: t.riserPoleStatus,
                      active: state.supplyLive,
                      accent: "cyan",
                      width: 340,
                      statusDot: true,
                      miniStatuses: [
                        {
                          label: t.surgeArresters,
                          tag: "LA-UTIL",
                          status: "Normal",
                          active: state.supplyLive,
                        },
                        {
                          label: t.fusedCutouts,
                          tag: "FCO-UTIL",
                          status: state.supplyLive ? "Closed" : "Open",
                          active: state.supplyLive,
                        },
                        {
                          label: t.overheadUndergroundTransition,
                          tag: t.overheadUndergroundTransition,
                          status: state.supplyLive
                            ? "Connected"
                            : "Disconnected",
                          active: state.supplyLive,
                        },
                      ],
                    }}
                  />
                </div>

                <div
                  className="relative z-[1] flex items-center"
                  style={{ marginLeft: UTILITY_CARD_GAP }}
                >
                  <NodeCard
                    node={{
                      kind: "equipment",
                      tag: "Beaver Woods MT",
                      title: "Beaver Woods MT",
                      subtitle: "Niagara Falls, ON",
                      status: state.supplyLive
                        ? "13.8kV • Urban Distribution"
                        : t.noFeed,
                      active: state.supplyLive,
                      accent: "amber",
                      details: [
                        {
                          parameter: "Identifier",
                          value: "Beaver Woods MT",
                          description: "Suggested Value",
                        },
                        {
                          parameter: "Location",
                          value: "Niagara Falls, ON",
                          description: "Suggested Value",
                        },
                        {
                          parameter: "Voltage",
                          value: "13.8kV",
                          description: "Suggested Value",
                        },
                        {
                          parameter: "Service",
                          value: "Urban Distribution",
                          description: "Suggested Value",
                        },
                        {
                          parameter: "Class",
                          value: "Medium Voltage (MV) substation",
                          description: "Suggested Value",
                        },
                      ],
                      cardClassName: "border-orange-500 border-dotted",
                      cardStyle: {
                        borderColor: "orange",
                        borderStyle: "dotted",
                      },
                      icon: (
                        <StatusIcon
                          icon="zap"
                          active={state.supplyLive}
                          activeColor="text-[#f59e0b]"
                        />
                      ),
                    }}
                  />
                </div>
              </div>

              <div ref={atsRef} className="shrink-0">
                <BusNodeView node={busNode} />
              </div>
            </div>

            <div className="flex items-start" style={{ height: 28 }}>
              <div
                style={{ width: generatorBranchVerticalOffset, flexShrink: 0 }}
              />
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
                <div className="flex flex-1 flex-col justify-center gap-[58px]"></div>
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
    </div>
  );
}
