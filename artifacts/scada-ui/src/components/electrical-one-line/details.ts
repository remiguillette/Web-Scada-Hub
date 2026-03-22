import { buildUtilitySnapshot } from '@/lib/utility-service';
import { SYSTEM } from '@/config/system';
import type { GeneratorLiveStatus } from '@/context/GeneratorSimulationContext';
import type { Translations } from '@/i18n/translations';
import type { DetailRow } from './types';

export type UtilityDetailInputs = {
  frequency: number;
  voltage: number;
  current: number;
  activePower: number;
  apparentPower: number;
  reactivePower: number;
  powerFactor: number;
};

export function buildUtilityDetails(t: Translations, inputs: UtilityDetailInputs): DetailRow[] {
  const snapshot = buildUtilitySnapshot({
    energized: inputs.voltage > 0,
    frequency: inputs.frequency,
    current: inputs.current,
    activePower: inputs.activePower,
    apparentPower: inputs.apparentPower,
    reactivePower: inputs.reactivePower,
    powerFactor: inputs.powerFactor,
  });

  return [
    { parameter: t.utility.details.serviceType.label, value: snapshot.serviceType, description: t.utility.details.serviceType.desc },
    { parameter: t.utility.details.utilityType.label, value: snapshot.utilityType, description: t.utility.details.utilityType.desc },
    { parameter: t.utility.details.frequency.label, value: `${inputs.frequency.toFixed(2)} Hz`, description: t.utility.details.frequency.desc },
    { parameter: t.utility.details.voltageLL.label, value: `${snapshot.lineToLineVoltage.toFixed(1)} V`, description: t.utility.details.voltageLL.desc },
    { parameter: t.utility.details.voltageLN.label, value: `${snapshot.lineToNeutralVoltage.toFixed(1)} V`, description: t.utility.details.voltageLN.desc },
    { parameter: t.utility.details.current.label, value: `${snapshot.totalServiceCurrent.toFixed(1)} A`, description: t.utility.details.current.desc },
    { parameter: t.utility.details.activePower.label, value: `${snapshot.activePowerKw.toFixed(1)} kW`, description: t.utility.details.activePower.desc },
    { parameter: t.utility.details.apparentPower.label, value: `${snapshot.apparentPowerKva.toFixed(1)} kVA`, description: t.utility.details.apparentPower.desc },
    { parameter: t.utility.details.reactivePower.label, value: `${snapshot.reactivePowerKvar.toFixed(1)} kVAR`, description: t.utility.details.reactivePower.desc },
    { parameter: t.utility.details.powerFactor.label, value: `${snapshot.powerFactor.toFixed(3)} ${snapshot.powerFactorState}`, description: t.utility.details.powerFactor.desc },
    { parameter: t.utility.details.phaseBalance.label, value: `${snapshot.voltageImbalancePct.toFixed(1)}%`, description: t.utility.details.phaseBalance.desc },
    { parameter: t.utility.details.source.label, value: snapshot.source, description: t.utility.details.source.desc },
  ];
}

export function buildGeneratorDetails(
  t: Translations,
  gen: (typeof SYSTEM.generators)[number],
  live: GeneratorLiveStatus | undefined,
  isActive: boolean,
): DetailRow[] {
  return [
    {
      parameter: t.frequency,
      value: live && live.state !== 'OFFLINE' ? `${live.frequency.toFixed(2)} Hz` : `${gen.nominalFrequency.toFixed(2)} Hz`,
      description: isActive ? t.genLiveFreqDesc : t.genNominalFreqDesc,
    },
    {
      parameter: t.voltage,
      value: live && live.state !== 'OFFLINE' ? `${live.voltage.toFixed(1)} V` : `${gen.nominalVoltage} V`,
      description: isActive ? t.genLiveVoltageDesc : t.genNominalVoltageDescOneline,
    },
    {
      parameter: t.current,
      value: live ? `${live.current.toFixed(2)} A` : '0 A',
      description: isActive ? t.genLiveCurrentDesc : t.genOfflineCurrentDesc,
    },
    {
      parameter: t.activePower,
      value: live ? `${live.activePower.toFixed(1)} W` : '0 W',
      description: isActive ? t.genEmergencyPowerDescOneline : t.genActivePowerRunning,
    },
    {
      parameter: t.reactivePower,
      value: live ? `${live.reactivePower.toFixed(1)} VAR` : '0 VAR',
      description: t.genReactiveDescFull,
    },
    {
      parameter: t.fuelLevel,
      value: `${gen.fuelLevel}%`,
      description: t.genFuelDescFull,
    },
  ];
}
