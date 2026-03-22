import { memo } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';
import { ACCENT_STYLES, ISOLATED_SWITCHGEAR_CARD_WIDTH } from './constants';
import { CONDUCTORS } from './metrics';
import { PhaseMetricPanel } from './PhaseMetricPanel';
import { StatusIcon } from './StatusIcon';
import type { BeaverWoodsMtCardProps } from './types';

export const BeaverWoodsMtCard = memo(function BeaverWoodsMtCard({ active, frequency, generatorLiveStates, conductorMetrics }: BeaverWoodsMtCardProps) {
  const { t } = useTranslation();
  const cardClasses = cn(
    'rounded-2xl border px-3 py-3 transition-all duration-300 shrink-0',
    active ? ACCENT_STYLES.cyan.active : ACCENT_STYLES.cyan.inactive,
  );
  const accentColors = ['#22d3ee', '#f59e0b', '#8b5cf6'];
  const activeGenerator = generatorLiveStates?.find((generator) => generator.state !== 'OFFLINE');
  const beaverCards = t.beaverWoodsMt.cards.map((card, index) => ({
    originLabel: '',
    originValue: '',
    networkLabel: '',
    networkValue: '',
    voltageLabel: '',
    voltageValue: '',
    detailSecondaryLabel: '',
    detailSecondaryValue: '',
    ...card,
    hzValue: index < 2 ? (active ? frequency.toFixed(2) : '0.00') : activeGenerator ? activeGenerator.frequency.toFixed(2) : '0.00',
  }));

  return (
    <div className="relative shrink-0" style={{ width: ISOLATED_SWITCHGEAR_CARD_WIDTH }}>
      <div className={cardClasses} style={{ width: ISOLATED_SWITCHGEAR_CARD_WIDTH, borderColor: 'rgba(249,115,22,0.7)', borderStyle: 'dotted' }}>
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2">
          <div>
            <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#70839f]">{t.beaverWoodsMt.incomingSource}</div>
            <div className="mt-1 font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[#dce7f3]">{t.beaverWoodsMt.title}</div>
          </div>
          <StatusIcon icon="zap" active={active} activeColor="text-[#00dcff]" />
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {beaverCards.map((card, index) => (
            <div key={card.cardLabel} className="rounded-xl border bg-[#071219]/95 px-3 py-3" style={{ borderColor: `${accentColors[index] ?? '#22d3ee'}59` }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#8ecae6]">{card.sourceLabel}</div>
                </div>
                <StatusIcon icon="zap" active={active} activeColor="text-[#00dcff]" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[7px] tracking-[0.14em]">
                {card.originLabel ? <div><div className="text-[#7f93ab]">{card.originLabel}</div><div className="mt-1 text-[#dce7f3]">{card.originValue}</div></div> : null}
                {card.networkLabel ? <div><div className="text-[#7f93ab]">{card.networkLabel}</div><div className="mt-1 text-[#dce7f3]">{card.networkValue}</div></div> : null}
                {card.voltageLabel ? <div><div className="text-[#7f93ab]">{card.voltageLabel}</div><div className="mt-1 text-[#dce7f3]">{active ? card.voltageValue : '0.0 kV'}</div></div> : null}
                <div><div className="text-[#7f93ab]">{card.hzLabel}</div><div className="mt-1 text-[#dce7f3]">{card.hzValue}</div></div>
                <div className="col-span-2">
                  <div className="text-[#7f93ab]">{card.phaseLabel}</div>
                  {index < 2 ? (
                    <div className="mt-1 grid grid-cols-5 gap-1 font-mono text-center">
                      {conductorMetrics.map((metric) => (
                        <PhaseMetricPanel key={`${card.sourceLabel}-${metric.label}`} label={metric.label} line1={metric.lines[1]} line2={metric.lines[2]} color={metric.color} />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-nowrap gap-1 whitespace-nowrap">
                      {CONDUCTORS.map((phase) => (
                        <span key={`${card.sourceLabel}-${phase.label}`} className="rounded border px-1.5 py-0.5 text-[7px] whitespace-nowrap" style={{ borderColor: `${phase.color}55`, color: phase.color }}>
                          {phase.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div><div className="text-[#7f93ab]">{card.detailLabel}</div><div className="mt-1 text-[#dce7f3]">{card.detailValue}</div></div>
                {card.detailSecondaryLabel ? <div><div className="text-[#7f93ab]">{card.detailSecondaryLabel}</div><div className="mt-1 text-[#dce7f3]">{card.detailSecondaryValue}</div></div> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
