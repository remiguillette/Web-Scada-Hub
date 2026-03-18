import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  status?: "ok" | "warning" | "fault" | "offline";
}

export function Panel({ title, children, className, status }: PanelProps) {
  return (
    <div className={cn(
      "bg-card border border-border rounded-lg overflow-hidden shadow-lg flex flex-col scanlines",
      className
    )}>
      <div className="bg-secondary/50 px-4 py-2 border-b border-border flex justify-between items-center">
        <h3 className="font-display text-primary text-sm font-semibold tracking-widest">{title}</h3>
        {status && (
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              status === "ok" && "bg-accent glow-green",
              status === "warning" && "bg-warning glow-amber",
              status === "fault" && "bg-destructive glow-red",
              status === "offline" && "bg-muted-foreground"
            )} />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">{status}</span>
          </div>
        )}
      </div>
      <div className="p-4 flex-1">
        {children}
      </div>
    </div>
  );
}
