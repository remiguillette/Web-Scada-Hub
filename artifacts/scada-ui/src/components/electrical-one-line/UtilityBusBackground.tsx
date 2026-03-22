import { memo } from 'react';
import { getUtilityBusLayout, UTILITY_BUS_GEOMETRY } from './geometry';
import { CONDUCTORS } from './metrics';

export const UtilityBusBackground = memo(function UtilityBusBackground({ utilityActive }: { utilityActive: boolean }) {
  const { width, height, count, firstCX, lineBottom, centerY, riserX, riserTapX } = getUtilityBusLayout();

  return (
    <svg className="pointer-events-none absolute top-0 left-0 shrink-0" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="Utility street power bus" style={{ zIndex: 0, overflow: 'visible' }}>
      {CONDUCTORS.map((conductor, index) => {
        const cx = firstCX + index * UTILITY_BUS_GEOMETRY.hSpacing;
        const tapY = centerY + (index - (count - 1) / 2) * 12;
        const animDelay = `${index * 0.12}s`;

        return (
          <g key={`bus-lines-${conductor.label}`}>
            <line x1={cx} y1={155} x2={cx} y2={lineBottom} stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" opacity={utilityActive ? 0.7 : 0.2} />
            {utilityActive ? <line x1={cx} y1={155} x2={cx} y2={lineBottom} stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" opacity={0.9} strokeDasharray="10 8" style={{ animation: 'dash-flow 0.9s linear infinite', animationDelay: animDelay }} /> : null}
            <line x1={cx} y1={tapY} x2={riserTapX} y2={tapY} stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" opacity={utilityActive ? 0.7 : 0.2} />
            {utilityActive ? <line x1={cx} y1={tapY} x2={riserTapX} y2={tapY} stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" opacity={0.9} strokeDasharray="10 8" style={{ animation: 'dash-flow 0.7s linear infinite', animationDelay: animDelay }} /> : null}
            <line x1={riserTapX} y1={tapY} x2={riserX} y2={centerY} stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" opacity={utilityActive ? 0.7 : 0.2} />
            {utilityActive ? <line x1={riserTapX} y1={tapY} x2={riserX} y2={centerY} stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" opacity={0.9} strokeDasharray="10 8" style={{ animation: 'dash-flow 0.8s linear infinite', animationDelay: animDelay }} /> : null}
            <circle cx={cx} cy={tapY} r="3" fill={conductor.color} opacity={utilityActive ? 0.95 : 0.2} />
          </g>
        );
      })}
    </svg>
  );
});
