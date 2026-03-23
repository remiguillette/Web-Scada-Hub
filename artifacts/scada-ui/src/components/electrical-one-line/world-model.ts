import { SYSTEM } from '@/config/system';
import {
  CARD_W,
  ISOLATED_SWITCHGEAR_CARD_WIDTH,
  SOURCE_COL_W,
  UTILITY_CARD_GAP,
  UTILITY_SUPPLEMENTARY_CARD_GAP,
  UTILITY_TO_RISER_GAP,
} from './constants';
import { getUtilityBusLayout, UTILITY_BUS_GEOMETRY } from './geometry';
import { CONDUCTORS } from './metrics';

export type WorldDomain = 'power' | 'water' | 'gas' | 'telecom' | 'shared';
export type WorldLayer = 'background' | 'conductors' | 'equipment' | 'annotations';

export type WorldAnchor = {
  x: number;
  y: number;
};

export type WorldConnectorPath = {
  id: string;
  points: WorldAnchor[];
};

export type WorldConnectorMarker = {
  id: string;
  point: WorldAnchor;
};

export type WorldAnnotationAnchor = {
  id: string;
  point: WorldAnchor;
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
const TOP_ROW_FEEDER_CENTER_Y = TOP_ROW_CARD_Y + 147;
const NODE_CARD_HEIGHT = 160; // Hauteur standard des cartes pour le calcul du centre
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

export function buildElectricalOneLineWorldObjects(): WorldObject[] {
  const utilityBusX = 0;
  const utilityBusY = 0;
  const utilityBusWidth = UTILITY_BUS_GEOMETRY.width;
  const utilityBusHeight = UTILITY_BUS_GEOMETRY.height;

  const { centerY } = getUtilityBusLayout();
  const TOP_ROW_CENTER_Y = utilityBusY + centerY;

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
      anchors: {
        left: { x: utilitySourceX, y: TOP_ROW_CENTER_Y },
        right: { x: utilitySourceX + CARD_W, y: TOP_ROW_CENTER_Y },
      },
    },
    {
      id: 'power.utility.interconnect',
      domain: 'power',
      layer: 'conductors',
      x: riserPoleX,
      y: TOP_ROW_CARD_Y,
      width: utilityInterconnectWidth,
      height: NODE_CARD_HEIGHT,
      anchors: {
        left: { x: riserPoleX, y: TOP_ROW_CENTER_Y },
        right: { x: riserPoleX + utilityInterconnectWidth, y: TOP_ROW_CENTER_Y },
      },
    },
    {
      id: 'power.riser-pole.0326',
      domain: 'power',
      layer: 'equipment',
      x: riserPoleX,
      y: TOP_ROW_CARD_Y,
      width: CARD_W,
      height: NODE_CARD_HEIGHT,
      anchors: {
        left: { x: riserPoleX, y: TOP_ROW_CENTER_Y },
        right: { x: riserPoleX + CARD_W, y: TOP_ROW_FEEDER_CENTER_Y },
      },
    },
    {
      id: 'power.beaver-woods-mt',
      domain: 'power',
      layer: 'equipment',
      x: beaverWoodsMtX,
      y: TOP_ROW_CARD_Y,
      width: ISOLATED_SWITCHGEAR_CARD_WIDTH,
      height: NODE_CARD_HEIGHT,
      anchors: {
        left: { x: beaverWoodsMtX, y: TOP_ROW_CENTER_Y },
        utilityIn: { x: beaverWoodsMtX, y: TOP_ROW_FEEDER_CENTER_Y },
        right: { x: beaverWoodsMtX + ISOLATED_SWITCHGEAR_CARD_WIDTH, y: TOP_ROW_CENTER_Y },
      },
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
        utilityIn: { x: atsX, y: TOP_ROW_CENTER_Y },
        generatorIn: { x: atsX + CARD_W / 2, y: TOP_ROW_CARD_Y + NODE_CARD_HEIGHT },
        output: { x: atsX + CARD_W, y: TOP_ROW_CENTER_Y },
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
        end: { x: generatorBranchWireX + generatorBranchWireWidth, y: GENERATOR_SECTION_Y + NODE_CARD_HEIGHT / 2 },
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
        output: { x: GENERATOR_BREAKER_X + CARD_W, y: GENERATOR_SECTION_Y + NODE_CARD_HEIGHT / 2 },
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

export function getElectricalOneLineUtilityBusGeometry(worldObjects: readonly WorldObject[]) {
  const worldObjectMap = new Map(worldObjects.map((worldObject) => [worldObject.id, worldObject]));
  const busWorldObject = worldObjectMap.get('power.utility-bus.conductors');

  if (!busWorldObject) {
    return { bounds: null, conductors: [] as Array<{ id: string; points: WorldAnchor[]; marker: WorldAnchor }> };
  }

  const { count, firstCX, centerY, lineBottom, riserX, riserTapX } = getUtilityBusLayout();

  return {
    bounds: busWorldObject,
    conductors: CONDUCTORS.map((conductor, index) => {
      const x = busWorldObject.x + firstCX + index * UTILITY_BUS_GEOMETRY.hSpacing;
      const tapY = busWorldObject.y + centerY + (index - (count - 1) / 2) * 12;

      return {
        id: `power.utility-bus.conductor.${conductor.label.toLowerCase()}`,
        points: [
          { x, y: busWorldObject.y + 155 },
          { x, y: busWorldObject.y + lineBottom },
          { x, y: tapY },
          { x: busWorldObject.x + riserTapX, y: tapY },
          { x: busWorldObject.x + riserX, y: busWorldObject.y + centerY },
        ],
        marker: { x, y: tapY },
      };
    }),
  };
}

export function getElectricalOneLineUtilityInterconnectGeometry(worldObjects: readonly WorldObject[]) {
  const worldObjectMap = new Map(worldObjects.map((worldObject) => [worldObject.id, worldObject]));
  const interconnectWorldObject = worldObjectMap.get('power.utility.interconnect');
  const riserPoleWorldObject = worldObjectMap.get('power.riser-pole.0326');
  const beaverWoodsWorldObject = worldObjectMap.get('power.beaver-woods-mt');

  if (!interconnectWorldObject || !riserPoleWorldObject || !beaverWoodsWorldObject) {
    return { bounds: null, markers: [] as WorldConnectorMarker[], paths: [] as WorldConnectorPath[] };
  }

  const riserPoleRight = getWorldObjectAnchor(riserPoleWorldObject, 'right');
  const beaverWoodsUtilityIn = getWorldObjectAnchor(beaverWoodsWorldObject, 'utilityIn') ?? getWorldObjectAnchor(beaverWoodsWorldObject, 'left');

  if (!riserPoleRight || !beaverWoodsUtilityIn) {
    return { bounds: interconnectWorldObject, markers: [] as WorldConnectorMarker[], paths: [] as WorldConnectorPath[] };
  }

  const breakoutLength = 24;
  const intakeTransitionLength = 24;
  const intakeRailLength = 12;

  return {
    bounds: interconnectWorldObject,
    markers: [
      { id: 'power.utility.interconnect.riser-pole', point: riserPoleRight },
      { id: 'power.utility.interconnect.beaver-woods', point: beaverWoodsUtilityIn },
    ],
    paths: CONDUCTORS.map((conductor, index) => {
      const offset = (index - (CONDUCTORS.length - 1) / 2) * 8;
      
      // Point de départ centré verticalement sur la carte, fanné immédiatement au bord
      const startY = riserPoleRight.y + offset;
      const beaverWoodsIntakeY = beaverWoodsUtilityIn.y + offset;
      
      const breakoutX = riserPoleRight.x + breakoutLength;
      const intakeTransitionX = breakoutX + intakeTransitionLength;
      const intakeRailStartX = beaverWoodsUtilityIn.x - intakeRailLength;

      return {
        id: `power.utility.interconnect.${conductor.label.toLowerCase()}`,
        points: [
          { x: riserPoleRight.x, y: startY }, 
          { x: breakoutX, y: startY },
          { x: intakeTransitionX, y: beaverWoodsIntakeY },
          { x: intakeRailStartX, y: beaverWoodsIntakeY },
          { x: beaverWoodsUtilityIn.x, y: beaverWoodsIntakeY },
        ],
      };
    }),
  };
}

export function getElectricalOneLineGeneratorBranchGeometry(worldObjects: readonly WorldObject[]) {
  const worldObjectMap = new Map(worldObjects.map((worldObject) => [worldObject.id, worldObject]));
  const branchWorldObject = worldObjectMap.get('power.generator.branch');
  const breakerWorldObject = worldObjectMap.get('power.breaker.cb-gen');
  const atsWorldObject = worldObjectMap.get('power.ats.001');
  const generatorWorldObjects = worldObjects.filter((worldObject) => worldObject.id.startsWith('power.generator.'));

  const branchStart = branchWorldObject ? getWorldObjectAnchor(branchWorldObject, 'start') : null;
  const branchEnd = branchWorldObject ? getWorldObjectAnchor(branchWorldObject, 'end') : null;
  const breakerInput = breakerWorldObject ? getWorldObjectAnchor(breakerWorldObject, 'input') : null;
  const atsGeneratorIn = atsWorldObject ? getWorldObjectAnchor(atsWorldObject, 'generatorIn') : null;

  return {
    bounds: branchWorldObject,
    generatorOutputs: generatorWorldObjects
      .map((worldObject) => getWorldObjectAnchor(worldObject, 'output'))
      .filter((anchor): anchor is WorldAnchor => Boolean(anchor)),
    branchStart,
    branchEnd,
    breakerInput,
    atsGeneratorIn,
  };
}

export function getElectricalOneLineUtilityBusAnnotationGeometry(worldObjects: readonly WorldObject[]) {
  const worldObjectMap = new Map(worldObjects.map((worldObject) => [worldObject.id, worldObject]));
  const annotationWorldObject = worldObjectMap.get('power.utility-bus.annotations');
  const utilityBusGeometry = getElectricalOneLineUtilityBusGeometry(worldObjects);
  const { busCenterX, feederLabelX } = getUtilityBusLayout();

  if (!annotationWorldObject) {
    return {
      bounds: null,
      streetLabel: null as WorldAnnotationAnchor | null,
      feederLabel: null as WorldAnnotationAnchor | null,
      conductorMetrics: [] as WorldAnnotationAnchor[],
    };
  }

  return {
    bounds: annotationWorldObject,
    streetLabel: {
      id: 'power.utility-bus.annotations.street-label',
      point: {
        x: annotationWorldObject.x + busCenterX,
        y: annotationWorldObject.y + UTILITY_BUS_GEOMETRY.titleY - 12,
      },
    },
    feederLabel: {
      id: 'power.utility-bus.annotations.feeder-label',
      point: {
        x: annotationWorldObject.x + feederLabelX,
        y: annotationWorldObject.y + UTILITY_BUS_GEOMETRY.feederLabelY,
      },
    },
    conductorMetrics: utilityBusGeometry.conductors.map((conductor, index) => ({
      id: `power.utility-bus.annotations.metric.${CONDUCTORS[index].label.toLowerCase()}`,
      point: {
        x: conductor.marker.x,
        y: annotationWorldObject.y + UTILITY_BUS_GEOMETRY.conductorLabelY + 6,
      },
    })),
  };
}