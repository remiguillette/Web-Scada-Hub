import { cn } from "@/lib/utils";

interface LEDProps {
  on: boolean;
  color?: "green" | "red" | "amber" | "cyan";
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LED({ on, color = "green", label, size = "md", className }: LEDProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-5 h-5"
  };

  const colorClasses = {
    green: on ? "bg-accent shadow-[0_0_8px_rgba(0,255,65,0.8)]" : "bg-accent/20",
    red: on ? "bg-destructive shadow-[0_0_8px_rgba(255,51,51,0.8)]" : "bg-destructive/20",
    amber: on ? "bg-warning shadow-[0_0_8px_rgba(255,179,0,0.8)]" : "bg-warning/20",
    cyan: on ? "bg-primary shadow-[0_0_8px_rgba(0,229,255,0.8)]" : "bg-primary/20",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "rounded-full transition-all duration-200 border border-black/50",
        sizeClasses[size],
        colorClasses[color]
      )} />
      {label && <span className="font-mono text-xs text-muted-foreground uppercase">{label}</span>}
    </div>
  );
}
