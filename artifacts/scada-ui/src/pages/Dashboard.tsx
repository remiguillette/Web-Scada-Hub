import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  Cat,
  CircuitBoard,
  Clock3,
  Database,
  Gauge,
  Languages,
  Power,
  Radio,
  ShieldAlert,
  Siren,
  Zap,
} from "lucide-react";
import { ElectricalOneLine } from "@/components/ElectricalOneLine";
import { LED } from "@/components/LED";
import { Panel } from "@/components/Panel";
import { useGridSimulationContext } from "@/context/GridSimulationContext";
import { useGeneratorSimulationContext } from "@/context/GeneratorSimulationContext";
import { useElectricalMetrics } from "@/hooks/use-electrical-metrics";
import { useScadaState, type Alarm, type SystemState } from "@/hooks/use-scada-state";
import { useTranslation } from "@/context/LanguageContext";
import { SYSTEM } from "@/config/system";
import { cn } from "@/lib/utils";

const STATE_STYLE: Record<SystemState, string> = {
  RUN: "border-[#5aa784]/60 text-[#8bd6b6]",
  STANDBY: "border-[#d89a5a]/60 text-[#eed6a2]",
  STOP: "border-[#334155] text-[#94a3b8]",
  FAULT: "border-[#d5565a]/70 text-[#e8a8aa]",
};

const ALARM_STYLE: Record<Alarm["type"], string> = {
  CRITICAL: "border-[#d5565a]/30 bg-[#2a1012] text-[#f3c5c9]",
  WARNING: "border-[#d89a5a]/30 bg-[#2b1a0f] text-[#f6deb1]",
  INFO: "border-[#6cc2d5]/20 bg-[#0a2228] text-[#b8dbe3]",
};

function formatUptime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function ValueCard({ title, value, unit, icon, accent = "cyan" }: { title: string; value: string; unit?: string; icon: React.ReactNode; accent?: "cyan" | "green" | "amber" | "red"; }) {
  const accents = {
    cyan: "border-[#2a3a3a] from-[#141a1a] to-[#1a2222] text-[#dff8ff]",
    green: "border-[#1a3a28] from-[#0e160e] to-[#121a12] text-[#e8fff4]",
    amber: "border-[#3a2a10] from-[#181208] to-[#1c160a] text-[#fff1d6]",
    red: "border-[#3a1a20] from-[#16090d] to-[#1c0c11] text-[#ffe0e4]",
  };

  return (
    <div className={cn("rounded-2xl border bg-gradient-to-br p-4", accents[accent])}>
      <div className="mb-5 flex items-center justify-between">
        <div className="font-display text-xs uppercase tracking-[0.18em] text-[#8ca5bf]">{title}</div>
        <div className="text-[#00f7a1]">{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <div className="font-mono text-4xl font-semibold tracking-[0.08em]">{value}</div>
        {unit ? <div className="pb-1 font-mono text-sm text-[#8ca5bf]">{unit}</div> : null}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state, actions } = useScadaState();
  const { voltage: simulatedVoltage, frequency, setGridEnabled } = useGridSimulationContext();
  const { statuses: generatorLiveStates } = useGeneratorSimulationContext();
  const { powerFactor, activePower, reactivePower, apparentPower } = useElectricalMetrics(
    simulatedVoltage,
    state.current,
    state.motorPowered,
  );
  const { t, locale, toggleLocale } = useTranslation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeAlarms = useMemo(() => state.alarms.filter((alarm) => alarm.active).length, [state.alarms]);
  const countdownMs = Math.max(0, state.nextFeedingTime.getTime() - now.getTime());
  const countdown = `${String(Math.floor(countdownMs / 60000)).padStart(2, "0")}:${String(Math.floor((countdownMs % 60000) / 1000)).padStart(2, "0")}`;

  const synopsis = state.isFault
    ? t.synopsisFault
    : state.feedActive
      ? t.synopsisFeedActive
      : state.isPowered
        ? t.synopsisPowered
        : t.synopsisUnpowered;

  return (
    <div className="min-h-screen bg-[#141414] text-[#d6deea]">
      <header className="sticky top-0 z-20 border-b border-[#2a2a2a] bg-[#0d0d0d]/95 backdrop-blur px-6 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#4f8f6f]/40 bg-[#1b2320]">
              <Cat className="h-6 w-6 text-[#82b8a1]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-semibold tracking-[0.18em] text-white">{SYSTEM.id}</h1>
                <span className="rounded-md border border-[#333333] bg-[#1e1e1e] px-3 py-1 font-mono text-xs tracking-[0.18em] text-[#9aaa9a]">{t.systemDescription}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm tracking-[0.16em] text-[#8a9a8a]">
                <span>{t.uptime}: {formatUptime(state.uptime)}</span>
                <span>{t.node}: {SYSTEM.node}</span>
                <span>{t.time}: {format(now, "yyyy-MM-dd HH:mm:ss")}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className={cn("rounded-2xl border bg-[#1a1a1a] px-4 py-3", STATE_STYLE[state.systemState])}>
                <div className="mb-1 font-display text-[11px] uppercase tracking-[0.2em] text-[#8a9a8a]">{t.overallStatus}</div>
                <div className="flex items-center gap-2 font-display text-xl tracking-[0.15em]">
                  <LED on={state.systemState === "RUN"} color={state.systemState === "FAULT" ? "red" : state.systemState === "STANDBY" ? "amber" : "green"} size="md" />
                  {state.systemState}
                </div>
              </div>
              <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3">
                <div className="mb-1 font-display text-[11px] uppercase tracking-[0.2em] text-[#8a9a8a]">{t.activeAlarms}</div>
                <div className={cn("flex items-center gap-2 font-display text-xl tracking-[0.15em]", activeAlarms > 0 ? "text-[#ff4d5a]" : "text-[#00f7a1]") }>
                  <AlertTriangle className="h-5 w-5" /> {activeAlarms}
                </div>
              </div>
              <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3">
                <div className="mb-1 font-display text-[11px] uppercase tracking-[0.2em] text-[#8a9a8a]">{t.mode}</div>
                <div className="font-display text-xl tracking-[0.15em] text-[#b0d4b0]">{state.systemMode}</div>
              </div>
              <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3">
                <div className="mb-1 font-display text-[11px] uppercase tracking-[0.2em] text-[#8a9a8a]">{t.nextAutoFeed}</div>
                <div className="font-mono text-2xl tracking-[0.12em] text-[#e0ece0]">{countdown}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleLocale}
              aria-label={locale === "en" ? "Passer au français" : "Switch to English"}
              className="flex items-center gap-1.5 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 font-mono text-xs tracking-[0.16em] text-[#7f93ac] transition hover:border-[#00f7a1]/30 hover:text-[#00f7a1] shrink-0"
            >
              <Languages className="h-4 w-4" />
              <span>{locale === "en" ? "FR" : "EN"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1700px] grid-cols-1 gap-5 p-5 2xl:grid-cols-[1.15fr_1.45fr]">
        <div className="space-y-5 min-w-0">
          <Panel
            title={t.electricalOneLine}
            icon={<Zap className="h-4 w-4" />}
            openUrl={`${import.meta.env.BASE_URL}electrical-one-line`}
          >
            <ElectricalOneLine
              disconnectClosed={state.disconnectClosed}
              breakerTripped={state.breakerTripped}
              feederContactor={state.feederContactor}
              solenoidContactor={state.solenoidContactor}
              motorPowered={state.motorPowered}
              gateOpen={state.gateOpen}
              voltage={simulatedVoltage}
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
                  setGridEnabled(false);
                } else if (!state.breakerTripped) {
                  setGridEnabled(true);
                }
              }}
              onToggleBreaker={() => {
                if (state.breakerTripped) {
                  actions.resetBreaker();
                  if (state.disconnectClosed) setGridEnabled(true);
                } else {
                  actions.tripBreaker();
                  setGridEnabled(false);
                }
              }}
            />
          </Panel>

          <Panel title={t.commandSafetyControls} icon={<Power className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {[
                { label: state.feedActive ? t.feedCycleActive : t.startFeedCycle, onClick: actions.triggerFeed, style: "border-[#00f7a1]/45 text-[#00f7a1] hover:bg-[#00f7a1]/10" },
                { label: t.refillHopper, onClick: actions.refillHopper, style: "border-[#00dcff]/45 text-[#00dcff] hover:bg-[#00dcff]/10" },
                { label: state.estopPressed ? t.resetEstop : t.emergencyStop, onClick: state.estopPressed ? actions.resetEstop : actions.pressEstop, style: state.estopPressed ? "border-[#ffb347]/45 text-[#ffb347] hover:bg-[#ffb347]/10" : "border-[#ff4d5a]/45 text-[#ff4d5a] hover:bg-[#ff4d5a]/10" },
                { label: t.removeBowl, onClick: actions.removeBowl, style: "border-[#334155] text-[#9fb0c7] hover:bg-[#111827]" },
                { label: t.restoreBowl, onClick: actions.restoreBowl, style: "border-[#334155] text-[#9fb0c7] hover:bg-[#111827]" },
                { label: t.emptyBowl, onClick: actions.clearBowl, style: "border-[#334155] text-[#9fb0c7] hover:bg-[#111827]" },
              ].map((button) => (
                <button
                  key={button.label}
                  type="button"
                  onClick={button.onClick}
                  className={cn("rounded-xl border bg-[#0a121f] px-4 py-3 text-left font-display text-sm tracking-[0.14em] transition", button.style)}
                >
                  {button.label}
                </button>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title={t.plcStatus} icon={<CircuitBoard className="h-4 w-4" />}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1c2c40] bg-[#09111d] px-4 py-3">
              <div>
                <div className="font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">{t.controllerHealth}</div>
                <div className="mt-1 font-mono text-sm tracking-[0.16em] text-[#cfe6f4]">{t.controllerHealthStatus}</div>
              </div>
              <div className="flex items-center gap-5 rounded-xl border border-[#243245] bg-[#060d16] px-4 py-3">
                <LED on={state.systemState === "RUN"} color="green" label="RUN" />
                <LED on={state.systemState === "STANDBY" || state.systemState === "STOP"} color="amber" label="STOP" />
                <LED on={state.systemState === "FAULT"} color="red" label="FLT" />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-[#1c2c40] bg-[#09111d] p-4">
                <div className="mb-4 font-display text-sm uppercase tracking-[0.16em] text-[#cfd8e3]">{t.discreteInputs}</div>
                <div className="space-y-3">
                  {state.digitalInputs.map((point) => (
                    <div key={point.id} className="flex items-center gap-3 rounded-lg border border-[#142030] bg-[#07101a] px-3 py-2">
                      <LED on={point.on} color={point.id === "DI-04" && point.on ? "amber" : point.id === "DI-06" && !point.on ? "red" : "green"} />
                      <span className="font-mono text-sm tracking-[0.14em] text-[#9fb0c7]">{point.id}</span>
                      <span className="font-display text-sm tracking-[0.08em] text-[#d6deea]">{point.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#1c2c40] bg-[#09111d] p-4">
                <div className="mb-4 font-display text-sm uppercase tracking-[0.16em] text-[#cfd8e3]">{t.discreteOutputs}</div>
                <div className="space-y-3">
                  {state.digitalOutputs.map((point) => (
                    <div key={point.id} className="flex items-center gap-3 rounded-lg border border-[#142030] bg-[#07101a] px-3 py-2">
                      <LED on={point.on} color={point.id === "DO-04" ? "red" : point.id === "DO-03" ? "cyan" : "green"} />
                      <span className="font-mono text-sm tracking-[0.14em] text-[#9fb0c7]">{point.id}</span>
                      <span className="font-display text-sm tracking-[0.08em] text-[#d6deea]">{point.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title={t.realTimeProcess} icon={<Database className="h-4 w-4" />}
            openUrl={`${import.meta.env.BASE_URL}simulation`}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ValueCard title={t.supplyVoltage} value={simulatedVoltage.toFixed(2)} unit="V" icon={<Zap className="h-5 w-5" />} accent={state.isPowered ? "cyan" : "red"} />
              <ValueCard title={t.gridFrequency} value={frequency.toFixed(3)} unit="Hz" icon={<Gauge className="h-5 w-5" />} accent={state.isPowered ? "green" : "red"} />
              <ValueCard title={t.motorCurrent} value={state.current.toFixed(2)} unit="A" icon={<Activity className="h-5 w-5" />} accent={state.motorPowered ? "green" : "cyan"} />
              <ValueCard title={t.hopperLevel} value={state.hopperLevel.toFixed(1)} unit="%" icon={<Gauge className="h-5 w-5" />} accent={state.hopperLow ? "amber" : "green"} />
              <ValueCard title={t.bowlLevelPortion} value={state.bowlLevel.toFixed(1)} unit="%" icon={<Database className="h-5 w-5" />} accent={state.bowlLevel <= 20 ? "amber" : "cyan"} />
              <ValueCard title={t.todaysFeeds} value={String(state.feedCount)} icon={<Clock3 className="h-5 w-5" />} accent="cyan" />
              <ValueCard title={t.systemMode} value={state.systemMode} icon={<ShieldAlert className="h-5 w-5" />} accent={state.systemMode === "LOCKOUT" ? "red" : state.systemMode === "AUTO" ? "green" : "amber"} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#1c2c40] bg-[#09111d] p-4">
                <div className="mb-2 font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">{t.lastFeedTime}</div>
                <div className="font-mono text-lg tracking-[0.14em] text-[#e7edf6]">{state.lastFeedTime ? format(state.lastFeedTime, "yyyy-MM-dd HH:mm:ss") : "--"}</div>
              </div>
              <div className="rounded-2xl border border-[#1c2c40] bg-[#09111d] p-4">
                <div className="mb-2 font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">{t.processSynopsis}</div>
                <div className="font-mono text-sm leading-6 tracking-[0.08em] text-[#b8c6d9]">
                  {synopsis}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <a
                href={`${import.meta.env.BASE_URL}simulation`}
                className="flex items-center gap-2 rounded-xl border border-[#00dcff]/30 bg-[#062032] px-4 py-2.5 font-display text-xs tracking-[0.16em] text-[#00dcff] transition hover:bg-[#0b2c45] w-fit"
              >
                <Radio className="h-3.5 w-3.5" />
                {t.openGridSimulation}
              </a>
            </div>
          </Panel>

          <Panel title={t.alarmsEvents} icon={<Siren className="h-4 w-4" />}>
            <div className="space-y-3">
              {state.alarms.map((alarm) => (
                <div key={alarm.id} className={cn("rounded-2xl border p-3", ALARM_STYLE[alarm.type], alarm.active && alarm.type === "CRITICAL" ? "alarm-blink" : "") }>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <LED on color={alarm.type === "CRITICAL" ? "red" : alarm.type === "WARNING" ? "amber" : "cyan"} />
                      <div>
                        <div className="font-display text-sm uppercase tracking-[0.12em]">{alarm.message}</div>
                        <div className="mt-1 font-mono text-xs tracking-[0.14em] text-[#93a6bf]">{format(alarm.timestamp, "yyyy-MM-dd HH:mm:ss")}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md border border-current/20 px-2 py-1 font-mono text-[11px] tracking-[0.18em]">{alarm.type}</span>
                      <span className={cn("rounded-md px-2 py-1 font-mono text-[11px] tracking-[0.18em]", alarm.active ? "bg-[#ffffff14] text-white" : "bg-[#00000026] text-[#9fb0c7]")}>{alarm.active ? t.alarmActive : t.alarmEvent}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}
