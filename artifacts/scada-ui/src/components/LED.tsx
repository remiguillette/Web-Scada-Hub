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
    md: "w-2.5 h-2.5",
    lg: "w-4 h-4"
  };

  const colorOn = {
    green: "bg-[#00ff50] shadow-[0_0_8px_3px_rgba(0,255,80,0.75)]",
    red:   "bg-[#ff3232] shadow-[0_0_8px_3px_rgba(255,50,50,0.75)]",
    amber: "bg-[#ffb300] shadow-[0_0_8px_3px_rgba(255,175,0,0.75)]",
    cyan:  "bg-[#00dcff] shadow-[0_0_8px_3px_rgba(0,220,255,0.75)]",
  };
  const colorOff = {
    green: "bg-[#0d2515]",
    red:   "bg-[#250808]",
    amber: "bg-[#251900]",
    cyan:  "bg-[#011e28]",
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "rounded-full transition-all duration-200 shrink-0",
          sizeClasses[size],
          on ? [colorOn[color], "led-pulse"] : colorOff[color]
        )}
      />
      {label && (
        <span className="font-mono text-[11px] tracking-wide text-[#6a8a9a] uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
