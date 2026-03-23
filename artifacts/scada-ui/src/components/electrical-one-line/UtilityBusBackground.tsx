import { memo } from 'react';
import { CONDUCTORS } from './metrics';
import { buildElectricalOneLineWorldObjects, getElectricalOneLineUtilityBusGeometry } from './world-model';

const ELECTRICAL_ONE_LINE_WORLD_OBJECTS = buildElectricalOneLineWorldObjects();
const UTILITY_BUS_GEOMETRY_WORLD = getElectricalOneLineUtilityBusGeometry(ELECTRICAL_ONE_LINE_WORLD_OBJECTS);

export const UtilityBusBackground = memo(function UtilityBusBackground({ utilityActive }: { utilityActive: boolean }) {
  const busBounds = UTILITY_BUS_GEOMETRY_WORLD.bounds;

  if (!busBounds) {
    return null;
  }

  return (
    <svg className="pointer-events-none absolute top-0 left-0 shrink-0" width={busBounds.width} height={busBounds.height} viewBox={`0 0 ${busBounds.width} ${busBounds.height}`} aria-label="Utility street power bus" style={{ zIndex: 0, overflow: 'visible' }}>
      {UTILITY_BUS_GEOMETRY_WORLD.conductors.map((pathGeometry, index) => {
        const conductor = CONDUCTORS[index];
        const animDelay = `${index * 0.12}s`;
        const [verticalStart, verticalEnd, tapStart, tapMid, tapEnd] = pathGeometry.points.map((point) => ({
          x: point.x - busBounds.x,
          y: point.y - busBounds.y,
        }));
        const marker = {
          x: pathGeometry.marker.x - busBounds.x,
          y: pathGeometry.marker.y - busBounds.y,
        };

        return (
          <g key={pathGeometry.id}>
            <line x1={verticalStart.x} y1={verticalStart.y} x2={verticalEnd.x} y2={verticalEnd.y} stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" opacity={utilityActive ? 0.7 : 0.2} />
            {utilityActive ? <line x1={verticalStart.x} y1={verticalStart.y} x2={verticalEnd.x} y2={verticalEnd.y} stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" opacity={0.9} strokeDasharray="10 8" style={{ animation: 'dash-flow 0.9s linear infinite', animationDelay: animDelay }} /> : null}
            <line x1={tapStart.x} y1={tapStart.y} x2={tapMid.x} y2={tapMid.y} stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" opacity={utilityActive ? 0.7 : 0.2} />
            {utilityActive ? <line x1={tapStart.x} y1={tapStart.y} x2={tapMid.x} y2={tapMid.y} stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" opacity={0.9} strokeDasharray="10 8" style={{ animation: 'dash-flow 0.7s linear infinite', animationDelay: animDelay }} /> : null}
            <line x1={tapMid.x} y1={tapMid.y} x2={tapEnd.x} y2={tapEnd.y} stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" opacity={utilityActive ? 0.7 : 0.2} />
            {utilityActive ? <line x1={tapMid.x} y1={tapMid.y} x2={tapEnd.x} y2={tapEnd.y} stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" opacity={0.9} strokeDasharray="10 8" style={{ animation: 'dash-flow 0.8s linear infinite', animationDelay: animDelay }} /> : null}
            <circle cx={marker.x} cy={marker.y} r="3" fill={conductor.color} opacity={utilityActive ? 0.95 : 0.2} />
          </g>
        );
      })}
    </svg>
  );
});
