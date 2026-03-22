import { memo } from "react";
import { PhaseMetricPanel } from "./PhaseMetricPanel";

type UtilityBusAnnotationsProps = {
  utilityActive: boolean;
  streetLabel: string;
  feederLabel: string;
  conductorLabels: readonly string[];
  conductorVoltages: readonly string[];
  conductorCurrents: readonly string[];
  conductorColors: readonly string[];
  titleY: number;
  feederLabelY: number;
  conductorLabelY: number;
  annotationWidth: number;
  firstCX: number;
  hSpacing: number;
  busCenterX: number;
  feederLabelX: number;
};

const UtilityBusHeader = memo(function UtilityBusHeader({
  utilityActive,
  streetLabel,
  feederLabel,
  titleY,
  feederLabelY,
  busCenterX,
  feederLabelX,
}: Pick<
  UtilityBusAnnotationsProps,
  | "utilityActive"
  | "streetLabel"
  | "feederLabel"
  | "titleY"
  | "feederLabelY"
  | "busCenterX"
  | "feederLabelX"
>) {
  return (
    <>
      <div
        className="absolute -translate-x-1/2 text-center font-mono text-[14px] font-bold tracking-[0.4em]"
        style={{
          top: titleY - 12,
          left: busCenterX,
          color: utilityActive ? "#4ade80" : "#4b5563",
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
          top: feederLabelY,
          left: feederLabelX,
        }}
      >
        {feederLabel}
      </div>
    </>
  );
});

const UtilityBusMetricAnnotation = memo(function UtilityBusMetricAnnotation({
  utilityActive,
  label,
  voltage,
  current,
  color,
  top,
  left,
  width,
}: {
  utilityActive: boolean;
  label: string;
  voltage: string;
  current: string;
  color: string;
  top: number;
  left: number;
  width: number;
}) {
  return (
    <div
      className="absolute flex flex-col items-center px-1 py-1 text-center font-mono"
      style={{
        top,
        left,
        width,
        gap: "1px",
        color,
        opacity: utilityActive ? 1 : 0.5,
        textShadow: "none",
      }}
    >
      <PhaseMetricPanel
        label={label}
        line1={voltage}
        line2={current}
        color={color}
      />
    </div>
  );
});

export const UtilityBusAnnotations = memo(function UtilityBusAnnotations({
  utilityActive,
  streetLabel,
  feederLabel,
  conductorLabels,
  conductorVoltages,
  conductorCurrents,
  conductorColors,
  titleY,
  feederLabelY,
  conductorLabelY,
  annotationWidth,
  firstCX,
  hSpacing,
  busCenterX,
  feederLabelX,
}: UtilityBusAnnotationsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[10]">
      <UtilityBusHeader
        utilityActive={utilityActive}
        streetLabel={streetLabel}
        feederLabel={feederLabel}
        titleY={titleY}
        feederLabelY={feederLabelY}
        busCenterX={busCenterX}
        feederLabelX={feederLabelX}
      />

      {conductorLabels.map((label, index) => {
        const cx = firstCX + index * hSpacing;
        const left = cx - annotationWidth / 2;

        return (
          <UtilityBusMetricAnnotation
            key={`bus-annotation-${label}`}
            utilityActive={utilityActive}
            label={label}
            voltage={conductorVoltages[index]}
            current={conductorCurrents[index]}
            color={conductorColors[index]}
            top={conductorLabelY + 6}
            left={left}
            width={annotationWidth}
          />
        );
      })}
    </div>
  );
});
