import type { CSSProperties, ReactNode } from 'react';
import type { GeneratorLiveStatus } from '@/context/GeneratorSimulationContext';
import type { StreetBusMetric } from '@/components/electrical-one-line/metrics';

export type Accent = 'green' | 'cyan' | 'red' | 'amber' | 'violet';

export type DetailRow = {
  parameter: string;
  value: string;
  description: string;
};

export type MiniStatus = {
  label: string;
  tag: string;
  status: string;
  active: boolean;
};

export type CompactCardProps = {
  tag: string;
  title: string;
  subtitle?: string;
  status: string;
  active: boolean;
  accent: Accent;
  icon?: ReactNode;
  onClick?: () => void;
  width?: number;
  details?: DetailRow[];
  statusDot?: boolean;
  miniStatuses?: MiniStatus[];
  cardStyle?: CSSProperties;
};

export type BaseNode = CompactCardProps & {
  kind: 'source' | 'equipment' | 'ats';
};

export type SourceNode = BaseNode & { kind: 'source' };
export type EquipmentNode = BaseNode & { kind: 'equipment' };
export type ATSNode = BaseNode & {
  kind: 'ats';
  mode: 'utility' | 'generator' | 'offline';
};

export type BusNode = {
  kind: 'bus';
  active: boolean;
};

export type GeneratorUnit = {
  tag: string;
  title: string;
  status: string;
  active: boolean;
  width?: number;
  details?: DetailRow[];
};

export type DragState = {
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
};

export type PinchState = {
  pointerIds: [number, number];
  startDistance: number;
  startZoom: number;
  midpointX: number;
  midpointY: number;
  contentX: number;
  contentY: number;
};

export interface ElectricalOneLineProps {
  disconnectClosed: boolean;
  breakerTripped: boolean;
  feederContactor: boolean;
  solenoidContactor: boolean;
  motorPowered: boolean;
  gateOpen: boolean;
  voltage: number;
  current: number;
  frequency?: number;
  powerFactor?: number;
  activePower?: number;
  reactivePower?: number;
  apparentPower?: number;
  generatorLiveStates?: GeneratorLiveStatus[];
  onToggleDisconnect: () => void;
  onToggleBreaker: () => void;
}

export type BeaverWoodsMtCardProps = {
  active: boolean;
  frequency: number;
  generatorLiveStates?: GeneratorLiveStatus[];
  conductorMetrics: StreetBusMetric[];
};
