import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';
import { ACCENT_STYLES, CARD_W } from './constants';
import type { CompactCardProps } from './types';

export function CompactCard({
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
          <div className="truncate font-mono text-[8px] tracking-[0.22em] text-[#70839f]">{tag}</div>
          <div className="font-display text-[10px] font-semibold uppercase leading-tight tracking-[0.07em]">{title}</div>
          {subtitle ? <div className="mt-0.5 text-[9px] font-medium leading-tight text-[#b8f3ff]">{subtitle}</div> : null}
        </div>
        <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
          {statusDot ? <span className={cn('h-2.5 w-2.5 rounded-full border border-white/30', active ? 'bg-[#00f7a1]' : 'bg-[#ef4444]')} aria-hidden="true" /> : null}
          {icon ? <div>{icon}</div> : null}
        </div>
      </div>
      <div className="whitespace-pre-line font-mono text-[8px] leading-tight tracking-[0.12em]">{status}</div>
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
              {detailsOpen ? '−' : '+'}
            </span>
            <span>{detailsOpen ? t.utility.details.button.close : t.utility.details.button.open}</span>
          </button>
        </div>
      ) : null}
    </>
  );

  const cardClasses = cn(
    'rounded-xl border bg-none px-2.5 py-2 transition-all duration-300 shrink-0',
    active ? ACCENT_STYLES[accent].active : ACCENT_STYLES[accent].inactive,
  );

  const cardBody = <div className={cardClasses} style={{ width: CARD_W, ...cardStyle }}>{content}</div>;

  const detailOverlay = hasExpandableContent ? (
    <div className="pointer-events-none absolute left-0 top-full z-20 pt-2" style={{ width }}>
      <div data-state={detailsOpen ? 'open' : 'closed'} className={cn('origin-top-left transition-all duration-300 ease-out', detailsOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'translate-y-[-4px] scale-[0.98] opacity-0')}>
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#08131a]/95 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className="overflow-hidden rounded-[inherit] border border-black/20">
            {hasDetails ? (
              <table className="w-full border-collapse text-left font-mono text-[8px]">
                <thead className="bg-white/5 text-[#9fb3c8]">
                  <tr>
                    <th className="px-2 py-1 font-medium">{t.utility.details.table.parameter}</th>
                    <th className="px-2 py-1 font-medium">{t.utility.details.table.unit}</th>
                    <th className="px-2 py-1 font-medium">{t.utility.details.table.description}</th>
                  </tr>
                </thead>
                <tbody>
                  {details?.map((detail) => (
                    <tr key={detail.parameter} className="border-t border-white/10 align-top">
                      <td className="px-2 py-1.5 text-[#dce7f3]">{detail.parameter}</td>
                      <td className="px-2 py-1.5 text-[#8ecae6]">{detail.value}</td>
                      <td className="px-2 py-1.5 text-[#9fb3c8]">{detail.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}

            {hasMiniStatuses ? (
              <div className="divide-y divide-white/10">
                {miniStatuses?.map((miniStatus) => (
                  <div key={`${miniStatus.label}-${miniStatus.tag}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-2 font-mono text-[8px] tracking-[0.12em]">
                    <div className="min-w-0">
                      <div className="text-[#dce7f3]">{miniStatus.label}</div>
                      <div className="mt-0.5 text-[#70839f]">{miniStatus.tag}</div>
                    </div>
                    <div className={cn('self-center whitespace-nowrap text-right', miniStatus.active ? 'text-[#8bd6b6]' : 'text-[#edb2b5]')}>
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
    return <div className="relative shrink-0" style={{ width: CARD_W }}>{cardBody}{detailOverlay}</div>;
  }

  return <div className="relative shrink-0" style={{ width: CARD_W }}><button type="button" onClick={onClick} className="text-left transition-transform hover:scale-[1.02] active:scale-[0.98]">{cardBody}</button>{detailOverlay}</div>;
}
