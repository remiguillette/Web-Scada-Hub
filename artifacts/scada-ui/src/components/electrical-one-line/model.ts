import { SYSTEM } from '@/config/system';
import type { GeneratorLiveStatus } from '@/context/GeneratorSimulationContext';
import type { Translations } from '@/i18n/translations';
import { buildGeneratorDetails, buildUtilityDetails, type UtilityDetailInputs } from './details';
import type {
  AtsNodeModel,
  ElectricalDiagramModel,
  ElectricalState,
  ElectricalOneLineProps,
  GeneratorUnit,
  SupplementaryUtilityNodeModel,
  UtilityNodeModel,
} from './types';

const ACTIVE_GENERATOR_STATES = ['READY', 'LOADED', 'STABILIZING', 'STARTING'] as const;

function isGeneratorActive(live: GeneratorLiveStatus | undefined) {
  return live ? ACTIVE_GENERATOR_STATES.includes(live.state as (typeof ACTIVE_GENERATOR_STATES)[number]) : false;
}

export function buildElectricalState(inputs: Pick<ElectricalOneLineProps, 'voltage' | 'disconnectClosed' | 'breakerTripped'> & { genLive: boolean }): ElectricalState {
  const supplyLive = inputs.voltage > 0;
  const meterLive = supplyLive;
  const atsNormal = meterLive;
  const atsPowered = atsNormal || inputs.genLive;
  const genBrkLive = inputs.genLive;
  const mainPanelLive = inputs.disconnectClosed && !inputs.breakerTripped && atsPowered;
  const busLive = mainPanelLive;

  return { supplyLive, meterLive, genLive: inputs.genLive, atsNormal, atsPowered, genBrkLive, mainPanelLive, busLive };
}

export function buildUtilityNode(t: Translations, state: ElectricalState, inputs: UtilityDetailInputs): UtilityNodeModel {
  return {
    kind: 'source',
    tag: SYSTEM.utility.tag,
    title: t.utilityName,
    subtitle: SYSTEM.utility.provider,
    status: state.supplyLive ? t.energized : t.unavailable,
    active: state.supplyLive,
    accent: 'cyan',
    width: 340,
    details: buildUtilityDetails(t, inputs),
  };
}

export function buildSupplementaryUtilityNodes(state: ElectricalState): SupplementaryUtilityNodeModel[] {
  return [
    { kind: 'equipment', tag: 'UTIL-WTR', title: 'Water', status: 'Available', active: state.supplyLive, accent: 'cyan' },
    { kind: 'equipment', tag: 'UTIL-WW', title: 'Wastewater', status: 'Available', active: state.supplyLive, accent: 'cyan' },
    { kind: 'equipment', tag: 'UTIL-GAS', title: 'Gas', status: 'Available', active: state.supplyLive, accent: 'cyan' },
    { kind: 'equipment', tag: 'UTIL-TEL', title: 'Telecom', status: 'Available', active: state.supplyLive, accent: 'cyan' },
  ];
}

export function buildAtsNode(t: Translations, state: ElectricalState): AtsNodeModel {
  return {
    kind: 'ats',
    tag: 'ATS-001',
    title: 'ATS',
    status: state.atsNormal ? t.atsOnUtility : state.genLive ? t.atsOnEmergency : t.openNoSource,
    active: state.atsPowered,
    accent: state.atsNormal ? 'cyan' : state.genLive ? 'amber' : 'red',
    mode: state.atsNormal ? 'utility' : state.genLive ? 'generator' : 'offline',
  };
}

export function buildGeneratorUnits(
  t: Translations,
  generatorLiveStates: ElectricalOneLineProps['generatorLiveStates'],
): GeneratorUnit[] {
  return SYSTEM.generators.map((gen, idx) => {
    const live = generatorLiveStates?.[idx];
    const isActive = isGeneratorActive(live);

    return {
      tag: gen.tag,
      title: gen.name,
      status: live && live.state !== 'OFFLINE' ? live.phaseLabel : t.standbyOffline,
      active: isActive,
      width: 340,
      details: buildGeneratorDetails(t, gen, live, isActive),
    };
  });
}

export function buildElectricalModel(
  t: Translations,
  inputs: Pick<
    ElectricalOneLineProps,
    'activePower' | 'apparentPower' | 'breakerTripped' | 'current' | 'disconnectClosed' | 'frequency' | 'generatorLiveStates' | 'powerFactor' | 'reactivePower' | 'voltage'
  >,
): ElectricalDiagramModel {
  const genLive = inputs.generatorLiveStates?.some((live) => live.state === 'READY' || live.state === 'LOADED' || live.state === 'STABILIZING' || (live.state === 'STARTING' && live.voltage > 100)) ?? false;
  const state = buildElectricalState({
    voltage: inputs.voltage,
    disconnectClosed: inputs.disconnectClosed,
    breakerTripped: inputs.breakerTripped,
    genLive,
  });

  return {
    state,
    utilityNode: buildUtilityNode(t, state, {
      frequency: inputs.frequency ?? SYSTEM.utility.nominalFrequency,
      voltage: inputs.voltage,
      current: inputs.current,
      activePower: inputs.activePower ?? 0,
      apparentPower: inputs.apparentPower ?? 0,
      reactivePower: inputs.reactivePower ?? 0,
      powerFactor: inputs.powerFactor ?? 1,
    }),
    supplementaryUtilityNodes: buildSupplementaryUtilityNodes(state),
    atsNode: buildAtsNode(t, state),
    generatorUnits: buildGeneratorUnits(t, inputs.generatorLiveStates),
  };
}
