// src/components/bottom-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Coins, Trophy, Scroll } from "lucide-react";
import { cn } from "~/lib/utils";

// To w przyszłości będziemy ładować dynamicznie z bazy w zależności od włączonych modułów!
const NAV_ITEMS = [
  { name: "Baza", href: "/", icon: Home },
  { name: "Kociołek", href: "/finances", icon: Coins },
  { name: "Punkty", href: "/scoreboard", icon: Trophy },
  { name: "Zlecenia", href: "/quests", icon: Scroll },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-white/10 bg-witch-bg/80 px-6 pb-safe pt-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between pb-4 pt-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors duration-200",
                isActive ? "text-witch-primary" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl p-2 transition-all duration-300",
                  isActive && "bg-witch-primary/20"
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