import type { ReactNode } from "react";
import { RouteActionBase, type RouteActionKioskMode } from "@/features/navigation/components/RouteActionBase";

interface OneLineHeaderRouteActionProps {
  href: string;
  label: ReactNode;
  icon?: ReactNode;
  className?: string;
  kioskMode?: RouteActionKioskMode;
}

export function OneLineHeaderRouteAction({
  href,
  label,
  icon,
  className,
  kioskMode = "show",
}: OneLineHeaderRouteActionProps) {
  return (
    <RouteActionBase
      href={href}
      label={label}
      icon={icon}
      kioskMode={kioskMode}
      className={
        className ??
        "flex items-center gap-1.5 rounded-lg border border-[#24342c] bg-[#101513] px-2.5 py-1.5 font-mono text-[10px] tracking-[0.16em] text-[#7f93ac] transition hover:border-[#335646] hover:text-[#b9c7d9]"
      }
    />
  );
}
