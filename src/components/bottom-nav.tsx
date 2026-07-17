"use client";

import { useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Gamepad2,
  Home,
  LoaderCircle,
  Menu,
  ReceiptText,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useTripRoute } from "~/providers/trip-route-provider";
import type { TripNavigationKey } from "~/lib/trip-config";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { MoreMenu } from "~/components/more-menu";
import { motion } from "framer-motion";
import { MOTION_TRANSITIONS } from "~/lib/motion";

const MODULE_NAV_ITEMS: Record<
  TripNavigationKey,
  {
    name: string;
    suffix: string;
    icon: LucideIcon;
  }
> = {
  schedule: { name: "Plan", suffix: "/schedule", icon: CalendarDays },
  shopping: { name: "Zakupy", suffix: "/shopping", icon: ShoppingBasket },
  scoreboard: { name: "Rozgrywka", suffix: "/gameplay", icon: Gamepad2 },
  finances: { name: "Rozliczenia", suffix: "/finances", icon: ReceiptText },
};

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
    <motion.span
      whileTap={{ scale: 0.94 }}
      className={cn(
        "relative mx-0.5 flex min-h-14 w-auto flex-col items-center justify-center gap-0.5 rounded-full px-1",
        isHighlighted ? "text-theme-primary" : "text-theme-muted hover:text-theme-text",
      )}
    >
      {isHighlighted && (
        <motion.span
          layoutId="bottom-nav-active"
          transition={MOTION_TRANSITIONS.spring}
          className="bg-theme-primary/12 absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.12)]"
        />
      )}
      <span className="relative flex h-6 items-center justify-center">
        {pending ? (
          <LoaderCircle className="size-5.5 animate-spin" strokeWidth={2.5} />
        ) : (
          <Icon className="size-5.5" strokeWidth={isActive ? 2.5 : 2} />
        )}
      </span>
      <span
        className={cn(
          "relative max-w-full truncate text-[9px] tracking-normal",
          isHighlighted ? "font-bold" : "font-medium",
        )}
      >
        {name}
      </span>
    </motion.span>
  );
}

export function BottomNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const pathname = usePathname();
  const { layout, urlKey } = useTripRoute();
  const basePath = `/t/${urlKey}`;
  const primaryItems = layout.navigation.slice(0, 3).map((key) => MODULE_NAV_ITEMS[key]);
  const moreIsActive =
    pathname === `${basePath}/more` ||
    pathname === `${basePath}/settings` ||
    pathname === `${basePath}/packing` ||
    pathname === `${basePath}/quests`;
  const navItems = [{ name: "Baza", suffix: "", icon: Home }, ...primaryItems];

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 px-2">
      <div className="bg-theme-card/72 border-theme-border/80 supports-backdrop-filter:bg-theme-card/58 pointer-events-auto mx-auto flex max-w-110 items-center rounded-full border p-1 shadow-[0_18px_52px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        {navItems.map((item) => {
          const href = `${basePath}${item.suffix}`;
          const isActive = item.suffix === "/more" ? moreIsActive : pathname === href;
          const Icon = item.icon;

          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              aria-current={isActive ? "page" : undefined}
              className="min-w-0 flex-1"
            >
              <NavItemContent icon={Icon} isActive={isActive} name={item.name} />
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          aria-expanded={isMoreOpen}
          aria-label="Otwórz Więcej"
          className="min-w-0 flex-1"
        >
          <motion.span
            whileTap={{ scale: 0.94 }}
            className={cn(
              "relative mx-0.5 flex min-h-14 w-auto flex-col items-center justify-center gap-0.5 rounded-full px-1",
              isMoreOpen || moreIsActive
                ? "text-theme-primary"
                : "text-theme-muted hover:text-theme-text",
            )}
          >
            {(isMoreOpen || moreIsActive) && (
              <motion.span
                layoutId="bottom-nav-active"
                transition={MOTION_TRANSITIONS.spring}
                className="bg-theme-primary/12 absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.12)]"
              />
            )}
            <span className="relative flex h-6 items-center justify-center">
              <Menu className="size-5.5" strokeWidth={isMoreOpen || moreIsActive ? 2.5 : 2} />
            </span>
            <span
              className={cn(
                "relative truncate text-[9px] tracking-wide",
                isMoreOpen || moreIsActive ? "font-bold" : "font-medium",
              )}
            >
              Więcej
            </span>
          </motion.span>
        </button>
      </div>

      <ResponsiveDialog isOpen={isMoreOpen} setIsOpen={setIsMoreOpen}>
        <MoreMenu key={isMoreOpen ? "open" : "closed"} onNavigate={() => setIsMoreOpen(false)} />
      </ResponsiveDialog>
    </nav>
  );
}
