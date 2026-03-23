import { format } from "date-fns";
import { Siren } from "lucide-react";
import { LED } from "@/components/LED";
import { Panel } from "@/components/Panel";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/LanguageContext";
import type { Alarm } from "@/hooks/use-scada-state";

const ALARM_STYLE: Record<Alarm["type"], string> = {
  CRITICAL: "border-[#d5565a]/30 bg-[#2a1012] text-[#f3c5c9]",
  WARNING: "border-[#d89a5a]/30 bg-[#2b1a0f] text-[#f6deb1]",
  INFO: "border-[#6cc2d5]/20 bg-[#0a2228] text-[#b8dbe3]",
};

interface AlarmEventsPanelProps {
  t: ReturnType<typeof useTranslation>["t"];
  alarms: Alarm[];
}

export function AlarmEventsPanel({ t, alarms }: AlarmEventsPanelProps) {
  return (
    <Panel title={t.alarmsEvents} icon={<Siren className="h-4 w-4" />}>
      <div className="space-y-3">
        {alarms.map((alarm) => (
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
  );
}
