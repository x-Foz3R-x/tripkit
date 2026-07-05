"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Landmark, Trophy } from "lucide-react";
import { cn } from "~/lib/utils";

const NAV_ITEMS = [
  { name: "Baza", href: "/", icon: Home },
  { name: "Punktacja", href: "/scoreboard", icon: Trophy },
  // { name: "Zlecenia", href: "/quests", icon: Scroll },
  { name: "Skarbiec", href: "/finances", icon: Landmark },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-witch-bg/80 pb-safe fixed bottom-0 left-0 z-50 w-full border-t border-white/10 px-6 pt-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between pt-2 pb-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors duration-200",
                isActive ? "text-witch-primary" : "text-gray-500 hover:text-gray-300",
              )}
            >
              <div
                className={cn(
                  "rounded-2xl p-2 transition-all duration-300",
                  isActive && "bg-witch-primary/20",
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
