import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  status?: "ok" | "warning" | "fault" | "offline";
  icon?: ReactNode;
}

export function Panel({ title, children, className, status, icon }: PanelProps) {
  const statusDot: Record<string, string> = {
    ok:      "bg-[#00ff50] shadow-[0_0_8px_rgba(0,255,80,0.9)] led-pulse",
    warning: "bg-[#ffb300] shadow-[0_0_8px_rgba(255,175,0,0.9)] led-pulse",
    fault:   "bg-[#ff3232] shadow-[0_0_8px_rgba(255,50,50,0.9)] led-pulse",
    offline: "bg-[#3a4a5a]",
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-[#2a2a2a]",
        "bg-[#111111] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_4px_32px_rgba(0,0,0,0.6)]",
        "scanlines",
        className
      )}
    >
      {/* Panel header bar */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2 shrink-0",
          "bg-[#0d0d0d] border-b border-[#2a2a2a]",
          "relative overflow-hidden"
        )}
      >
        {/* Left accent stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00f7a1]" />

        <div className="flex items-center gap-2.5 pl-2">
          {icon && <span className="text-[#00f7a1] opacity-80">{icon}</span>}
          <h3 className="font-display text-[11px] font-semibold tracking-[0.2em] text-[#00f7a1]">
            {title}
          </h3>
        </div>

        {status && (
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", statusDot[status])} />
            <span className="text-[9px] font-mono text-[#5a7a5a] uppercase tracking-wider">
              {status}
            </span>
          </div>
        )}
      </div>

      {/* Panel body */}
      <div className="p-4 flex-1">
        {children}
      </div>
    </div>
  );
}
