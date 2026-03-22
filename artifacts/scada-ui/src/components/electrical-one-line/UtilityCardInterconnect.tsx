import { memo } from 'react';
import { CARD_W, UTILITY_CARD_GAP } from './constants';
import { CONDUCTORS } from './metrics';

export const UtilityCardInterconnect = memo(function UtilityCardInterconnect({
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
  const gaps = cards.slice(1).map((target, index) => ({ source: cards[index], target }));

  return (
    <svg className="pointer-events-none absolute top-1/2 z-0 -translate-y-1/2" width={totalWidth} height={svgHeight} viewBox={`0 0 ${totalWidth} ${svgHeight}`} aria-hidden="true" style={{ overflow: 'visible', left: -leadInWidth }}>
      {firstCard && leadInWidth > 0 ? (
        <g key="utility-card-entry">
          <circle cx={firstCard.left} cy={anchorY} r="3" fill={active ? '#cbd5e1' : '#475569'} opacity={active ? 0.9 : 0.4} />
          {CONDUCTORS.map((conductor, index) => {
            const offset = (index - (CONDUCTORS.length - 1) / 2) * conductorSpread;
            const conductorY = anchorY + offset;
            const animationDelay = `${index * 0.1}s`;
            const fanoutStartX = firstCard.left;
            const fanoutEndX = firstCard.left + breakoutLength;
            const path = `M ${fanoutStartX} ${anchorY} L ${fanoutEndX} ${conductorY} L ${firstCard.right} ${conductorY}`;

            return (
              <g key={`utility-card-entry-${conductor.label}`}>
                <path d={path} fill="none" stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity={active ? 0.45 : 0.16} />
                {active ? <path d={path} fill="none" stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 8" opacity={0.9} style={{ animation: 'dash-flow 0.8s linear infinite', animationDelay }} /> : null}
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
            <circle cx={sourceAnchorX} cy={anchorY} r="3" fill={active ? '#cbd5e1' : '#475569'} opacity={active ? 0.9 : 0.4} />
            <circle cx={targetAnchorX} cy={anchorY} r="3" fill={active ? '#cbd5e1' : '#475569'} opacity={active ? 0.9 : 0.4} />
            {CONDUCTORS.map((conductor, index) => {
              const offset = (index - (CONDUCTORS.length - 1) / 2) * conductorSpread;
              const conductorY = anchorY + offset;
              const animationDelay = `${index * 0.1}s`;
              const path = `M ${sourceAnchorX} ${anchorY} L ${parallelStartX} ${conductorY} L ${parallelEndX} ${conductorY} L ${targetAnchorX} ${anchorY}`;

              return (
                <g key={`utility-card-interconnect-${gapIndex}-${conductor.label}`}>
                  <path d={path} fill="none" stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity={active ? 0.45 : 0.16} />
                  {active ? <path d={path} fill="none" stroke={conductor.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 8" opacity={0.9} style={{ animation: 'dash-flow 0.8s linear infinite', animationDelay }} /> : null}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
});
