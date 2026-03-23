import type { WorldAnchor, WorldConnectorPath } from "./world-model";

type ConnectorBundleRouteStyle = "intake" | "busTap";

type ConnectorBundleBaseParams = {
  id: string;
  laneCount: number;
  laneSpacing: number;
};

type IntakeConnectorBundleParams = ConnectorBundleBaseParams & {
  route: "intake";
  source: WorldAnchor;
  destination: WorldAnchor;
  breakoutLength: number;
  transitionLength: number;
  destinationLeadLength: number;
};

type BusTapConnectorBundleParams = ConnectorBundleBaseParams & {
  route: "busTap";
  sourceX: number;
  sourceTopY: number;
  sourceBottomY: number;
  destinationX: number;
  destinationY: number;
};

export type ConnectorBundleParams =
  | IntakeConnectorBundleParams
  | BusTapConnectorBundleParams;

function getLaneOffset(index: number, laneCount: number, laneSpacing: number) {
  return (index - (laneCount - 1) / 2) * laneSpacing;
}

function buildIntakeConnectorBundle(
  params: IntakeConnectorBundleParams,
): WorldConnectorPath[] {
  const {
    id,
    laneCount,
    laneSpacing,
    source,
    destination,
    breakoutLength,
    transitionLength,
    destinationLeadLength,
  } = params;

  return Array.from({ length: laneCount }, (_, index) => {
    const laneOffset = getLaneOffset(index, laneCount, laneSpacing);
    const startY = source.y + laneOffset;
    const destinationY = destination.y + laneOffset;
    const breakoutX = source.x + breakoutLength;
    const transitionX = breakoutX + transitionLength;
    const destinationLeadStartX = destination.x - destinationLeadLength;

    return {
      id: `${id}.${index}`,
      points: [
        { x: source.x, y: startY },
        { x: breakoutX, y: startY },
        { x: transitionX, y: destinationY },
        { x: destinationLeadStartX, y: destinationY },
        { x: destination.x, y: destinationY },
      ],
    };
  });
}

function buildBusTapConnectorBundle(
  params: BusTapConnectorBundleParams,
): WorldConnectorPath[] {
  const {
    id,
    laneCount,
    laneSpacing,
    sourceX,
    sourceTopY,
    sourceBottomY,
    destinationX,
    destinationY,
  } = params;

  return Array.from({ length: laneCount }, (_, index) => {
    const laneOffset = getLaneOffset(index, laneCount, laneSpacing);
    const tapY = destinationY + laneOffset;

    return {
      id: `${id}.${index}`,
      points: [
        { x: sourceX, y: sourceTopY },
        { x: sourceX, y: sourceBottomY },
        { x: sourceX, y: tapY },
        { x: destinationX, y: tapY },
        { x: destinationX, y: destinationY },
      ],
    };
  });
}

export function buildParallelConnectorBundle(
  params: ConnectorBundleParams,
): WorldConnectorPath[] {
  switch (params.route) {
    case "intake":
      return buildIntakeConnectorBundle(params);
    case "busTap":
      return buildBusTapConnectorBundle(params);
    default: {
      const _exhaustive: never = params;
      return _exhaustive;
    }
  }
}

export type { ConnectorBundleRouteStyle };
