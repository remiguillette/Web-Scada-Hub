import { useMemo } from "react";
import { Link } from "wouter";
import { Activity, ArrowLeft, Gauge, Zap, Radio, TrendingUp, AlertTriangle, CheckCircle2, Cpu } from "lucide-react";
import { Panel } from "@/components/Panel";
import { LED } from "@/components/LED";
import { useGridSimulationContext } from "@/context/GridSimulationContext";
import { useScadaState } from "@/hooks/use-scada-state";
import { useElectricalMetrics } from "@/hooks/use-electrical-metrics";
import { SYSTEM } from "@/config/system";
import { cn } from "@/lib/utils";

function buildSparklinePath(values: number[], width: number, height: number, padding = 4): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStep = (width - padding * 2) / (values.length - 1);
  const points = values.map((v, i) => {
    const x = padding + i * xStep;
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M ${points.join(" L ")}`;
}

function Sparkline({ values, color, width = 260, height = 60 }: { values: number[]; color: string; width?: number; height?: number }) {
  const path = useMemo(() => buildSparklinePath(values, width, height), [values, width, height]);
  const gradId = `grad-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {path && (
        <>
          <path d={`${path} L ${width - 4},${height} L 4,${height} Z`} fill={`url(#${gradId})`} />
          <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function StatusBadge({ ok, okLabel, faultLabel }: { ok: boolean; okLabel: string; faultLabel: string }) {
  return (
    <span className={cn(
      "flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] tracking-[0.16em]",
      ok ? "border-[#00f7a1]/30 bg-[#00f7a1]/10 text-[#00f7a1]" : "border-[#ff4d5a]/30 bg-[#ff4d5a]/10 text-[#ff4d5a]"
    )}>
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {ok ? okLabel : faultLabel}
    </span>
  );
}

interface MetricCardProps {
  label: string; value: string; unit: string; nominal: string; deviation: string;
  toleranceBand: string; inBand: boolean; icon: React.ReactNode; color: "cyan" | "green";
  sparkValues: number[]; sparkColor: string;
}

function MetricCard({ label, value, unit, nominal, deviation, toleranceBand, inBand, icon, color, sparkValues, sparkColor }: MetricCardProps) {
  const colorMap = {
    cyan: { border: "border-[#2a3a3a]", bg: "from-[#141a1a] to-[#1a2222]", text: "text-[#dff8ff]", accent: "text-[#00dcff]" },
    green: { border: "border-[#1a3a28]", bg: "from-[#0e160e] to-[#121a12]", text: "text-[#e8fff4]", accent: "text-[#00f7a1]" },
  };
  const c = colorMap[color];
  return (
    <div className={cn("rounded-2xl border bg-gradient-to-br p-4 flex flex-col gap-3", c.border, c.bg, c.text)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={c.accent}>{icon}</span>
          <span className="font-display text-xs uppercase tracking-[0.18em] text-[#8ca5bf]">{label}</span>
        </div>
        <StatusBadge ok={inBand} okLabel="IN BAND" faultLabel="OUT OF BAND" />
      </div>
      <div className="flex items-end gap-2">
        <span className="font-mono text-5xl font-semibold tracking-[0.06em]">{value}</span>
        <span className="pb-1 font-mono text-sm text-[#8ca5bf]">{unit}</span>
      </div>
      <div className="h-[60px] overflow-hidden rounded-lg">
        <Sparkline values={sparkValues} color={sparkColor} />
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#1c2c40] bg-[#09111d] p-3">
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">Nominal</div>
          <div className="font-mono text-sm text-[#b8c6d9]">{nominal} {unit}</div>
        </div>
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">Deviation</div>
          <div className={cn("font-mono text-sm", inBand ? "text-[#00f7a1]" : "text-[#ff4d5a]")}>{deviation} {unit}</div>
        </div>
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">Band (±)</div>
          <div className="font-mono text-sm text-[#b8c6d9]">{toleranceBand} {unit}</div>
        </div>
      </div>
    </div>
  );
}

interface ElecDataCardProps {
  tag: string;
  title: string;
  subtitle?: string;
  status: string;
  energized: boolean;
  rows: { parameter: string; value: string; description: string }[];
}

function ElecDataCard({ tag, title, subtitle, status, energized, rows }: ElecDataCardProps) {
  return (
    <div className={cn(
      "rounded-2xl border p-4",
      energized
        ? "border-[#00dcff]/30 bg-gradient-to-br from-[#0d1a1e] to-[#0a1318]"
        : "border-[#2a2a2a] bg-[#111]"
    )}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-[#5a7a8a]">{tag}</div>
          <div className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-white">{title}</div>
          {subtitle && <div className="mt-0.5 font-mono text-[11px] tracking-[0.1em] text-[#6a8a9f]">{subtitle}</div>}
          <div className={cn(
            "mt-1.5 inline-block rounded border px-2 py-0.5 font-mono text-[10px] tracking-[0.18em]",
            energized
              ? "border-[#00f7a1]/30 bg-[#00f7a1]/10 text-[#00f7a1]"
              : "border-[#334155]/60 bg-[#1a1a1a] text-[#475569]"
          )}>
            {status}
          </div>
        </div>
        <Zap className={cn("h-5 w-5 shrink-0", energized ? "text-[#00dcff]" : "text-[#334155]")} />
      </div>

      <div className="overflow-hidden rounded-xl border border-white/8">
        <table className="w-full border-collapse text-left font-mono text-[11px]">
          <thead className="bg-white/5 text-[#7f93ac]">
            <tr>
              <th className="px-3 py-2 font-medium tracking-[0.1em]">Parameter</th>
              <th className="px-3 py-2 font-medium tracking-[0.1em]">Value</th>
              <th className="hidden px-3 py-2 font-medium tracking-[0.1em] sm:table-cell">Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.parameter} className="border-t border-white/6 align-top transition-colors hover:bg-white/3">
                <td className="px-3 py-2 text-[#cfd8e3]">{row.parameter}</td>
                <td className={cn("px-3 py-2 font-semibold", energized ? "text-[#8ecae6]" : "text-[#475569]")}>{row.value}</td>
                <td className="hidden px-3 py-2 text-[#6a8a9f] sm:table-cell">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SimulationPage() {
  const { voltage, frequency, history, form, config, setForm, applyConfig } = useGridSimulationContext();
  const { state } = useScadaState();
  const { powerFactor, activePower, reactivePower, apparentPower } = useElectricalMetrics(
    voltage,
    state.current,
    state.motorPowered,
  );

  const voltageMin = config.baseVoltage * (1 - config.voltageVariationPct);
  const voltageMax = config.baseVoltage * (1 + config.voltageVariationPct);
  const voltageInBand = voltage >= voltageMin && voltage <= voltageMax;
  const voltageDeviation = (voltage - config.baseVoltage).toFixed(2);
  const voltageBand = (config.baseVoltage * config.voltageVariationPct).toFixed(2);

  const freqMin = config.baseFrequency - config.frequencyVariation;
  const freqMax = config.baseFrequency + config.frequencyVariation;
  const freqInBand = frequency >= freqMin && frequency <= freqMax;
  const freqDeviation = (frequency - config.baseFrequency).toFixed(3);

  const voltageHistory = useMemo(() => history.map((r) => r.voltage), [history]);
  const freqHistory = useMemo(() => history.map((r) => r.frequency), [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyConfig();
  };

  const gridDetails = useMemo(() => [
    { label: "Nominal Voltage", value: `${config.baseVoltage.toFixed(1)} V` },
    { label: "Live Voltage", value: `${voltage.toFixed(2)} V` },
    { label: "Min Allowed", value: `${voltageMin.toFixed(2)} V` },
    { label: "Max Allowed", value: `${voltageMax.toFixed(2)} V` },
    { label: "Voltage Deviation", value: `${Number(voltageDeviation) >= 0 ? "+" : ""}${voltageDeviation} V` },
    { label: "Voltage Tolerance", value: `±${(config.voltageVariationPct * 100).toFixed(1)} %` },
    { label: "Nominal Frequency", value: `${config.baseFrequency.toFixed(2)} Hz` },
    { label: "Live Frequency", value: `${frequency.toFixed(3)} Hz` },
    { label: "Freq Min", value: `${freqMin.toFixed(3)} Hz` },
    { label: "Freq Max", value: `${freqMax.toFixed(3)} Hz` },
    { label: "Freq Deviation", value: `${Number(freqDeviation) >= 0 ? "+" : ""}${freqDeviation} Hz` },
    { label: "Freq Band (±)", value: `${config.frequencyVariation.toFixed(3)} Hz` },
    { label: "Sample Interval", value: `${config.updateIntervalMs ?? 1000} ms` },
    { label: "History Samples", value: `${history.length}` },
    { label: "Voltage Status", value: voltageInBand ? "IN BAND" : "OUT OF BAND" },
    { label: "Freq Status", value: freqInBand ? "IN BAND" : "OUT OF BAND" },
  ], [config, voltage, frequency, voltageMin, voltageMax, voltageDeviation, freqMin, freqMax, freqDeviation, voltageInBand, freqInBand, history.length]);

  const isPowered = state.isPowered;

  const utilityRows = useMemo(() => [
    { parameter: "Frequency", value: `${frequency.toFixed(2)} Hz`, description: "Grid stability indicator." },
    { parameter: "Voltage", value: `${voltage.toFixed(1)} V`, description: `Supply at MCC bus (nominal ${SYSTEM.utility.nominalVoltage} V).` },
    { parameter: "Current", value: `${state.current.toFixed(2)} A`, description: "Total load current drawn from supply." },
    { parameter: "Active Power", value: `${activePower.toFixed(1)} W`, description: "Real power consumed by load." },
    { parameter: "Apparent Power", value: `${apparentPower.toFixed(1)} VA`, description: "Total VA demand on the supply." },
    { parameter: "Reactive Power", value: `${reactivePower.toFixed(1)} VAR`, description: "Reactive component — inductive motor load." },
    { parameter: "Power Factor", value: `${state.motorPowered ? powerFactor.toFixed(3) : "1.000"} cos\u03C6`, description: `Motor nominal PF: ${SYSTEM.motor.powerFactor}.` },
  ], [frequency, voltage, state.current, state.motorPowered, activePower, apparentPower, reactivePower, powerFactor]);

  const motorRows = useMemo(() => [
    { parameter: "Frequency", value: `${frequency.toFixed(2)} Hz`, description: `Supply frequency (nominal ${SYSTEM.motor.nominalFrequency} Hz).` },
    { parameter: "Voltage", value: `${state.motorPowered ? voltage.toFixed(1) : "0.0"} V`, description: `Motor terminal voltage (nominal ${SYSTEM.motor.nominalVoltage} V).` },
    { parameter: "Current", value: `${state.current.toFixed(2)} A`, description: state.motorPowered ? "Running load current." : "Motor stopped — zero current." },
    { parameter: "Active Power", value: `${activePower.toFixed(1)} W`, description: "Mechanical shaft power output." },
    { parameter: "Reactive Power", value: `${reactivePower.toFixed(1)} VAR`, description: "Magnetising reactive demand." },
    { parameter: "Power Factor", value: `${state.motorPowered ? powerFactor.toFixed(3) : "—"} cos\u03C6`, description: `Nominal ${SYSTEM.motor.powerFactor} at full load.` },
  ], [frequency, voltage, state.motorPowered, state.current, activePower, reactivePower, powerFactor]);

  return (
    <div className="min-h-screen bg-[#141414] text-[#d6deea]">
      <header className="sticky top-0 z-20 border-b border-[#2a2a2a] bg-[#0d0d0d]/95 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <a className="flex items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 font-display text-xs tracking-[0.16em] text-[#7f93ac] transition hover:border-[#00f7a1]/30 hover:text-[#00f7a1]">
                <ArrowLeft className="h-3.5 w-3.5" /> DASHBOARD
              </a>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1f8a61]/40 bg-[#161c18]">
              <Radio className="h-5 w-5 text-[#00f7a1]" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold tracking-[0.18em] text-white">GRID SIMULATION</h1>
              <div className="mt-0.5 font-mono text-xs tracking-[0.16em] text-[#8a9a8a]">
                {SYSTEM.id} / POWER QUALITY ANALYZER
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-[#1c2c40] bg-[#09111d] px-4 py-2">
              <LED on={voltageInBand && freqInBand} color={voltageInBand && freqInBand ? "green" : "red"} />
              <span className="font-mono text-xs tracking-[0.16em] text-[#9fb0c7]">
                {voltageInBand && freqInBand ? "GRID NOMINAL" : "GRID ANOMALY"}
              </span>
            </div>
            <a
              href={`${import.meta.env.BASE_URL}electrical-one-line`}
              className="flex items-center gap-2 rounded-xl border border-[#00f7a1]/30 bg-[#00f7a1]/8 px-3 py-2 font-display text-xs tracking-[0.16em] text-[#00f7a1] transition hover:bg-[#00f7a1]/15"
            >
              <Zap className="h-3.5 w-3.5" /> ELECTRICAL ONE-LINE
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-5 p-5">
        <div className="grid gap-5 xl:grid-cols-2">
          <MetricCard
            label="Supply Voltage"
            value={voltage.toFixed(2)}
            unit="V"
            nominal={config.baseVoltage.toFixed(1)}
            deviation={`${Number(voltageDeviation) >= 0 ? "+" : ""}${voltageDeviation}`}
            toleranceBand={voltageBand}
            inBand={voltageInBand}
            icon={<Zap className="h-5 w-5" />}
            color="cyan"
            sparkValues={voltageHistory}
            sparkColor="#00dcff"
          />
          <MetricCard
            label="Grid Frequency"
            value={frequency.toFixed(3)}
            unit="Hz"
            nominal={config.baseFrequency.toFixed(2)}
            deviation={`${Number(freqDeviation) >= 0 ? "+" : ""}${freqDeviation}`}
            toleranceBand={config.frequencyVariation.toFixed(3)}
            inBand={freqInBand}
            icon={<Activity className="h-5 w-5" />}
            color="green"
            sparkValues={freqHistory}
            sparkColor="#00f7a1"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ElecDataCard
            tag={SYSTEM.utility.tag}
            title={SYSTEM.utility.name}
            subtitle={SYSTEM.utility.provider}
            status={isPowered ? "ENERGIZED" : "UNAVAILABLE"}
            energized={isPowered}
            rows={utilityRows}
          />
          <ElecDataCard
            tag={SYSTEM.motor.tag}
            title={SYSTEM.motor.name}
            subtitle={`${SYSTEM.id} / ${SYSTEM.mcc}`}
            status={state.motorPowered ? "RUNNING" : state.isPowered ? "STANDBY" : "OFFLINE"}
            energized={state.motorPowered}
            rows={motorRows}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_1.5fr]">
          <Panel title="Simulation Configuration" icon={<Gauge className="h-4 w-4" />}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">
                    Base Voltage (V)
                  </span>
                  <input
                    type="number" min="1" step="0.1"
                    value={form.baseVoltage}
                    onChange={(e) => setForm((p) => ({ ...p, baseVoltage: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-[#243245] bg-[#060d16] px-3 py-2 font-mono text-sm text-[#e7edf6] outline-none transition focus:border-[#00dcff]/60"
                  />
                </label>
                <label className="space-y-2">
                  <span className="block font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">
                    Base Frequency (Hz)
                  </span>
                  <input
                    type="number" min="1" step="0.001"
                    value={form.baseFrequency}
                    onChange={(e) => setForm((p) => ({ ...p, baseFrequency: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-[#243245] bg-[#060d16] px-3 py-2 font-mono text-sm text-[#e7edf6] outline-none transition focus:border-[#00dcff]/60"
                  />
                </label>
                <label className="space-y-2">
                  <span className="block font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">
                    Voltage Tolerance (%)
                  </span>
                  <input
                    type="number" min="0" step="0.1"
                    value={form.voltageTolerancePct}
                    onChange={(e) => setForm((p) => ({ ...p, voltageTolerancePct: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-[#243245] bg-[#060d16] px-3 py-2 font-mono text-sm text-[#e7edf6] outline-none transition focus:border-[#00dcff]/60"
                  />
                </label>
                <label className="space-y-2">
                  <span className="block font-display text-xs uppercase tracking-[0.18em] text-[#7f93ac]">
                    Frequency Band (±Hz)
                  </span>
                  <input
                    type="number" min="0" step="0.001"
                    value={form.frequencyVariation}
                    onChange={(e) => setForm((p) => ({ ...p, frequencyVariation: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-[#243245] bg-[#060d16] px-3 py-2 font-mono text-sm text-[#e7edf6] outline-none transition focus:border-[#00dcff]/60"
                  />
                </label>
              </div>
              <div className="flex flex-col gap-3 border-t border-[#142030] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-mono text-xs leading-5 tracking-[0.06em] text-[#6a8a9f]">
                  Random-walk bounded drift model. Changes apply on next simulation tick.
                </p>
                <button
                  type="submit"
                  className="shrink-0 rounded-xl border border-[#00dcff]/45 bg-[#062032] px-5 py-2 font-display text-sm tracking-[0.14em] text-[#c4f5ff] transition hover:bg-[#0b2c45]"
                >
                  APPLY SIMULATION
                </button>
              </div>
            </form>
          </Panel>

          <Panel title="Grid Details" icon={<TrendingUp className="h-4 w-4" />}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {gridDetails.map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-[#1c2c40] bg-[#09111d] px-3 py-2">
                  <div className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a7a8a]">{label}</div>
                  <div className={cn(
                    "mt-0.5 font-mono text-sm tracking-[0.1em]",
                    label.includes("Status")
                      ? value.includes("IN BAND") ? "text-[#00f7a1]" : "text-[#ff4d5a]"
                      : label.includes("Deviation")
                        ? value.startsWith("+") ? "text-[#00dcff]" : "text-[#ffb347]"
                        : "text-[#b8c6d9]"
                  )}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={`Generator Units — ${SYSTEM.id}`} icon={<Cpu className="h-4 w-4" />}>
          <div className="grid gap-4 md:grid-cols-3">
            {SYSTEM.generators.map((gen) => (
              <ElecDataCard
                key={gen.tag}
                tag={gen.tag}
                title={gen.name}
                status="STANDBY / OFFLINE"
                energized={false}
                rows={[
                  { parameter: "Frequency", value: `${gen.nominalFrequency.toFixed(2)} Hz`, description: "Output frequency when synchronized." },
                  { parameter: "Voltage", value: `${gen.nominalVoltage} V`, description: "Nominal terminal voltage." },
                  { parameter: "Current", value: "0 A", description: "Per-phase current while offline." },
                  { parameter: "Real Power", value: "0 W", description: "Active power to bus." },
                  { parameter: "Reactive Power", value: "0 VAR", description: "Reactive support available." },
                  { parameter: "Fuel Level", value: `${gen.fuelLevel}%`, description: "Runtime capacity for standby." },
                ]}
              />
            ))}
          </div>
        </Panel>
      </main>
    </div>
  );
}
