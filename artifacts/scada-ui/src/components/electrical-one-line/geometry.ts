import {
  CARD_W,
  ISOLATED_SWITCHGEAR_CARD_WIDTH,
  PAN_OVERSCROLL,
  UTILITY_CARD_GAP,
  UTILITY_LEFT_CLUSTER_WIDTH,
  UTILITY_TO_RISER_GAP,
} from './constants';
import { CONDUCTORS } from './metrics';

export type DiagramBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function clampOffset(offset: number, viewportSize: number, contentSize: number) {
  if (contentSize <= viewportSize) {
    return (viewportSize - contentSize) / 2;
  }

  return clamp(offset, viewportSize - contentSize - PAN_OVERSCROLL, PAN_OVERSCROLL);
}

export const UTILITY_BUS_GEOMETRY = {
  width: UTILITY_LEFT_CLUSTER_WIDTH + CARD_W + 240,
  height: 500,
  titleY: 100,
  conductorLabelY: 108,
  lineTop: 280,
  lineBottom: 560,
  hSpacing: 25,
  annotationWidth: 44,
  feederLabelY: 216,
  feederRiserInset: 20,
} as const;

export function getUtilityBusLayout() {
  const width = UTILITY_BUS_GEOMETRY.width;
  const height = UTILITY_BUS_GEOMETRY.height;
  const count = CONDUCTORS.length;
  const totalHSpan = (count - 1) * UTILITY_BUS_GEOMETRY.hSpacing;
  const firstCX = UTILITY_LEFT_CLUSTER_WIDTH + CARD_W / 2 - totalHSpan / 2;
  const busCenterX = firstCX + totalHSpan / 2;
  const centerY = UTILITY_BUS_GEOMETRY.lineTop - 20;
  const lineBottom = UTILITY_BUS_GEOMETRY.lineBottom;
  const riserX = width - 2;
  const riserTapX = riserX - UTILITY_BUS_GEOMETRY.feederRiserInset;
  const feederLabelX = (busCenterX + riserX) / 2;

  return {
    width,
    height,
    count,
    totalHSpan,
    firstCX,
    busCenterX,
    centerY,
    lineBottom,
    riserX,
    riserTapX,
    feederLabelX,
  };
}

const TOP_ROW_FOCUS_WIDTH =
  UTILITY_BUS_GEOMETRY.width +
  UTILITY_TO_RISER_GAP +
  CARD_W +
  UTILITY_CARD_GAP +
  ISOLATED_SWITCHGEAR_CARD_WIDTH +
  CARD_W;

const TOP_ROW_FOCUS_HEIGHT = UTILITY_BUS_GEOMETRY.lineTop - 98 + CARD_W;
const GENERATOR_BRANCH_ROW_GAP = 28;
const GENERATOR_SECTION_FOCUS_HEIGHT = 4 * 74 + 24;

export function getUsefulDiagramBounds(): DiagramBounds {
  const x = 0;
  const y = 0;
  const width = TOP_ROW_FOCUS_WIDTH;
  const height = Math.max(
    TOP_ROW_FOCUS_HEIGHT,
    TOP_ROW_FOCUS_HEIGHT + GENERATOR_BRANCH_ROW_GAP + GENERATOR_SECTION_FOCUS_HEIGHT,
  );

  return {
    x,
    y,
    width,
    height,
  };
}
