"use client";

import { useState, useEffect } from "react";
import { Backpack, ChevronRight } from "lucide-react";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { Checkbox } from "~/components/ui/checkbox";
import { Skeleton } from "~/components/ui/skeleton";
import { getAppStorageItem, removeAppStorageItem, setAppStorageItem } from "~/lib/storage";
import { useTripRoute } from "~/providers/trip-route-provider";

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
  const { tripId, userId } = useTripRoute();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (userId) {
      const storageKey = `packing-list_${tripId}_${userId}`;
      const legacyStorageKey = `packing_${tripId}_${userId}`;
      const savedData = getAppStorageItem(storageKey) ?? getAppStorageItem(legacyStorageKey);
      if (savedData) {
        try {
          setCheckedItems(JSON.parse(savedData) as Record<string, boolean>);
          setAppStorageItem(storageKey, savedData);
          removeAppStorageItem(legacyStorageKey);
        } catch (e) {
          console.error(e);
        }
      }
    }
    setMounted(true);
  }, [isOpen, tripId, userId]);

  const handleToggle = (item: string, isChecked: boolean) => {
    if (!userId) return;
    const newCheckedItems = { ...checkedItems, [item]: isChecked };
    setCheckedItems(newCheckedItems);
    const storageKey = `packing-list_${tripId}_${userId}`;
    setAppStorageItem(storageKey, JSON.stringify(newCheckedItems));
  };

  if (!mounted) return <Skeleton className="h-28 w-full rounded-2xl" />;

  const totalItems = PACKING_LIST.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((checkedCount / totalItems) * 100) || 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-theme-card border-theme-border flex min-h-28 w-full flex-col justify-between gap-4 rounded-2xl border p-4 text-left transition active:scale-99"
      >
        <div className="flex w-full items-center justify-between">
          <div className="text-theme-primary flex items-center gap-2">
            <Backpack size={18} />
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase">
              Twój ekwipunek
            </span>
          </div>
          <ChevronRight size={18} className="text-theme-muted" />
        </div>

        <div className="flex w-full items-center justify-between gap-4">
          <div className="bg-theme-bg/70 h-2 flex-1 overflow-hidden rounded-full">
            <div
              className="from-theme-primary to-theme-accent h-full rounded-full bg-linear-to-r transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-theme-text min-w-[4ch] text-right font-mono text-sm font-bold">
            {progressPercent}%
          </span>
        </div>
        <p className="text-theme-muted text-xs">
          Spakowano {checkedCount} z {totalItems} rzeczy
        </p>
      </button>

      <ResponsiveDialog isOpen={isOpen} setIsOpen={setIsOpen}>
        {!userId ? (
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
                  <h3 className="font-body text-theme-text border-theme-border mb-1 border-b pb-1 font-bold">
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
      </ResponsiveDialog>
    </>
  );
}
