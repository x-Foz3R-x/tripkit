"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Landmark,
  LoaderCircle,
  ShoppingBasket,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useTripRoute } from "~/providers/trip-route-provider";

const NAV_ITEMS = [
  { name: "Baza", suffix: "", icon: Home, module: null },
  { name: "Punktacja", suffix: "/scoreboard", icon: Trophy, module: "scoreboard" },
  { name: "Lista zakupów", suffix: "/shopping", icon: ShoppingBasket, module: "shopping" },
  { name: "Skarbiec", suffix: "/finances", icon: Landmark, module: "finances" },
] as const;

function NavItemContent({
  icon: Icon,
  isActive,
  name,
}: {
  icon: LucideIcon;
  isActive: boolean;
  name: string;
}) {
  const { pending } = useLinkStatus();
  const isHighlighted = isActive || pending;

  return (
    <span
      className={cn(
        "flex flex-col items-center gap-1 transition-colors duration-150",
        isHighlighted ? "text-theme-primary" : "text-theme-muted hover:text-theme-text",
      )}
    >
      <span
        className={cn(
          "rounded-2xl p-2 transition-all duration-200",
          isHighlighted && "bg-theme-primary/15",
        )}
      >
        {pending ? (
          <LoaderCircle className="h-6 w-6 animate-spin" strokeWidth={2.5} />
        ) : (
          <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
        )}
      </span>
      <span className="text-[10px] font-medium tracking-wide">{name}</span>
    </span>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { modules, urlKey } = useTripRoute();
  const basePath = `/t/${urlKey}`;

  return (
    <nav className="bg-theme-bg/90 border-theme-border pb-safe fixed bottom-0 left-0 z-50 w-full border-t px-6 pt-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-around pt-2 pb-4">
        {NAV_ITEMS.filter((item) => item.module === null || modules[item.module]).map((item) => {
          const href = `${basePath}${item.suffix}`;
          const isActive = pathname === href;
          const Icon = item.icon;

          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              aria-current={isActive ? "page" : undefined}
            >
              <NavItemContent icon={Icon} isActive={isActive} name={item.name} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
