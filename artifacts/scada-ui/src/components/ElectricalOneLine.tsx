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
    green: active ? "border-[#00f7a1] text-[#00f7a1] bg-[#021910] shadow-[0_0_18px_rgba(0,247,161,0.22)]" : "border-[#334155] text-[#64748b] bg-[#0b1220]",
    cyan: active ? "border-[#00dcff] text-[#b8f3ff] bg-[#061522] shadow-[0_0_18px_rgba(0,220,255,0.2)]" : "border-[#334155] text-[#64748b] bg-[#0b1220]",
    red: active ? "border-[#ff4d5a] text-[#ffd8dc] bg-[#22070d] shadow-[0_0_18px_rgba(255,77,90,0.25)]" : "border-[#334155] text-[#64748b] bg-[#0b1220]",
    amber: active ? "border-[#ffb347] text-[#ffe2af] bg-[#211304] shadow-[0_0_18px_rgba(255,179,71,0.22)]" : "border-[#334155] text-[#64748b] bg-[#0b1220]",
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
    <button type="button" onClick={onClick} className="w-full text-left hover:scale-[1.01] active:scale-[0.99] transition-transform">
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
  const busLive = disconnectClosed && !breakerTripped && supplyLive;

  return (
    <div className="flex flex-col items-center gap-3">
      <EquipmentCard
        tag="L1 / N"
        title="120V AC SUPPLY"
        status={supplyLive ? `${voltage.toFixed(1)} VAC PRESENT` : "0.0 VAC OFFLINE"}
        active={supplyLive}
        accent="cyan"
        icon={<Zap className={cn("h-5 w-5", supplyLive ? "text-[#00dcff]" : "text-[#475569]")} />}
        note="UTILITY FEED"
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
