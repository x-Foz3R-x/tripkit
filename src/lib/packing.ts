import type { Json } from "~/types/database";

export const PACKING_PRESET_KEYS = [
  "essentials",
  "beach",
  "abroad",
  "active",
  "camping",
  "car",
] as const;

export type PackingPresetKey = (typeof PACKING_PRESET_KEYS)[number];

export type PackingPresetItem = {
  key: string;
  label: string;
  category: string;
};

export type PackingPreset = {
  key: PackingPresetKey;
  name: string;
  description: string;
  items: PackingPresetItem[];
};

export const PACKING_PRESETS: PackingPreset[] = [
  {
    key: "essentials",
    name: "Niezbędniki",
    description: "Podstawa każdego wyjazdu.",
    items: [
      { key: "phone", label: "Telefon", category: "Niezbędniki" },
      { key: "wallet", label: "Portfel lub karta", category: "Niezbędniki" },
      { key: "documents", label: "Dokument tożsamości", category: "Niezbędniki" },
      { key: "charger", label: "Ładowarka i kable", category: "Elektronika" },
      { key: "powerbank", label: "Powerbank", category: "Elektronika" },
      { key: "medicines", label: "Przyjmowane leki", category: "Zdrowie" },
      { key: "toothbrush", label: "Szczoteczka i pasta", category: "Kosmetyczka" },
      { key: "deodorant", label: "Dezodorant", category: "Kosmetyczka" },
      { key: "underwear", label: "Bielizna i skarpetki", category: "Ubrania" },
      { key: "warm-layer", label: "Coś cieplejszego", category: "Ubrania" },
    ],
  },
  {
    key: "beach",
    name: "Plaża i woda",
    description: "Nad jezioro, morze lub basen.",
    items: [
      { key: "swimsuit", label: "Strój kąpielowy", category: "Nad wodę" },
      { key: "towel", label: "Ręcznik", category: "Nad wodę" },
      { key: "flip-flops", label: "Klapki", category: "Nad wodę" },
      { key: "sunscreen", label: "Krem z filtrem", category: "Nad wodę" },
      { key: "sunglasses", label: "Okulary przeciwsłoneczne", category: "Nad wodę" },
      { key: "water-bottle", label: "Butelka na wodę", category: "Nad wodę" },
    ],
  },
  {
    key: "abroad",
    name: "Za granicę",
    description: "Dokumenty, łączność i rezerwacje.",
    items: [
      { key: "passport", label: "Paszport lub dowód", category: "Dokumenty" },
      { key: "insurance", label: "Ubezpieczenie lub EKUZ", category: "Dokumenty" },
      { key: "tickets", label: "Bilety i potwierdzenia rezerwacji", category: "Dokumenty" },
      { key: "roaming", label: "Roaming, eSIM lub pakiet internetu", category: "Elektronika" },
      { key: "adapter", label: "Adapter do gniazdka", category: "Elektronika" },
      { key: "currency", label: "Karta lub lokalna waluta", category: "Finanse" },
    ],
  },
  {
    key: "active",
    name: "Góry i aktywnie",
    description: "Na szlak i dłuższy dzień poza bazą.",
    items: [
      { key: "trail-shoes", label: "Wygodne buty", category: "Aktywnie" },
      { key: "rain-jacket", label: "Kurtka przeciwdeszczowa", category: "Aktywnie" },
      { key: "daypack", label: "Mały plecak", category: "Aktywnie" },
      { key: "first-aid", label: "Mała apteczka", category: "Aktywnie" },
      { key: "headlamp", label: "Latarka lub czołówka", category: "Aktywnie" },
      { key: "snacks", label: "Przekąski na drogę", category: "Aktywnie" },
    ],
  },
  {
    key: "camping",
    name: "Nocleg i kemping",
    description: "Kiedy nocleg wymaga własnego wyposażenia.",
    items: [
      { key: "sleeping-bag", label: "Śpiwór", category: "Nocleg" },
      { key: "pillow", label: "Poduszka", category: "Nocleg" },
      { key: "tent", label: "Namiot i śledzie", category: "Nocleg" },
      { key: "earplugs", label: "Zatyczki do uszu", category: "Nocleg" },
      { key: "mosquito", label: "Środek na komary", category: "Nocleg" },
    ],
  },
  {
    key: "car",
    name: "Samochodem",
    description: "Rzeczy przydatne w podróży autem.",
    items: [
      { key: "driving-license", label: "Prawo jazdy", category: "Samochód" },
      { key: "car-documents", label: "Dokumenty samochodu", category: "Samochód" },
      { key: "car-charger", label: "Ładowarka samochodowa", category: "Samochód" },
      { key: "offline-map", label: "Mapa offline", category: "Samochód" },
      { key: "car-water", label: "Woda na drogę", category: "Samochód" },
    ],
  },
];

export function parsePackingPresetKeys(value: Json | null | undefined): PackingPresetKey[] {
  if (!Array.isArray(value)) return ["essentials"];

  const allowed = new Set<string>(PACKING_PRESET_KEYS);
  return value.filter(
    (key): key is PackingPresetKey => typeof key === "string" && allowed.has(key),
  );
}

export function getPackingPresetItems(keys: PackingPresetKey[]) {
  const items = new Map<string, PackingPresetItem>();

  for (const preset of PACKING_PRESETS) {
    if (!keys.includes(preset.key)) continue;
    for (const item of preset.items) {
      items.set(item.key, item);
    }
  }

  return [...items.values()];
}
