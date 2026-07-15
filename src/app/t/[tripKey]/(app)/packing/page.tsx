"use client";

import { useEffect, useState } from "react";
import { Backpack, Trash2 } from "lucide-react";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
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
    items: ["Bielizna", "Kąpielówki", "Klapki", "Coś ciepłego"],
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

export default function PackingPage() {
  const { tripId, userId } = useTripRoute();
  const [mounted, setMounted] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const storageKey = `packing-list_${tripId}_${userId ?? "anonymous"}`;

  useEffect(() => {
    const savedData = getAppStorageItem(storageKey) ?? getAppStorageItem("packing-list");
    if (savedData) {
      try {
        setCheckedItems(JSON.parse(savedData) as Record<string, boolean>);
        setAppStorageItem(storageKey, savedData);
        removeAppStorageItem("packing-list");
      } catch (e) {
        console.error("Błąd wczytywania listy pakowania", e);
      }
    }
    setMounted(true);
  }, [storageKey]);

  const handleToggle = (item: string, isChecked: boolean) => {
    const newCheckedItems = { ...checkedItems, [item]: isChecked };
    setCheckedItems(newCheckedItems);
    setAppStorageItem(storageKey, JSON.stringify(newCheckedItems));
  };

  const handleClear = () => {
    if (confirm("Na pewno chcesz zresetować swoją listę do spakowania?")) {
      setCheckedItems({});
      removeAppStorageItem(storageKey);
    }
  };

  if (!mounted) return <Skeleton className="mt-4 h-96 w-full rounded-2xl" />;

  const totalItems = PACKING_LIST.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((checkedCount / totalItems) * 100) || 0;

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <header className="flex flex-col gap-3 pt-4 pb-2">
        <div className="flex items-center justify-between pb-2">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-theme-text text-5xl font-semibold">Pakowanie</h1>
          </div>

          <Button
            onClick={handleClear}
            variant="secondary"
            size="icon"
            className="text-theme-muted active:scale-95"
            aria-label="Dodaj nowy wydatek"
          >
            <Trash2 size={20} />
          </Button>
        </div>

        {/* --- PASEK POSTĘPU --- */}
        <div className="border-theme-primary/20 bg-theme-primary/5 mt-2 flex flex-col gap-2 rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <div className="text-theme-primary flex items-center gap-2">
              <Backpack size={16} />
              <span className="font-body text-sm font-bold tracking-wider uppercase">
                Twój ekwipunek
              </span>
            </div>
            <span className="text-theme-text font-mono font-bold">{progressPercent}%</span>
          </div>
          <div className="bg-theme-bg/50 h-2.5 w-full overflow-hidden rounded-full">
            <div
              className="from-theme-primary to-theme-accent h-full rounded-full bg-linear-to-r transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="font-body text-theme-muted mt-0.5 text-right text-xs">
            Spakowano {checkedCount} z {totalItems} rzeczy
          </p>
        </div>
      </header>

      {/* --- LISTA KATEGORII --- */}
      <section className="flex flex-col gap-5">
        {PACKING_LIST.map((category) => {
          const catCheckedCount = category.items.filter((item) => checkedItems[item]).length;
          const isCatDone = catCheckedCount === category.items.length;

          return (
            <div
              key={category.category}
              className={`bg-theme-card flex flex-col gap-2 rounded-2xl border p-5 transition-all duration-300 ${
                isCatDone ? "border-theme-success/25 opacity-60" : "border-theme-border shadow-sm"
              }`}
            >
              <h2 className="font-body text-theme-text mb-1 text-lg font-bold">
                {category.category}
              </h2>

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
      </section>
    </div>
  );
}
