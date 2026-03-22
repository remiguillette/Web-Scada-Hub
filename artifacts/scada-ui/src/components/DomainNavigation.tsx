import { Link } from "wouter";
import { ActivitySquare, ArrowRight, RadioTower, Zap } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

type DomainNavigationProps = {
  currentPath: "/" | "/power/one-line" | "/power/source";
};

const ROUTES = [
  {
    href: "/" as const,
    icon: ActivitySquare,
    titleKey: "powerOverviewNav" as const,
    descKey: "powerOverviewNavDesc" as const,
  },
  {
    href: "/power/one-line" as const,
    icon: Zap,
    titleKey: "powerOneLineNav" as const,
    descKey: "powerOneLineNavDesc" as const,
  },
  {
    href: "/power/source" as const,
    icon: RadioTower,
    titleKey: "powerSourceNav" as const,
    descKey: "powerSourceNavDesc" as const,
  },
];

export function DomainNavigation({ currentPath }: DomainNavigationProps) {
  const { t } = useTranslation();

  return (
    <nav className="grid gap-3 md:grid-cols-3">
      {ROUTES.map((route) => {
        const Icon = route.icon;
        const active = route.href === currentPath;

        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "rounded-2xl border px-4 py-3 transition",
              active
                ? "border-[#00f7a1]/40 bg-[#071a13] text-[#dff8ec]"
                : "border-[#243245] bg-[#09111d] text-[#a8bdd4] hover:border-[#00dcff]/40 hover:text-white",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                  active
                    ? "border-[#00f7a1]/40 bg-[#00f7a1]/10 text-[#00f7a1]"
                    : "border-[#243245] bg-[#0d1825] text-[#00dcff]",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-xs uppercase tracking-[0.18em]">
                  {t[route.titleKey]}
                </div>
                <div className="mt-1 text-sm leading-5 text-current/80">
                  {t[route.descKey]}
                </div>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 opacity-70" />
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
