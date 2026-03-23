import { SYSTEM } from '@/config/system';
import {
  CARD_W,
  ISOLATED_SWITCHGEAR_CARD_WIDTH,
  SOURCE_COL_W,
  UTILITY_CARD_GAP,
  UTILITY_SUPPLEMENTARY_CARD_GAP,
  UTILITY_TO_RISER_GAP,
} from './constants';
import { UTILITY_BUS_GEOMETRY } from './geometry';

export type WorldDomain = 'power' | 'water' | 'gas' | 'telecom' | 'shared';
export type WorldLayer = 'background' | 'conductors' | 'equipment' | 'annotations';

export type WorldAnchor = {
  x: number;
  y: number;
};

export type WorldObject = {
  id: string;
  domain: WorldDomain;
  layer: WorldLayer;
  x: number;
  y: number;
  width: number;
  height: number;
  anchors?: Record<string, WorldAnchor>;
};

const TOP_ROW_CARD_Y = UTILITY_BUS_GEOMETRY.lineTop - 98;
const NODE_CARD_HEIGHT = CARD_W;
const TOP_ROW_SECTION_HEIGHT = UTILITY_BUS_GEOMETRY.height;
const GENERATOR_SECTION_Y = TOP_ROW_SECTION_HEIGHT + 28;
const GENERATOR_ROW_HEIGHT = 74;
const GENERATOR_DIVIDER_HEIGHT_PADDING = 24;
const GENERATOR_DIVIDER_X = 486;
const GENERATOR_DIVIDER_WIDTH = 17;
const GENERATOR_COLUMN_X = GENERATOR_DIVIDER_X + GENERATOR_DIVIDER_WIDTH;
const GENERATOR_BREAKER_X =
  UTILITY_BUS_GEOMETRY.width +
  UTILITY_TO_RISER_GAP +
  CARD_W +
  UTILITY_CARD_GAP +
  ISOLATED_SWITCHGEAR_CARD_WIDTH;

const SUPPLEMENTARY_UTILITY_OBJECTS: Array<Pick<WorldObject, 'id' | 'domain'>> = [
  { id: 'utility.water', domain: 'water' },
  { id: 'utility.wastewater', domain: 'water' },
  { id: 'utility.gas', domain: 'gas' },
  { id: 'utility.telecom', domain: 'telecom' },
];

/**
 * Phase 1 world mapping for the current one-line scene.
 *
 * This is intentionally data-only:
 * - it mirrors the existing JSX layout
 * - it uses the same spacing and geometry constants
 * - it does not change rendering or viewport behavior
 */
export function buildElectricalOneLineWorldObjects(): WorldObject[] {
  const utilityBusX = 0;
  const utilityBusY = 0;
  const utilityBusWidth = UTILITY_BUS_GEOMETRY.width;
  const utilityBusHeight = UTILITY_BUS_GEOMETRY.height;

  const utilitySupplementaryObjects = SUPPLEMENTARY_UTILITY_OBJECTS.map((object, index) => ({
    id: object.id,
    domain: object.domain,
    layer: 'equipment' as const,
    x: utilityBusX + index * (CARD_W + UTILITY_SUPPLEMENTARY_CARD_GAP),
    y: TOP_ROW_CARD_Y,
    width: CARD_W,
    height: NODE_CARD_HEIGHT,
  }));

  const utilitySourceX = utilityBusX + SUPPLEMENTARY_UTILITY_OBJECTS.length * (CARD_W + UTILITY_SUPPLEMENTARY_CARD_GAP);
  const riserPoleX = utilityBusX + utilityBusWidth + UTILITY_TO_RISER_GAP;
  const beaverWoodsMtX = riserPoleX + CARD_W + UTILITY_CARD_GAP;
  const atsX = beaverWoodsMtX + ISOLATED_SWITCHGEAR_CARD_WIDTH;
  const utilityInterconnectWidth = CARD_W * 2 + UTILITY_CARD_GAP;
  const atsCenterX = atsX + CARD_W / 2;
  const generatorBranchWireX = GENERATOR_COLUMN_X + SOURCE_COL_W;
  const generatorBranchWireWidth = Math.max(0, atsCenterX - generatorBranchWireX);
  const generatorDividerHeight = SYSTEM.generators.length * GENERATOR_ROW_HEIGHT + GENERATOR_DIVIDER_HEIGHT_PADDING;

  return [
    {
      id: 'power.utility-bus.background',
      domain: 'power',
      layer: 'background',
      x: utilityBusX,
      y: utilityBusY,
      width: utilityBusWidth,
      height: utilityBusHeight,
    },
    {
      id: 'power.utility-bus.conductors',
      domain: 'power',
      layer: 'conductors',
      x: utilityBusX,
      y: utilityBusY,
      width: utilityBusWidth,
      height: utilityBusHeight,
    },
    {
      id: 'power.utility-bus.annotations',
      domain: 'power',
      layer: 'annotations',
      x: utilityBusX,
      y: utilityBusY,
      width: utilityBusWidth,
      height: utilityBusHeight,
    },
    ...utilitySupplementaryObjects,
    {
      id: 'power.utility.source',
      domain: 'power',
      layer: 'equipment',
      x: utilitySourceX,
      y: TOP_ROW_CARD_Y,
      width: CARD_W,
      height: NODE_CARD_HEIGHT,
    },
    {
      id: 'power.utility.interconnect',
      domain: 'power',
      layer: 'conductors',
      x: riserPoleX,
      y: TOP_ROW_CARD_Y,
      width: utilityInterconnectWidth,
      height: NODE_CARD_HEIGHT,
    },
    {
      id: 'power.riser-pole.0326',
      domain: 'power',
      layer: 'equipment',
      x: riserPoleX,
      y: TOP_ROW_CARD_Y,
      width: CARD_W,
      height: NODE_CARD_HEIGHT,
    },
    {
      id: 'power.beaver-woods-mt',
      domain: 'power',
      layer: 'equipment',
      x: beaverWoodsMtX,
      y: TOP_ROW_CARD_Y,
      width: ISOLATED_SWITCHGEAR_CARD_WIDTH,
      height: NODE_CARD_HEIGHT,
    },
    {
      id: 'power.ats.001',
      domain: 'power',
      layer: 'equipment',
      x: atsX,
      y: TOP_ROW_CARD_Y,
      width: CARD_W,
      height: NODE_CARD_HEIGHT,
      anchors: {
        generatorIn: { x: atsX + CARD_W / 2, y: TOP_ROW_CARD_Y + NODE_CARD_HEIGHT },
      },
    },
    {
      id: 'power.campus.divider',
      domain: 'power',
      layer: 'annotations',
      x: GENERATOR_DIVIDER_X,
      y: GENERATOR_SECTION_Y,
      width: GENERATOR_DIVIDER_WIDTH,
      height: generatorDividerHeight,
    },
    ...SYSTEM.generators.map((generator, index) => ({
      id: `power.generator.${generator.tag.toLowerCase()}`,
      domain: 'power' as const,
      layer: 'equipment' as const,
      x: GENERATOR_COLUMN_X,
      y: GENERATOR_SECTION_Y + index * GENERATOR_ROW_HEIGHT,
      width: CARD_W,
      height: NODE_CARD_HEIGHT,
      anchors: {
        output: { x: GENERATOR_COLUMN_X + CARD_W, y: GENERATOR_SECTION_Y + index * GENERATOR_ROW_HEIGHT + NODE_CARD_HEIGHT / 2 },
      },
    })),
    {
      id: 'power.generator.branch',
      domain: 'power',
      layer: 'conductors',
      x: generatorBranchWireX,
      y: GENERATOR_SECTION_Y,
      width: generatorBranchWireWidth,
      height: SYSTEM.generators.length * GENERATOR_ROW_HEIGHT,
      anchors: {
        start: { x: generatorBranchWireX, y: GENERATOR_SECTION_Y + NODE_CARD_HEIGHT / 2 },
        layoutOffsetStart: { x: 59, y: GENERATOR_SECTION_Y },
      },
    },
    {
      id: 'power.breaker.cb-gen',
      domain: 'power',
      layer: 'equipment',
      x: GENERATOR_BREAKER_X,
      y: GENERATOR_SECTION_Y,
      width: CARD_W,
      height: NODE_CARD_HEIGHT,
      anchors: {
        input: { x: GENERATOR_BREAKER_X, y: GENERATOR_SECTION_Y + NODE_CARD_HEIGHT / 2 },
      },
    },
  ];
}

function getWorldObjectAnchor(worldObject: WorldObject, anchorName: string): WorldAnchor | null {
  return worldObject.anchors?.[anchorName] ?? null;
}

export function getElectricalOneLineGeneratorPathLayout(worldObjects: readonly WorldObject[]) {
  const worldObjectMap = new Map(worldObjects.map((worldObject) => [worldObject.id, worldObject]));
  const atsWorldObject = worldObjectMap.get('power.ats.001');
  const generatorBranchWorldObject = worldObjectMap.get('power.generator.branch');

  const atsGeneratorIn = atsWorldObject ? getWorldObjectAnchor(atsWorldObject, 'generatorIn') : null;
  const generatorBranchStart = generatorBranchWorldObject ? getWorldObjectAnchor(generatorBranchWorldObject, 'start') : null;
  const generatorBranchLayoutOffsetStart = generatorBranchWorldObject ? getWorldObjectAnchor(generatorBranchWorldObject, 'layoutOffsetStart') : null;

  return {
    generatorBranchWireWidth:
      atsGeneratorIn && generatorBranchStart
        ? Math.max(0, atsGeneratorIn.x - generatorBranchStart.x)
        : 0,
    generatorBranchVerticalOffset:
      atsGeneratorIn && generatorBranchLayoutOffsetStart
        ? Math.max(0, atsGeneratorIn.x - generatorBranchLayoutOffsetStart.x)
        : 0,
  };
}
