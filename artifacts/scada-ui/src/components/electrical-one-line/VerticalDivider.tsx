export function VerticalDivider({ height, label }: { height: number; label?: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-2 px-2">
      {label ? <div className="font-mono text-[8px] tracking-[0.28em] text-[#4b5563]">{label}</div> : null}
      <div className="w-px bg-gradient-to-b from-[#334155] via-[#64748b] to-[#334155] shadow-[0_0_10px_rgba(100,116,139,0.35)]" style={{ height }} />
    </div>
  );
}
