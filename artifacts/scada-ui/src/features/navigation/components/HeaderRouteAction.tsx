import type { ReactNode } from "react";
import { Link } from "wouter";

interface HeaderRouteActionProps {
  href: string;
  label: ReactNode;
  icon?: ReactNode;
  className?: string;
  kioskMode?: "show" | "hide" | "disable";
}

export function HeaderRouteAction({
  href,
  label,
  icon,
  className,
  kioskMode = "show",
}: HeaderRouteActionProps) {
  if (kioskMode === "hide") {
    return null;
  }

  const disabled = kioskMode === "disable";

  return (
    <Link
      href={disabled ? "#" : href}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      className={
        className ??
        "flex items-center gap-2 rounded-xl border border-[#00f7a1]/30 bg-[#00f7a1]/8 px-3 py-2 font-display text-xs tracking-[0.16em] text-[#00f7a1] transition hover:bg-[#00f7a1]/15"
      }
      onClick={disabled ? (event) => event.preventDefault() : undefined}
    >
      {icon}
      {label}
    </Link>
  );
}
