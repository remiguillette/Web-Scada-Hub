import { Zap } from "lucide-react";
import { ElectricalOneLine } from "@/components/ElectricalOneLine";
import { useScadaState } from "@/hooks/use-scada-state";
import { useGridSimulationContext } from "@/context/GridSimulationContext";
import { useGeneratorSimulationContext } from "@/context/GeneratorSimulationContext";
import { useElectricalMetrics } from "@/hooks/use-electrical-metrics";
import { SYSTEM } from "@/config/system";

export default function ElectricalOneLinePage() {
  const { state, actions } = useScadaState();
  const { voltage, frequency } = useGridSimulationContext();
  const { statuses: generatorLiveStates } = useGeneratorSimulationContext();
  const { powerFactor, activePower, reactivePower, apparentPower } = useElectricalMetrics(
    voltage,
    state.current,
    state.motorPowered,
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0d] text-[#d6deea]">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#2a2a2a] bg-[#0a0a0a] shrink-0">
        <div className="w-[3px] h-5 rounded-sm bg-[#00f7a1]" />
        <Zap className="h-4 w-4 text-[#00f7a1] opacity-80" />
        <h1 className="font-display text-[11px] font-semibold tracking-[0.2em] text-[#00f7a1]">
          ELECTRICAL ONE-LINE
        </h1>
        <span className="ml-2 font-mono text-[10px] tracking-widest text-[#4a6a5a]">
          {SYSTEM.id} / {SYSTEM.mcc}
        </span>
      </div>
      <div className="flex-1 p-4 min-h-0">
        <ElectricalOneLine
          disconnectClosed={state.disconnectClosed}
          breakerTripped={state.breakerTripped}
          feederContactor={state.feederContactor}
          solenoidContactor={state.solenoidContactor}
          motorPowered={state.motorPowered}
          gateOpen={state.gateOpen}
          voltage={voltage}
          current={state.current}
          frequency={frequency}
          powerFactor={powerFactor}
          activePower={activePower}
          reactivePower={reactivePower}
          apparentPower={apparentPower}
          generatorLiveStates={generatorLiveStates}
          onToggleDisconnect={actions.toggleDisconnect}
          onToggleBreaker={state.breakerTripped ? actions.resetBreaker : actions.tripBreaker}
        />
      </div>
    </div>
  );
}
