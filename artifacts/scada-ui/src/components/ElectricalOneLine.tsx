import { Power, AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  disconnectClosed: boolean;
  breakerTripped: boolean;
  feedActive: boolean;
  isPowered: boolean;
  voltage: number;
  current: number;
  onToggleDisconnect: () => void;
  onTripBreaker: () => void;
  onResetBreaker: () => void;
}

function Wire({ powered, vertical = false, className }: { powered: boolean; vertical?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "transition-all duration-500",
        vertical ? "w-[3px]" : "h-[3px]",
        powered
          ? "bg-[#00e5ff] shadow-[0_0_8px_2px_rgba(0,229,255,0.7)]"
          : "bg-[#2a3a4a]",
        className
      )}
    />
  );
}

function WireGreen({ powered, vertical = false, className }: { powered: boolean; vertical?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "transition-all duration-500",
        vertical ? "w-[3px]" : "h-[3px]",
        powered
          ? "bg-[#00ff65] shadow-[0_0_8px_2px_rgba(0,255,101,0.7)]"
          : "bg-[#2a3a4a]",
        className
      )}
    />
  );
}

export function ElectricalOneLine({
  disconnectClosed,
  breakerTripped,
  feedActive,
  isPowered,
  voltage,
  current,
  onToggleDisconnect,
  onTripBreaker,
  onResetBreaker,
}: Props) {
  const aboveMDS = true;
  const aboveCB = disconnectClosed;
  const aboveBus = disconnectClosed && !breakerTripped;
  const motorPowered = aboveBus && feedActive;

  return (
    <div className="flex flex-col items-center w-full h-full py-2 select-none font-mono text-xs gap-0">

      {/* AC Bus Bars at top */}
      <div className="flex gap-1.5 mb-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "w-[6px] h-6 rounded-sm transition-all duration-300",
              i === 1
                ? "bg-[#00e5ff] shadow-[0_0_10px_3px_rgba(0,229,255,0.8)]"
                : "bg-[#00e5ff]/70 shadow-[0_0_6px_2px_rgba(0,229,255,0.5)]"
            )}
          />
        ))}
      </div>

      {/* 120V AC SUPPLY */}
      <div className="w-full rounded border-2 border-[#00e5ff] bg-[#001a2e] shadow-[0_0_12px_rgba(0,229,255,0.4)] p-2 text-center">
        <div className="flex items-center justify-center gap-1 text-[#00e5ff]">
          <Zap className="w-3.5 h-3.5" />
          <span className="font-bold tracking-widest text-[11px]">120V AC SUPPLY</span>
        </div>
        <div className="text-[#00e5ff]/70 text-[10px] font-mono mt-0.5">
          {voltage.toFixed(1)} V
        </div>
      </div>

      {/* Wire: Supply → MDS */}
      <Wire powered={aboveMDS} vertical className="h-5" />

      {/* MDS-001 — CLICKABLE */}
      <button
        onClick={onToggleDisconnect}
        className={cn(
          "w-full rounded border-2 p-3 text-center transition-all duration-300 group cursor-pointer active:scale-[0.97]",
          disconnectClosed
            ? "border-[#00e5ff] bg-[#001a2e] shadow-[0_0_10px_rgba(0,229,255,0.35)] hover:shadow-[0_0_14px_rgba(0,229,255,0.55)]"
            : "border-[#2a3a4a] bg-[#0a1520] hover:border-[#3a5a6a]"
        )}
      >
        <div className="text-[9px] text-left text-[#4a6a7a] mb-1 tracking-widest">MDS-001</div>
        <div className="flex items-center justify-center gap-2">
          <Power
            className={cn(
              "w-5 h-5 transition-colors",
              disconnectClosed ? "text-[#00e5ff]" : "text-[#3a5a6a]"
            )}
          />
          <span className={cn(
            "font-bold tracking-wider text-[11px]",
            disconnectClosed ? "text-[#00e5ff]" : "text-[#3a5a6a]"
          )}>
            MAIN DISCONNECT
          </span>
        </div>
        <div className={cn(
          "mt-1.5 mx-auto inline-block px-2 py-0.5 rounded text-[9px] border font-mono tracking-widest transition-colors",
          disconnectClosed
            ? "border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/10"
            : "border-[#3a5a6a] text-[#3a5a6a]"
        )}>
          {disconnectClosed ? "CLOSED (ON)" : "OPEN (OFF)"}
        </div>
        <div className="text-[8px] text-[#4a6a7a]/60 mt-1 tracking-widest group-hover:text-[#4a8a9a]/80 transition-colors">
          CLICK TO {disconnectClosed ? "OPEN" : "CLOSE"}
        </div>
      </button>

      {/* Wire: MDS → CB */}
      <Wire powered={aboveCB} vertical className="h-5" />

      {/* CB-001 — CLICKABLE */}
      <button
        onClick={breakerTripped ? onResetBreaker : onTripBreaker}
        className={cn(
          "w-full rounded border-2 p-3 text-center transition-all duration-300 group cursor-pointer active:scale-[0.97]",
          breakerTripped
            ? "border-[#ff3333] bg-[#1a0000] shadow-[0_0_12px_rgba(255,51,51,0.4)] hover:shadow-[0_0_16px_rgba(255,51,51,0.6)]"
            : disconnectClosed
              ? "border-[#00e5ff] bg-[#001a2e] shadow-[0_0_10px_rgba(0,229,255,0.35)] hover:shadow-[0_0_14px_rgba(0,229,255,0.55)]"
              : "border-[#2a3a4a] bg-[#0a1520] hover:border-[#3a5a6a]"
        )}
      >
        <div className="text-[9px] text-left text-[#4a6a7a] mb-1 tracking-widest">CB-001</div>
        <div className="flex items-center justify-center gap-2">
          <AlertCircle
            className={cn(
              "w-5 h-5 transition-colors",
              breakerTripped ? "text-[#ff3333]" : disconnectClosed ? "text-[#00e5ff]" : "text-[#3a5a6a]"
            )}
          />
          <span className={cn(
            "font-bold tracking-wider text-[11px]",
            breakerTripped ? "text-[#ff3333]" : disconnectClosed ? "text-[#00e5ff]" : "text-[#3a5a6a]"
          )}>
            CIRCUIT BREAKER
          </span>
        </div>
        <div className={cn(
          "mt-1.5 mx-auto inline-block px-2 py-0.5 rounded text-[9px] border font-mono tracking-widest transition-colors",
          breakerTripped
            ? "border-[#ff3333] text-[#ff3333] bg-[#ff3333]/10"
            : disconnectClosed
              ? "border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/10"
              : "border-[#3a5a6a] text-[#3a5a6a]"
        )}>
          {breakerTripped ? "TRIPPED" : "OK"}
        </div>
        <div className="text-[8px] text-[#4a6a7a]/60 mt-1 tracking-widest group-hover:text-[#4a8a9a]/80 transition-colors">
          {breakerTripped ? "CLICK TO RESET" : "CLICK TO TRIP"}
        </div>
      </button>

      {/* Wire: CB → Bus */}
      <Wire powered={aboveBus} vertical className="h-4" />

      {/* Power Bus */}
      <div className="w-full flex items-center gap-1">
        <Wire powered={aboveBus} className="flex-1" />
        <div className={cn(
          "text-[9px] px-1 tracking-widest transition-colors",
          aboveBus ? "text-[#00e5ff]" : "text-[#2a3a4a]"
        )}>BUS</div>
        <Wire powered={aboveBus} className="flex-1" />
      </div>

      {/* Split lines down to CTR-001 and CTR-002 */}
      <div className="w-full flex justify-around">
        <div className="flex flex-col items-center" style={{ width: "45%" }}>
          <Wire powered={aboveBus} vertical className="h-4" />

          {/* CTR-001 */}
          <div className={cn(
            "w-full rounded border p-1.5 text-center transition-all duration-300",
            motorPowered
              ? "border-[#00ff65] bg-[#001a0e] shadow-[0_0_8px_rgba(0,255,101,0.4)]"
              : aboveBus
                ? "border-[#00e5ff]/40 bg-[#001a2e]/60"
                : "border-[#2a3a4a] bg-[#0a1520]"
          )}>
            <div className="text-[8px] text-[#4a6a7a] tracking-widest">CTR-001</div>
            <div className={cn(
              "font-bold text-[9px] tracking-wide",
              motorPowered ? "text-[#00ff65]" : aboveBus ? "text-[#00e5ff]/60" : "text-[#3a5a6a]"
            )}>
              FEEDER CTR
            </div>
            <div className={cn(
              "text-[8px] mt-0.5 tracking-widest",
              motorPowered ? "text-[#00ff65]" : "text-[#3a5a6a]"
            )}>
              {motorPowered ? "ENERGIZED" : "DE-ENERGIZED"}
            </div>
          </div>

          <WireGreen powered={motorPowered} vertical className="h-4" />

          {/* MTR-001 */}
          <div className={cn(
            "flex flex-col items-center gap-0.5 transition-all duration-300"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-base transition-all duration-300",
              motorPowered
                ? "border-[#00ff65] text-[#00ff65] shadow-[0_0_12px_rgba(0,255,101,0.5)]"
                : "border-[#2a3a4a] text-[#2a3a4a]"
            )}>
              M
            </div>
            <div className="text-[8px] text-[#4a6a7a] tracking-widest">MTR-001</div>
            <div className="text-[8px] text-[#4a6a7a] tracking-widest">DISPENSER</div>
            <div className={cn(
              "text-[9px] font-mono tracking-wide",
              motorPowered ? "text-[#00ff65]" : "text-[#3a5a6a]"
            )}>
              {motorPowered ? `${current.toFixed(2)}A` : "STOPPED"}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center" style={{ width: "45%" }}>
          <Wire powered={aboveBus} vertical className="h-4" />

          {/* CTR-002 */}
          <div className={cn(
            "w-full rounded border p-1.5 text-center transition-all duration-300",
            motorPowered
              ? "border-[#00ff65] bg-[#001a0e] shadow-[0_0_8px_rgba(0,255,101,0.4)]"
              : aboveBus
                ? "border-[#00e5ff]/40 bg-[#001a2e]/60"
                : "border-[#2a3a4a] bg-[#0a1520]"
          )}>
            <div className="text-[8px] text-[#4a6a7a] tracking-widest">CTR-002</div>
            <div className={cn(
              "font-bold text-[9px] tracking-wide",
              motorPowered ? "text-[#00ff65]" : aboveBus ? "text-[#00e5ff]/60" : "text-[#3a5a6a]"
            )}>
              SOL CONTACTOR
            </div>
            <div className={cn(
              "text-[8px] mt-0.5 tracking-widest",
              motorPowered ? "text-[#00ff65]" : "text-[#3a5a6a]"
            )}>
              {motorPowered ? "ENERGIZED" : "DE-ENERGIZED"}
            </div>
          </div>

          <WireGreen powered={motorPowered} vertical className="h-4" />

          {/* SOL-001 */}
          <div className="flex flex-col items-center gap-0.5">
            {/* Gate symbol */}
            <div className={cn(
              "w-12 h-12 border-2 flex items-center justify-center transition-all duration-300",
              motorPowered
                ? "border-[#00ff65] shadow-[0_0_12px_rgba(0,255,101,0.5)]"
                : "border-[#2a3a4a]"
            )}>
              <div className="flex flex-col items-center gap-0.5">
                <div className={cn("w-6 h-[2px] transition-colors", motorPowered ? "bg-[#00ff65]" : "bg-[#2a3a4a]")} />
                <div className={cn(
                  "w-[2px] transition-all duration-300",
                  motorPowered ? "h-4 bg-[#00ff65] translate-x-2" : "h-4 bg-[#2a3a4a]"
                )} />
                <div className={cn("w-6 h-[2px] transition-colors", motorPowered ? "bg-[#00ff65]" : "bg-[#2a3a4a]")} />
              </div>
            </div>
            <div className="text-[8px] text-[#4a6a7a] tracking-widest">SOL-001</div>
            <div className="text-[8px] text-[#4a6a7a] tracking-widest">HOPPER GATE</div>
            <div className={cn(
              "text-[9px] font-mono tracking-wide",
              motorPowered ? "text-[#00ff65]" : "text-[#3a5a6a]"
            )}>
              {motorPowered ? "OPEN" : "CLOSED"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
