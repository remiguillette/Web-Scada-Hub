import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusBadge({
  ok,
  okLabel,
  faultLabel,
}: {
  ok: boolean;
  okLabel: string;
  faultLabel: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] tracking-[0.16em]",
        ok
          ? "border-[#00f7a1]/30 bg-[#00f7a1]/10 text-[#00f7a1]"
          : "border-[#ff4d5a]/30 bg-[#ff4d5a]/10 text-[#ff4d5a]",
      )}
    >
      {ok ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <AlertTriangle className="h-3 w-3" />
      )}
      {ok ? okLabel : faultLabel}
    </span>
  );
}
