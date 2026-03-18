import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, Maximize2, Minimize2 } from "lucide-react";

interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  status?: "ok" | "warning" | "fault" | "offline";
  icon?: ReactNode;
  expanded?: boolean;
  onToggleExpand?: () => void;
  openUrl?: string;
}

export function Panel({ title, children, className, status, icon, expanded, onToggleExpand, openUrl }: PanelProps) {
  const statusDot: Record<string, string> = {
    ok:      "bg-[#00ff50] shadow-[0_0_8px_rgba(0,255,80,0.9)] led-pulse",
    warning: "bg-[#ffb300] shadow-[0_0_8px_rgba(255,175,0,0.9)] led-pulse",
    fault:   "bg-[#ff3232] shadow-[0_0_8px_rgba(255,50,50,0.9)] led-pulse",
    offline: "bg-[#3a4a5a]",
  };

  const panel = (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-[#2a2a2a]",
        "bg-[#111111] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_4px_32px_rgba(0,0,0,0.6)]",
        expanded ? "fixed inset-0 z-50 rounded-none border-0" : "",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2 shrink-0",
          "bg-[#0d0d0d] border-b border-[#2a2a2a]",
          "relative overflow-hidden"
        )}
      >
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00f7a1]" />

        <div className="flex items-center gap-2.5 pl-2">
          {icon && <span className="text-[#00f7a1] opacity-80">{icon}</span>}
          <h3 className="font-display text-[11px] font-semibold tracking-[0.2em] text-[#00f7a1]">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {status && (
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", statusDot[status])} />
              <span className="text-[9px] font-mono text-[#5a7a5a] uppercase tracking-wider">
                {status}
              </span>
            </div>
          )}
          {openUrl && (
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded p-1 text-[#4a6a5a] transition hover:bg-[#1a2a1a] hover:text-[#00f7a1]"
              title="Open full page"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="flex items-center justify-center rounded p-1 text-[#4a6a5a] transition hover:bg-[#1a2a1a] hover:text-[#00f7a1]"
              title={expanded ? "Exit full window" : "Full window"}
            >
              {expanded
                ? <Minimize2 className="h-3.5 w-3.5" />
                : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      <div className={cn("p-4 flex-1 min-w-0 min-h-0", expanded ? "overflow-auto" : "overflow-hidden")}>
        {children}
      </div>
    </div>
  );

  return panel;
}
