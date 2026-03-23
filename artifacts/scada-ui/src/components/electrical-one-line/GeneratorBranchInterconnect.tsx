import { memo } from "react";
import {
  buildElectricalOneLineWorldObjects,
  getElectricalOneLineGeneratorBranchPaths,
} from "./world-model";

const ELECTRICAL_ONE_LINE_WORLD_OBJECTS = buildElectricalOneLineWorldObjects();
const GENERATOR_BRANCH_PATHS =
  getElectricalOneLineGeneratorBranchPaths(ELECTRICAL_ONE_LINE_WORLD_OBJECTS);

export const GeneratorBranchInterconnect = memo(
  function GeneratorBranchInterconnect({
    active,
  }: {
    active: boolean;
  }) {
    const branchBounds = GENERATOR_BRANCH_PATHS.bounds;

    if (!branchBounds) {
      return null;
    }

    return (
      <svg
        className="pointer-events-none absolute left-0 top-0 z-0"
        width={branchBounds.width}
        height={branchBounds.height}
        viewBox={`0 0 ${branchBounds.width} ${branchBounds.height}`}
        aria-hidden="true"
        style={{ overflow: "visible" }}
      >
        {GENERATOR_BRANCH_PATHS.paths.map((path, index) => {
          const animationDelay = `${index * 0.08}s`;
          const relativePoints = path.points.map((point) => ({
            x: point.x - branchBounds.x,
            y: point.y - branchBounds.y,
          }));
          const d = `M ${relativePoints
            .map((point) => `${point.x} ${point.y}`)
            .join(" L ")}`;

          return (
            <g key={path.id}>
              <path
                d={d}
                fill="none"
                stroke={active ? "#ffb347" : "#475569"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={active ? 0.42 : 0.24}
              />
              {active ? (
                <path
                  d={d}
                  fill="none"
                  stroke="#ffb347"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="10 8"
                  opacity={0.88}
                  style={{
                    animation: "dash-flow 0.85s linear infinite",
                    animationDelay,
                  }}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    );
  },
);
