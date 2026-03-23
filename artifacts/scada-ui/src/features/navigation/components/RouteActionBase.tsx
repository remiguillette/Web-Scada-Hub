import type { MouseEventHandler, ReactNode } from "react";
import { Link } from "wouter";

export type RouteActionKioskMode = "show" | "hide" | "disable";

interface RouteActionBaseProps {
  href: string;
  label: ReactNode;
  icon?: ReactNode;
  className: string;
  kioskMode?: RouteActionKioskMode;
}

export function RouteActionBase({
  href,
  label,
  icon,
  className,
  kioskMode = "show",
}: RouteActionBaseProps) {
  if (kioskMode === "hide") {
    return null;
  }

  const disabled = kioskMode === "disable";
  const handleClick: MouseEventHandler<HTMLAnchorElement> | undefined = disabled
    ? (event) => event.preventDefault()
    : undefined;

  return (
    <Link
      href={disabled ? "#" : href}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      className={className}
      onClick={handleClick}
    >
      {icon}
      {label}
    </Link>
  );
}
