import { Link } from "wouter";
import { Droplets, Zap } from "lucide-react";
import { LED } from "@/components/LED";
import { Panel } from "@/components/Panel";
import { GeneratorCard } from "@/features/simulation";
import { SYSTEM } from "@/config/system";
import { useTranslation } from "@/context/LanguageContext";
import type { GeneratorLiveStatus } from "@/context/GeneratorSimulationContext";

interface GeneratorUnitsPanelProps {
  t: ReturnType<typeof useTranslation>["t"];
  anyGenActive: boolean;
  availableGenCount: number;
  generatorStatuses: GeneratorLiveStatus[];
  start: (idx: number) => void;
  stop: (idx: number) => void;
}

export function GeneratorUnitsPanel({ t, anyGenActive, availableGenCount, generatorStatuses, start, stop }: GeneratorUnitsPanelProps) {
  return (
    <Panel title={`${t.generatorUnits} — ${SYSTEM.id}`} icon={<Droplets className="h-4 w-4" />} openUrl={import.meta.env.BASE_URL}>
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#1c2c40] bg-[#09111d] px-4 py-3">
        <div className="flex items-center gap-2">
          <LED on={anyGenActive} color={anyGenActive ? "amber" : "cyan"} />
          <span className="font-display text-xs uppercase tracking-[0.16em] text-[#7f93ac]">
            {anyGenActive ? t.generatorsAvailable(availableGenCount) : t.utilityActiveStandby}
          </span>
        </div>
        <Link href="/" className="ml-auto flex items-center gap-1.5 font-display text-xs tracking-[0.14em] text-[#00dcff] transition hover:text-white">
          <Zap className="h-3.5 w-3.5" /> {t.viewInOneLine}
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {SYSTEM.generators.map((gen, idx) => (
          <GeneratorCard
            key={gen.tag}
            genIdx={idx}
            status={generatorStatuses[idx]}
            onStart={() => start(idx)}
            onStop={() => stop(idx)}
            t={t}
          />
        ))}
      </div>
    </Panel>
  );
}
