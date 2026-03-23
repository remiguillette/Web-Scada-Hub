import type { FormEvent } from "react";
import { Gauge, TrendingUp } from "lucide-react";
import { Panel } from "@/components/Panel";
import type { GridFormField } from "@/features/simulation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/LanguageContext";
import type { GridFormValues } from "@/context/GridSimulationContext";

interface SimulationSettingsSectionProps {
  t: ReturnType<typeof useTranslation>["t"];
  form: GridFormValues;
  formFields: GridFormField[];
  gridDetails: Array<{ label: string; value: string }>;
  onSubmit: (event: FormEvent) => void;
  setForm: (updater: (prev: GridFormValues) => GridFormValues) => void;
}

export function SimulationSettingsSection({ t, form, formFields, gridDetails, onSubmit, setForm }: SimulationSettingsSectionProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.5fr]">
      <Panel title={t.simulationConfig} icon={<Gauge className="h-4 w-4" />}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {formFields.map(({ label, key, step, min, max }) => (
              <label key={key} className="space-y-2">
                <span className="block font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">{label}</span>
                <input
                  type="number"
                  min={min}
                  step={step}
                  max={max}
                  value={form[key]}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      [key]: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-[#243245] bg-[#060d16] px-3 py-2 font-mono text-sm text-[#e7edf6] outline-none transition focus:border-[#00dcff]/60"
                />
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-[#142030] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-xs leading-5 tracking-[0.06em] text-[#6a8a9f]">{t.randomWalkDesc}</p>
            <button
              type="submit"
              className="shrink-0 rounded-xl border border-[#00dcff]/45 bg-[#062032] px-5 py-2 font-display text-sm tracking-[0.14em] text-[#c4f5ff] transition hover:bg-[#0b2c45]"
            >
              {t.applySimulation}
            </button>
          </div>
        </form>
      </Panel>

      <Panel title={t.gridDetails} icon={<TrendingUp className="h-4 w-4" />}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {gridDetails.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-[#1c2c40] bg-[#09111d] px-3 py-2">
              <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{label}</div>
              <div
                className={cn(
                  "mt-0.5 font-mono text-sm tracking-[0.1em]",
                  label === t.voltageStatus || label === t.freqStatus
                    ? value === t.inBand
                      ? "text-[#00f7a1]"
                      : "text-[#ff4d5a]"
                    : label === t.voltageDeviation || label === t.freqDeviation
                      ? value.startsWith("+")
                        ? "text-[#00dcff]"
                        : "text-[#ffb347]"
                      : "text-[#b8c6d9]",
                )}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
