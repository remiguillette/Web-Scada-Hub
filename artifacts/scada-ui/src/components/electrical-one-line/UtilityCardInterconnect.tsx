import { memo } from 'react';
import { CONDUCTORS } from './metrics';
import { buildElectricalOneLineWorldObjects, getElectricalOneLineUtilityInterconnectGeometry } from './world-model';

const ELECTRICAL_ONE_LINE_WORLD_OBJECTS = buildElectricalOneLineWorldObjects();
const UTILITY_INTERCONNECT_GEOMETRY = getElectricalOneLineUtilityInterconnectGeometry(ELECTRICAL_ONE_LINE_WORLD_OBJECTS);

export const UtilityCardInterconnect = memo(function UtilityCardInterconnect({
  active,
  cardCount,
  leadInWidth = 0,
}: {
  active: boolean;
  cardCount: number;
  leadInWidth?: number;
}) {
  void cardCount;
  const interconnectBounds = UTILITY_INTERCONNECT_GEOMETRY.bounds;

  if (!interconnectBounds) {
    return null;
  }

  const totalWidth = interconnectBounds.width + leadInWidth;
  const svgHeight = interconnectBounds.height;
  const markers = UTILITY_INTERCONNECT_GEOMETRY.markers.map((marker) => ({
    ...marker,
    point: {
      x: marker.point.x - interconnectBounds.x + leadInWidth,
      y: marker.point.y - interconnectBounds.y,
    },
  }));
  const paths = UTILITY_INTERCONNECT_GEOMETRY.paths.map((path) => ({
    ...path,
    points: path.points.map((point) => ({
      x: point.x - interconnectBounds.x + leadInWidth,
      y: point.y - interconnectBounds.y,
    })),
  }));

  return (
    <svg className="pointer-events-none absolute top-1/2 z-0 -translate-y-1/2" width={totalWidth} height={svgHeight} viewBox={`0 0 ${totalWidth} ${svgHeight}`} aria-hidden="true" style={{ overflow: 'visible', left: -leadInWidth }}>
      {markers.map((marker) => (
        <circle key={marker.id} cx={marker.point.x} cy={marker.point.y} r="3" fill={active ? '#cbd5e1' : '#475569'} opacity={active ? 0.9 : 0.4} />
      ))}
      {paths.map((path, index) => {
        const conductor = CONDUCTORS[index];
        const animationDelay = `${index * 0.1}s`;
        const d = `M ${path.points.map((point) => `${point.x} ${point.y}`).join(' L ')}`;

        return (
          <g key={path.id}>
            <path d={d} fill="none" stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity={active ? 0.45 : 0.16} />
            {active ? <path d={d} fill="none" stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 8" opacity={0.9} style={{ animation: 'dash-flow 0.8s linear infinite', animationDelay }} /> : null}
          </g>
        );
      })}
    </svg>
  );
});
