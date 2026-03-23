import { CARD_W, PAN_OVERSCROLL, UTILITY_LEFT_CLUSTER_WIDTH } from './constants';
import type { WorldObject } from './world-model';
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

export function getBoundsForWorldObjects(worldObjects: readonly WorldObject[]): DiagramBounds {
  if (!worldObjects.length) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...worldObjects.map((object) => object.x));
  const minY = Math.min(...worldObjects.map((object) => object.y));
  const maxX = Math.max(...worldObjects.map((object) => object.x + object.width));
  const maxY = Math.max(...worldObjects.map((object) => object.y + object.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getUsefulBoundsForWorldObjects(worldObjects: readonly WorldObject[]): DiagramBounds {
  const usefulWorldObjects = worldObjects.filter((object) => object.layer !== 'background');

  return getBoundsForWorldObjects(usefulWorldObjects);
}
