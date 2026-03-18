import type { ReactNode } from "react";
import { Power, ShieldAlert, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ElectricalOneLineProps {
  disconnectClosed: boolean;
  breakerTripped: boolean;
  feederContactor: boolean;
  solenoidContactor: boolean;
  motorPowered: boolean;
  gateOpen: boolean;
  voltage: number;
  current: number;
  onToggleDisconnect: () => void;
  onToggleBreaker: () => void;
}

function Wire({ powered, vertical = false, className }: { powered: boolean; vertical?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "transition-all duration-300 rounded-full",
        vertical ? "w-1.5" : "h-1.5",
        powered
          ? "bg-[#00f7a1] shadow-[0_0_16px_rgba(0,247,161,0.9)]"
          : "bg-[#1e293b]",
        className,
      )}
    />
  );
}

function EquipmentCard({
  tag,
  title,
  status,
  active,
  accent,
  icon,
  onClick,
  note,
}: {
  tag: string;
  title: string;
  status: string;
  active: boolean;
  accent: "green" | "cyan" | "red" | "amber";
  icon: ReactNode;
  onClick?: () => void;
  note?: string;
}) {
  const accentMap = {
    green: active ? "border-[#00f7a1] text-[#00f7a1] bg-[#0e1a10] shadow-[0_0_18px_rgba(0,247,161,0.22)]" : "border-[#333333] text-[#5a6a5a] bg-[#1a1a1a]",
    cyan: active ? "border-[#00dcff] text-[#b8f3ff] bg-[#0d1a1e] shadow-[0_0_18px_rgba(0,220,255,0.2)]" : "border-[#333333] text-[#5a6a5a] bg-[#1a1a1a]",
    red: active ? "border-[#ff4d5a] text-[#ffd8dc] bg-[#22070d] shadow-[0_0_18px_rgba(255,77,90,0.25)]" : "border-[#333333] text-[#5a6a5a] bg-[#1a1a1a]",
    amber: active ? "border-[#ffb347] text-[#ffe2af] bg-[#1e1206] shadow-[0_0_18px_rgba(255,179,71,0.22)]" : "border-[#333333] text-[#5a6a5a] bg-[#1a1a1a]",
  };

  const body = (
    <div className={cn("w-full rounded-2xl border px-4 py-3 transition-all duration-300", accentMap[accent])}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-[0.25em] text-[#70839f]">{tag}</div>
          <div className="font-display text-sm font-semibold uppercase tracking-[0.08em]">{title}</div>
        </div>
        <div className="mt-1">{icon}</div>
      </div>
      <div className="font-mono text-xs tracking-[0.15em]">{status}</div>
      {note ? <div className="mt-1 font-mono text-[10px] tracking-[0.16em] text-[#7c8ea8]">{note}</div> : null}
    </div>
  );

  if (!onClick) return body;

  return (
    <button type="button" onClick={onClick} className="w-full text-left transition-transform hover:scale-[1.01] active:scale-[0.99]">
      {body}
    </button>
  );
}

export function ElectricalOneLine(props: ElectricalOneLineProps) {
  const {
    disconnectClosed,
    breakerTripped,
    feederContactor,
    solenoidContactor,
    motorPowered,
    gateOpen,
    voltage,
    current,
    onToggleDisconnect,
    onToggleBreaker,
  } = props;

  const supplyLive = voltage > 0;
  const meterLive = supplyLive;
  const mainPanelLive = disconnectClosed && !breakerTripped && supplyLive;
  const busLive = mainPanelLive;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full flex-col items-center gap-2">
        <div className="mb-0.5 font-mono text-[9px] tracking-[0.22em] text-[#6b7a6b]">UTILITY CONDUCTORS</div>
        <div className="flex flex-wrap justify-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="h-10 w-2 rounded-full bg-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
            <span className="font-mono text-[8px] tracking-[0.18em] text-[#3b82f6]">L1 / BLUE</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-10 w-2 rounded-full bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.55)]" />
            <span className="font-mono text-[8px] tracking-[0.18em] text-[#f87171]">L2 / RED</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-10 w-2 rounded-full bg-[#e5e5e5] shadow-[0_0_8px_rgba(220,220,220,0.4)]" />
            <span className="font-mono text-[8px] tracking-[0.18em] text-[#c8c8c8]">N / WHITE</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-10 w-2 rounded-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="font-mono text-[8px] tracking-[0.18em] text-[#22c55e]">GND / GREEN</span>
          </div>
        </div>
        <div className="rounded-full border border-[#1f3b4d] bg-[#08131a] px-3 py-1 text-center font-mono text-[8px] tracking-[0.18em] text-[#8ecae6]">
          SIM: L1-N = 120V | L2-N = 120V | L1-L2 = 240V
        </div>
      </div>

      <EquipmentCard
        tag="UTILITY"
        title="HYDRO ONE ONTARIO"
        status={supplyLive ? "MAIN ENTRANCE ENERGIZED" : "SERVICE UNAVAILABLE"}
        active={supplyLive}
        accent="cyan"
        icon={<Zap className={cn("h-5 w-5", supplyLive ? "text-[#00dcff]" : "text-[#475569]")} />}
        note="PROPERTY MAIN ENTRANCE"
      />

      <Wire powered={supplyLive} vertical className="h-6" />

      <EquipmentCard
        tag="POLE-001"
        title="RISER POLE"
        status={supplyLive ? "4.8 KV PRIMARY AVAILABLE" : "PRIMARY DE-ENERGIZED"}
        active={supplyLive}
        accent="cyan"
        icon={<Power className={cn("h-5 w-5", supplyLive ? "text-[#00dcff]" : "text-[#475569]")} />}
        note="PRIMARY OVERHEAD DISTRIBUTION"
      />

      <Wire powered={supplyLive} vertical className="h-6" />

      <EquipmentCard
        tag="CB-UTIL"
        title="POLE CIRCUIT BREAKER"
        status={supplyLive ? "CLOSED / UTILITY NORMAL" : "OPEN / NO SOURCE"}
        active={supplyLive}
        accent={supplyLive ? "green" : "amber"}
        icon={<ShieldAlert className={cn("h-5 w-5", supplyLive ? "text-[#00f7a1]" : "text-[#ffb347]")} />}
        note="RISER POLE PROTECTION"
      />

      <Wire powered={supplyLive} vertical className="h-6" />

      <EquipmentCard
        tag="UG-PRI"
        title="OVERHEAD TO UNDERGROUND TRANSITION"
        status={supplyLive ? "RISER POLE DOWNFEED ACTIVE" : "NO PRIMARY TRANSITION"}
        active={supplyLive}
        accent="cyan"
        icon={<Zap className={cn("h-5 w-5", supplyLive ? "text-[#00dcff]" : "text-[#475569]")} />}
        note="CONDUIT DROP AT RISER POLE"
      />

      <Wire powered={supplyLive} vertical className="h-6" />

      <EquipmentCard
        tag="LAT-001"
        title="UNDERGROUND SERVICE LATERAL"
        status={supplyLive ? "4.8 KV PRIMARY IN CONDUIT" : "LATERAL DE-ENERGIZED"}
        active={supplyLive}
        accent="cyan"
        icon={<Zap className={cn("h-5 w-5", supplyLive ? "text-[#00dcff]" : "text-[#475569]")} />}
        note="UNDERGROUND PRIMARY FEED"
      />

      <Wire powered={supplyLive} vertical className="h-6" />

      <EquipmentCard
        tag="XFMR-001"
        title="PAD-MOUNT TRANSFORMER"
        status={supplyLive ? "INPUT 4.8 KV / OUTPUT 120-240V" : "NO PRIMARY FEED"}
        active={supplyLive}
        accent="cyan"
        icon={<Zap className={cn("h-5 w-5", supplyLive ? "text-[#00dcff]" : "text-[#475569]")} />}
        note="UNDERGROUND PRIMARY TO SECONDARY"
      />

      <Wire powered={meterLive} vertical className="h-6" />

      <EquipmentCard
        tag="SEC-001"
        title="SECONDARY SERVICE TO BUILDING"
        status={meterLive ? "L1 / L2 / N SERVICE CABLE ENERGIZED" : "SECONDARY SERVICE DEAD"}
        active={meterLive}
        accent="cyan"
        icon={<Zap className={cn("h-5 w-5", meterLive ? "text-[#00dcff]" : "text-[#475569]")} />}
        note="HYDRO ONE DEMARC AT METER LINE SIDE"
      />

      <Wire powered={meterLive} vertical className="h-6" />

      <EquipmentCard
        tag="MTR-UTIL"
        title="ELECTRIC METER BASE"
        status={meterLive ? `${voltage.toFixed(1)} VAC METERED` : "0.0 VAC"}
        active={meterLive}
        accent="cyan"
        icon={<Zap className={cn("h-5 w-5", meterLive ? "text-[#00dcff]" : "text-[#475569]")} />}
        note="DEMARCATION AT LINE-SIDE TERMINALS"
      />

      <Wire powered={meterLive} vertical className="h-6" />

      <EquipmentCard
        tag="PNL-001"
        title="MAIN PANEL"
        status={mainPanelLive ? "ENERGIZED" : disconnectClosed ? "BREAKER OPEN" : "DISCONNECT OPEN"}
        active={mainPanelLive}
        accent={mainPanelLive ? "green" : "amber"}
        icon={<Power className={cn("h-5 w-5", mainPanelLive ? "text-[#00f7a1]" : "text-[#ffb347]")} />}
        note="SERVICE ENTRANCE PANEL"
      />

      <Wire powered={supplyLive} vertical className="h-8" />

      <EquipmentCard
        tag="MDS-001"
        title="MAIN DISCONNECT"
        status={disconnectClosed ? "CLOSED (ON)" : "OPEN (OFF)"}
        active={disconnectClosed && supplyLive}
        accent={disconnectClosed ? "green" : "amber"}
        icon={<Power className={cn("h-5 w-5", disconnectClosed ? "text-[#00f7a1]" : "text-[#ffb347]")} />}
        onClick={onToggleDisconnect}
        note="CLICK TO TOGGLE"
      />

      <Wire powered={disconnectClosed && supplyLive} vertical className="h-8" />

      <EquipmentCard
        tag="CB-001"
        title="CIRCUIT BREAKER"
        status={breakerTripped ? "TRIPPED" : "OK"}
        active={!breakerTripped && disconnectClosed && supplyLive}
        accent={breakerTripped ? "red" : "green"}
        icon={<ShieldAlert className={cn("h-5 w-5", breakerTripped ? "text-[#ff4d5a]" : "text-[#00f7a1]")} />}
        onClick={onToggleBreaker}
        note={breakerTripped ? "CLICK TO RESET" : "CLICK TO TRIP"}
      />

      <Wire powered={busLive} vertical className="h-6" />
      <div className="flex w-full items-center gap-3">
        <Wire powered={busLive} className="flex-1" />
        <div className={cn("font-mono text-[10px] tracking-[0.25em]", busLive ? "text-[#00dcff]" : "text-[#475569]")}>POWER BUS</div>
        <Wire powered={busLive} className="flex-1" />
      </div>

      <div className="grid w-full grid-cols-2 gap-4 pt-1">
        <div className="flex flex-col items-center gap-3">
          <Wire powered={busLive} vertical className="h-5" />
          <EquipmentCard
            tag="CTR-001"
            title="FEEDER CONTACTOR"
            status={feederContactor ? "ENERGIZED" : "DE-ENERGIZED"}
            active={feederContactor}
            accent={feederContactor ? "green" : "cyan"}
            icon={<Zap className={cn("h-4 w-4", feederContactor ? "text-[#00f7a1]" : "text-[#00dcff]")} />}
          />
          <Wire powered={motorPowered} vertical className="h-5" />
          <EquipmentCard
            tag="MTR-001"
            title="DISPENSER MOTOR"
            status={motorPowered ? `${current.toFixed(2)} A LOAD` : "STOPPED"}
            active={motorPowered}
            accent={motorPowered ? "green" : "cyan"}
            icon={<div className={cn("font-display text-lg", motorPowered ? "text-[#00f7a1]" : "text-[#64748b]")}>M</div>}
          />
        </div>

        <div className="flex flex-col items-center gap-3">
          <Wire powered={busLive} vertical className="h-5" />
          <EquipmentCard
            tag="CTR-002"
            title="SOL CONTACTOR"
            status={solenoidContactor ? "ENERGIZED" : "DE-ENERGIZED"}
            active={solenoidContactor}
            accent={solenoidContactor ? "green" : "cyan"}
            icon={<Zap className={cn("h-4 w-4", solenoidContactor ? "text-[#00f7a1]" : "text-[#00dcff]")} />}
          />
          <Wire powered={gateOpen} vertical className="h-5" />
          <EquipmentCard
            tag="SOL-001"
            title="HOPPER GATE"
            status={gateOpen ? "ACTUATED / OPEN" : "CLOSED"}
            active={gateOpen}
            accent={gateOpen ? "green" : "cyan"}
            icon={<div className={cn("font-display text-lg", gateOpen ? "text-[#00f7a1]" : "text-[#64748b]")}>◫</div>}
          />
        </div>
      </div>
    </div>
  );
}
