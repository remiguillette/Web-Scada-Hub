import { Factory, Languages, Zap } from "lucide-react";
import { LED } from "@/components/LED";
import { SYSTEM } from "@/config/system";
import { useTranslation } from "@/context/LanguageContext";
import { HeaderRouteAction } from "@/features/navigation/components/HeaderRouteAction";

interface SimulationPageHeaderProps {
  t: ReturnType<typeof useTranslation>["t"];
  locale: "en" | "fr";
  toggleLocale: () => void;
  statusNominal: boolean;
  anyGenActive: boolean;
}

export function SimulationPageHeader({
  t,
  locale,
  toggleLocale,
  statusNominal,
  anyGenActive,
}: SimulationPageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#2a2a2a] bg-[#0d0d0d]/95 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1f8a61]/40 bg-[#161c18]">
            <Factory className="h-5 w-5 text-[#00f7a1]" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-[0.18em] text-white">{t.gridSimulation}</h1>
            <div className="mt-0.5 font-mono text-xs tracking-[0.16em] text-[#8a9a8a]">
              {SYSTEM.id} / {t.teacherInterface}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#1c2c40] bg-[#09111d] px-4 py-2">
            <LED on={statusNominal} color={statusNominal ? "green" : "red"} />
            <span className="font-mono text-xs tracking-[0.16em] text-[#9fb0c7]">
              {statusNominal ? t.gridNominal : t.gridAnomaly}
            </span>
          </div>
          {anyGenActive && (
            <div className="flex items-center gap-2 rounded-xl border border-[#ffb347]/30 bg-[#ffb347]/8 px-4 py-2">
              <LED on color="amber" />
              <span className="font-mono text-xs tracking-[0.16em] text-[#ffb347]">{t.generatorActive}</span>
            </div>
          )}
          <HeaderRouteAction href="/" icon={<Zap className="h-3.5 w-3.5" />} label={t.electricalOneLineLink} />
          <button
            type="button"
            onClick={toggleLocale}
            aria-label={locale === "en" ? "Passer au français" : "Switch to English"}
            className="flex items-center gap-1.5 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 font-mono text-xs tracking-[0.16em] text-[#7f93ac] transition hover:border-[#00f7a1]/30 hover:text-[#00f7a1]"
          >
            <Languages className="h-4 w-4" />
            <span>{locale === "en" ? "FR" : "EN"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
