import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  Cat,
  CircuitBoard,
  Clock3,
  Languages,
  Power,
  ShieldAlert,
  Siren,
} from "lucide-react";
import { DomainNavigation } from "@/components/DomainNavigation";
import { LED } from "@/components/LED";
import { Panel } from "@/components/Panel";
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

export default function PowerOverviewPage() {
  const { state, actions } = useScadaState();
  const { t, locale, toggleLocale } = useTranslation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeAlarms = useMemo(() => state.alarms.filter((alarm) => alarm.active).length, [state.alarms]);
  const countdownMs = Math.max(0, state.nextFeedingTime.getTime() - now.getTime());
  const countdown = `${String(Math.floor(countdownMs / 60000)).padStart(2, "0")}:${String(Math.floor((countdownMs % 60000) / 1000)).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-[#141414] text-[#d6deea]">
      <header className="sticky top-0 z-20 border-b border-[#2a2a2a] bg-[#0d0d0d]/95 px-6 py-4 backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#4f8f6f]/40 bg-[#1b2320]">
              <Cat className="h-6 w-6 text-[#82b8a1]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-semibold tracking-[0.18em] text-white">{t.scadaOverviewTitle}</h1>
                <span className="rounded-md border border-[#333333] bg-[#1e1e1e] px-3 py-1 font-mono text-xs tracking-[0.18em] text-[#9aaa9a]">
                  {SYSTEM.id} · {t.powerDomainLabel}
                </span>
              </div>
              <div className="mt-2 max-w-3xl font-mono text-sm leading-6 tracking-[0.08em] text-[#8a9a8a]">
                {t.scadaOverviewDesc}
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
              className="shrink-0 flex items-center gap-1.5 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 font-mono text-xs tracking-[0.16em] text-[#7f93ac] transition hover:border-[#00f7a1]/30 hover:text-[#00f7a1]"
            >
              <Languages className="h-4 w-4" />
              <span>{locale === "en" ? "FR" : "EN"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1700px] grid-cols-1 gap-5 p-5 2xl:grid-cols-[1.05fr_1.35fr]">
        <div className="space-y-5 min-w-0">
          <Panel title={t.domainNavigationTitle} icon={<Power className="h-4 w-4" />}>
            <div className="space-y-4">
              <div className="font-mono text-sm leading-6 tracking-[0.08em] text-[#a8bdd4]">{t.domainNavigationDesc}</div>
              <DomainNavigation currentPath="/" />
            </div>
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

          <Panel title={t.powerOverviewSummaryTitle} icon={<Clock3 className="h-4 w-4" />}>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-[#243245] bg-[#09111d] p-4">
                <div className="font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">{t.powerOneLineNav}</div>
                <div className="mt-2 font-mono text-sm leading-6 text-[#cfe6f4]">{t.powerOverviewOneLineSummary}</div>
              </div>
              <div className="rounded-2xl border border-[#243245] bg-[#09111d] p-4">
                <div className="font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">{t.powerSourceNav}</div>
                <div className="mt-2 font-mono text-sm leading-6 text-[#cfe6f4]">{t.powerOverviewSourceSummary}</div>
              </div>
              <div className="rounded-2xl border border-[#243245] bg-[#09111d] p-4">
                <div className="font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">{t.plcStatus}</div>
                <div className="mt-2 font-mono text-sm leading-6 text-[#cfe6f4]">{t.powerOverviewPlcSummary}</div>
              </div>
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}
