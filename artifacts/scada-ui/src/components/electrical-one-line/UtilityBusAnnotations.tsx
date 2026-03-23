import { memo } from "react";
import { PhaseMetricPanel } from "./PhaseMetricPanel";
import {
  buildElectricalOneLineWorldObjects,
  getElectricalOneLineUtilityBusAnnotationGeometry,
} from "./world-model";

type UtilityBusAnnotationsProps = {
  utilityActive: boolean;
  streetLabel: string;
  feederLabel: string;
  conductorLabels: readonly string[];
  conductorVoltages: readonly string[];
  conductorCurrents: readonly string[];
  conductorColors: readonly string[];
};

const ELECTRICAL_ONE_LINE_WORLD_OBJECTS = buildElectricalOneLineWorldObjects();
const UTILITY_BUS_ANNOTATION_GEOMETRY =
  getElectricalOneLineUtilityBusAnnotationGeometry(
    ELECTRICAL_ONE_LINE_WORLD_OBJECTS,
  );
const ANNOTATION_WIDTH = 44;

const UtilityBusHeader = memo(function UtilityBusHeader({
  utilityActive,
  streetLabel,
  feederLabel,
}: Pick<
  UtilityBusAnnotationsProps,
  "utilityActive" | "streetLabel" | "feederLabel"
>) {
  const annotationBounds = UTILITY_BUS_ANNOTATION_GEOMETRY.bounds;
  const streetLabelAnchor = UTILITY_BUS_ANNOTATION_GEOMETRY.streetLabel;
  const feederLabelAnchor = UTILITY_BUS_ANNOTATION_GEOMETRY.feederLabel;

  if (!annotationBounds || !streetLabelAnchor || !feederLabelAnchor) {
    return null;
  }

  return (
    <>
      <div
        className="absolute -translate-x-1/2 text-center font-mono text-[14px] font-bold tracking-[0.4em]"
        style={{
          top: streetLabelAnchor.point.y - annotationBounds.y,
          left: streetLabelAnchor.point.x - annotationBounds.x,
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
          top: feederLabelAnchor.point.y - annotationBounds.y,
          left: feederLabelAnchor.point.x - annotationBounds.x,
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
  centerX,
  top,
}: {
  utilityActive: boolean;
  label: string;
  voltage: string;
  current: string;
  color: string;
  centerX: number;
  top: number;
}) {
  return (
    <div
      className="absolute flex flex-col items-center px-1 py-1 text-center font-mono"
      style={{
        top,
        left: centerX - ANNOTATION_WIDTH / 2,
        width: ANNOTATION_WIDTH,
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
}: UtilityBusAnnotationsProps) {
  const annotationBounds = UTILITY_BUS_ANNOTATION_GEOMETRY.bounds;

  if (!annotationBounds) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[10]">
      <UtilityBusHeader
        utilityActive={utilityActive}
        streetLabel={streetLabel}
        feederLabel={feederLabel}
      />

      {UTILITY_BUS_ANNOTATION_GEOMETRY.conductorMetrics.map(
        (metricAnchor, index) => (
          <UtilityBusMetricAnnotation
            key={metricAnchor.id}
            utilityActive={utilityActive}
            label={conductorLabels[index]}
            voltage={conductorVoltages[index]}
            current={conductorCurrents[index]}
            color={conductorColors[index]}
            top={metricAnchor.point.y - annotationBounds.y}
            centerX={metricAnchor.point.x - annotationBounds.x}
          />
        ),
      )}
    </div>
  );
});
