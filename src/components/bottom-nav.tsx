"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Landmark, Trophy, ShoppingBasket } from "lucide-react";
import { cn } from "~/lib/utils";
import { useTrip } from "~/providers/trip-provider";

const NAV_ITEMS = [
  { name: "Baza", href: "/", icon: Home },
  { name: "Punktacja", href: "/scoreboard", icon: Trophy },
  { name: "Lista zakupów", href: "/shopping", icon: ShoppingBasket },
  { name: "Skarbiec", href: "/finances", icon: Landmark },
];

export function BottomNav() {
  const pathname = usePathname();
  const { activeSession } = useTrip();

  if (!activeSession) return null;

  return (
    <nav className="bg-theme-bg/90 border-theme-border pb-safe fixed bottom-0 left-0 z-50 w-full border-t px-6 pt-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-around pt-2 pb-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors duration-200",
                isActive ? "text-theme-primary" : "text-theme-muted hover:text-theme-text",
              )}
            >
              <div
                className={cn(
                  "rounded-2xl p-2 transition-all duration-300",
                  isActive && "bg-theme-primary/15",
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
