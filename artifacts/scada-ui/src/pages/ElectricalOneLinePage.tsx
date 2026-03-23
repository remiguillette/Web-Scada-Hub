import { useEffect } from "react";
import { Languages, Zap } from "lucide-react";
import { ElectricalOneLine } from "@/components/ElectricalOneLine";
import { OneLineHeaderRouteAction } from "@/features/navigation/components/OneLineHeaderRouteAction";
import { useScadaState } from "@/hooks/use-scada-state";
import { useGridSimulationContext } from "@/context/GridSimulationContext";
import { useGeneratorSimulationContext } from "@/context/GeneratorSimulationContext";
import { useElectricalMetrics } from "@/hooks/use-electrical-metrics";
import { useTranslation } from "@/context/LanguageContext";
import { SYSTEM } from "@/config/system";
import { isKioskMode } from "@/config/ui";

export default function ElectricalOneLinePage() {
  useEffect(() => {
    if (!isKioskMode) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const { state, actions } = useScadaState();
  const { voltage, frequency, requestGridConnection } = useGridSimulationContext();
  const { statuses: generatorLiveStates } = useGeneratorSimulationContext();
  const { powerFactor, activePower, reactivePower, apparentPower } = useElectricalMetrics(
    voltage,
    state.current,
    state.motorPowered,
  );
  const { t, locale, toggleLocale } = useTranslation();

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-hidden bg-[#0d0d0d] text-[#d6deea]">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#2a2a2a] bg-[#0a0a0a] shrink-0">
        <div className="w-[3px] h-5 rounded-sm bg-[#00f7a1]" />
        <Zap className="h-4 w-4 text-[#00f7a1] opacity-80" />
        <h1 className="font-display text-[11px] font-semibold tracking-[0.2em] text-[#00f7a1]">
          {t.electricalOneLineHeader}
        </h1>
        <span className="ml-2 font-mono text-[10px] tracking-widest text-[#4a6a5a]">
          {SYSTEM.id} / {SYSTEM.mcc}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <OneLineHeaderRouteAction
            href="/power"
            icon={<Zap className="h-3.5 w-3.5" />}
            label={t.gridDetailsButton}
            kioskMode={isKioskMode ? "hide" : "show"}
          />
          <button
            type="button"
            onClick={toggleLocale}
            aria-label={locale === "en" ? "Passer au français" : "Switch to English"}
            className="flex items-center gap-1.5 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 font-mono text-xs tracking-[0.16em] text-[#7f93ac] transition hover:border-[#00f7a1]/30 hover:text-[#00f7a1]"
          >
            <Languages className="h-3.5 w-3.5" />
            <span>{locale === "en" ? "FR" : "EN"}</span>
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
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
          onToggleDisconnect={() => {
            const nextDisconnect = !state.disconnectClosed;
            actions.toggleDisconnect();
            if (!nextDisconnect) {
              requestGridConnection(false);
            } else if (!state.breakerTripped) {
              requestGridConnection(true);
            }
          }}
          onToggleBreaker={() => {
            if (state.breakerTripped) {
              actions.resetBreaker();
            } else {
              actions.tripBreaker();
            }
          }}
        />
      </div>
    </div>
  );
}
