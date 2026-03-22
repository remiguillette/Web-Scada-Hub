import { cn } from '@/lib/utils';
import type { Accent } from './types';

export const CARD_W = 130;
export const SOURCE_COL_W = 142;
export const UTILITY_CARD_GAP = 150;
export const UTILITY_TO_RISER_GAP = 0;
export const UTILITY_SUPPLEMENTARY_CARD_GAP = 26;
export const ISOLATED_SWITCHGEAR_CARD_WIDTH = 352;
export const UTILITY_SUPPLEMENTARY_COUNT = 4;
export const UTILITY_LEFT_CLUSTER_WIDTH =
  UTILITY_SUPPLEMENTARY_COUNT * CARD_W +
  (UTILITY_SUPPLEMENTARY_COUNT - 1) * UTILITY_SUPPLEMENTARY_CARD_GAP +
  UTILITY_SUPPLEMENTARY_CARD_GAP;
export const PAN_STEP = 120;
export const BASE_DIAGRAM_SCALE = 3;
export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 2.6;
export const ZOOM_STEP = 0.0015;
export const KEYBOARD_ZOOM_STEP = 0.1;
export const BUTTON_ZOOM_STEP = 0.15;
export const PAN_OVERSCROLL = 280;

export const BASE_WIRE_CLASSES = 'transition-all duration-300 rounded-full shrink-0';

export const getWireClasses = (powered: boolean, axis: 'h' | 'v' = 'h') =>
  cn(
    powered
      ? axis === 'h'
        ? 'wire-powered-h'
        : 'wire-powered-v'
      : 'bg-[#1e293b]',
  );

export const ACCENT_STYLES: Record<Accent, { active: string; inactive: string }> = {
  green: {
    active: 'border-[#5aa784] text-[#8bd6b6] bg-[#132a1f]',
    inactive: 'border-[#333333] text-[#7a7a7a] bg-[#1a1a1a]',
  },
  cyan: {
    active: 'border-[#5bc2db] text-[#9fd8ea] bg-[#0c1f25]',
    inactive: 'border-[#333333] text-[#7a7a7a] bg-[#1a1a1a]',
  },
  red: {
    active: 'border-[#d55e68] text-[#edb2b5] bg-[#1f0f11]',
    inactive: 'border-[#333333] text-[#7a7a7a] bg-[#1a1a1a]',
  },
  amber: {
    active: 'border-[#d89a5a] text-[#eed6a2] bg-[#1d150b]',
    inactive: 'border-[#333333] text-[#7a7a7a] bg-[#1a1a1a]',
  },
  violet: {
    active: 'border-[#9b87c4] text-[#d3ccf8] bg-[#1b1522]',
    inactive: 'border-[#333333] text-[#7a7a7a] bg-[#1a1a1a]',
  },
};
