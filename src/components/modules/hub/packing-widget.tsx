// src/components/modules/hub/packing-widget.tsx
"use client";

import { useState, useEffect } from "react";
import { Backpack, ChevronRight } from "lucide-react";
import { env } from "~/env";
import { DrawerDialog } from "~/components/responsive-dialog";
import { Checkbox } from "~/components/ui/checkbox";

const PACKING_LIST = [
  {
    category: "Niezbędniki",
    items: ["Legitymacja studencka", "Telefon", "Ładowarka + kable"],
  },
  {
    category: "Ubrania",
    items: ["Bielizna", "Kąpielówki", "Klapki", "Ręcznik", "Coś ciepłego"],
  },
  {
    category: "Kosmetyczka",
    items: [
      "Perfumy",
      "Dezodorant",
      "Szczoteczka",
      "Żel pod prysznic / Szampon",
      "Leki osobiste (np. przeciwbólowe)",
    ],
  },
];

export function PackingWidget() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("tripkit_user_id");
    if (storedUserId) {
      setActiveUserId(storedUserId);
      const storageKey = `tripkit_packing_${env.NEXT_PUBLIC_TRIP_ID}_${storedUserId}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        try {
          setCheckedItems(JSON.parse(savedData) as Record<string, boolean>);
        } catch (e) {
          console.error(e);
        }
      }
    }
    setMounted(true);
  }, [isOpen]);

  const handleToggle = (item: string, isChecked: boolean) => {
    if (!activeUserId) return;
    const newCheckedItems = { ...checkedItems, [item]: isChecked };
    setCheckedItems(newCheckedItems);
    const storageKey = `tripkit_packing_${env.NEXT_PUBLIC_TRIP_ID}_${activeUserId}`;
    localStorage.setItem(storageKey, JSON.stringify(newCheckedItems));
  };

  if (!mounted) return null;

  const totalItems = PACKING_LIST.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((checkedCount / totalItems) * 100) || 0;

  return (
    <>
      {/* Przycisk na ekranie głównym */}
      <button
        onClick={() => setIsOpen(true)}
        className="border-theme-primary/20 bg-theme-primary/5 hover:bg-theme-primary/10 flex flex-col gap-3 rounded-2xl border p-5 text-left shadow-sm transition-colors active:scale-[0.98]"
      >
        <div className="flex w-full items-center justify-between">
          <div className="text-theme-primary flex items-center gap-2">
            <Backpack size={18} />
            <span className="font-body text-sm font-bold tracking-wider uppercase">
              Twój Ekwipunek
            </span>
          </div>
          <ChevronRight size={18} className="text-theme-muted" />
        </div>

        <div className="flex w-full items-center justify-between gap-4">
          <div className="bg-theme-bg/50 h-2 flex-1 overflow-hidden rounded-full">
            <div
              className="from-theme-primary to-theme-accent h-full rounded-full bg-linear-to-r transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-theme-text min-w-[4ch] text-right font-mono text-sm font-bold">
            {progressPercent}%
          </span>
        </div>
      </button>

      <DrawerDialog isOpen={isOpen} setIsOpen={setIsOpen}>
        {!activeUserId ? (
          <p className="font-body text-theme-muted p-4 text-center text-sm">
            Wybierz swój profil w Bazie, żeby odblokować pakowanie.
          </p>
        ) : (
          <div className="pb-safe flex max-h-[60vh] flex-col gap-6 overflow-y-auto px-1 pt-2 [&::-webkit-scrollbar]:hidden">
            {PACKING_LIST.map((category) => {
              const isCatDone = category.items.every((item) => checkedItems[item]);
              return (
                <div
                  key={category.category}
                  className={`flex flex-col gap-2 transition-opacity ${isCatDone ? "opacity-50" : "opacity-100"}`}
                >
                  <h3 className="font-body text-theme-text mb-1 border-b border-white/5 pb-1 font-bold">
                    {category.category}
                  </h3>
                  <div className="flex flex-col">
                    {category.items.map((item) => (
                      <Checkbox
                        key={item}
                        id={`pack-${item}`}
                        label={item}
                        checked={!!checkedItems[item]}
                        onChange={(checked) => handleToggle(item, checked)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DrawerDialog>
    </>
  );
}
