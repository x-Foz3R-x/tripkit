"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Backpack,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Copy,
  Dices,
  EyeOff,
  KeyRound,
  LayoutGrid,
  MapPin,
  Music2,
  Pencil,
  Plus,
  ReceiptText,
  Save,
  Settings2,
  Share2,
  ShoppingBasket,
  Sparkles,
  Trash2,
  Trophy,
  UserRound,
  UsersRound,
  Vote,
  type LucideIcon,
} from "lucide-react";
import {
  addParticipantAction,
  deleteParticipantAction,
  updateParticipantAction,
  updateParticipantProfileAction,
  updateTripSettingsAction,
} from "~/app/actions/trips";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { DateRangePicker } from "~/components/date-range-picker";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { PlaylistSettings } from "~/components/modules/settings/playlist-settings";
import {
  getFinanceModeLabel,
  getSettlementStrategyLabel,
  type FinanceMode,
  type SettlementStrategy,
} from "~/lib/finances";
import {
  TRIP_MODULES,
  TRIP_NAVIGATION_KEYS,
  type GameplayDashboardWidgetKey,
  type TripModuleKey,
  type TripModules,
  type TripNavigationKey,
} from "~/lib/trip-config";
import { cn } from "~/lib/utils";

type SettingsView =
  | "menu"
  | "profile"
  | "details"
  | "modules"
  | "widgets"
  | "finances"
  | "playlists"
  | "participants";

type TripSettingsState = {
  name: string;
  startDate: string;
  endDate: string;
  destinationName: string;
  destinationAddress: string;
  destinationMapUrl: string;
  playlistUrl: string;
  financeMode: FinanceMode;
  settlementStrategy: SettlementStrategy;
  modules: TripModules;
  dashboardWidgets: GameplayDashboardWidgetKey[];
  navigation: TripNavigationKey[];
};

type Feedback = { type: "success" | "error"; text: string } | null;
type ManagedParticipant = {
  id: string;
  name: string;
  isAdmin: boolean;
  lastSeenAt: string | null;
  userPin: string | null;
};

const ICONS: Record<TripModuleKey, LucideIcon> = {
  schedule: CalendarDays,
  shopping: ShoppingBasket,
  scoreboard: Trophy,
  finances: ReceiptText,
  packing: Backpack,
  quests: Sparkles,
  playlist: Music2,
};

const GAMEPLAY_WIDGETS: Array<{
  key: GameplayDashboardWidgetKey;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    key: "scoreboard",
    label: "Punktacja",
    description: "Wyniki i drużyny.",
    icon: Trophy,
  },
  {
    key: "quests",
    label: "Wyzwania",
    description: "Zadania dla osób lub drużyn.",
    icon: Sparkles,
  },
  {
    key: "polls",
    label: "Głosowania",
    description: "Wspólne decyzje ekipy.",
    icon: Vote,
  },
  {
    key: "wheel",
    label: "Koło fortuny",
    description: "Losowanie jednej z osób.",
    icon: Dices,
  },
];

export function TripSettings({
  tripKey,
  isAdmin,
  currentUserId,
  initialProfile,
  initialTrip,
  participants,
}: {
  tripKey: string;
  isAdmin: boolean;
  currentUserId: string;
  initialProfile: { name: string; avatarUrl: string | null };
  initialTrip: {
    name: string;
    startDate: string | null;
    endDate: string | null;
    destinationName: string | null;
    destinationAddress: string | null;
    destinationMapUrl: string | null;
    playlistUrl: string | null;
    financeMode: FinanceMode;
    settlementStrategy: SettlementStrategy;
    playlists: Array<{ id: string; name: string; url: string }>;
    modules: TripModules;
    dashboardWidgets: GameplayDashboardWidgetKey[];
    navigation: TripNavigationKey[];
    joinPin: string | null;
    inviteToken: string | null;
    financeEntryCount: number;
  };
  participants: ManagedParticipant[];
}) {
  const router = useRouter();
  const [view, setView] = useState<SettingsView>("menu");
  const [profile, setProfile] = useState({
    name: initialProfile.name,
    avatarUrl: initialProfile.avatarUrl ?? "",
  });
  const [form, setForm] = useState<TripSettingsState>({
    name: initialTrip.name,
    startDate: initialTrip.startDate ?? "",
    endDate: initialTrip.endDate ?? "",
    destinationName: initialTrip.destinationName ?? "",
    destinationAddress: initialTrip.destinationAddress ?? "",
    destinationMapUrl: initialTrip.destinationMapUrl ?? "",
    playlistUrl: initialTrip.playlistUrl ?? "",
    financeMode: initialTrip.financeMode,
    settlementStrategy: initialTrip.settlementStrategy,
    modules: initialTrip.modules,
    dashboardWidgets: initialTrip.dashboardWidgets,
    navigation: initialTrip.navigation,
  });
  const [activityNow, setActivityNow] = useState(() => Date.now());
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const nullable = (value: string) => value.trim() || null;

  useEffect(() => {
    const interval = window.setInterval(() => setActivityNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const openView = (nextView: SettingsView) => {
    setFeedback(null);
    setView(nextView);
  };

  const navigationOrder = [
    ...form.navigation.filter((key) => form.modules[key]),
    ...TRIP_NAVIGATION_KEYS.filter((key) => form.modules[key] && !form.navigation.includes(key)),
  ];

  const toggleModule = (key: TripModuleKey) => {
    setForm((current) => {
      const enabled =
        key === "scoreboard"
          ? !(current.modules.scoreboard || current.modules.quests)
          : !current.modules[key];
      const modules = {
        ...current.modules,
        [key]: enabled,
        ...(key === "scoreboard" ? { quests: enabled } : {}),
      };
      const navigation = isNavigationKey(key)
        ? enabled
          ? current.navigation.includes(key)
            ? current.navigation
            : [...current.navigation, key]
          : current.navigation.filter((item) => item !== key)
        : current.navigation;

      return {
        ...current,
        modules,
        navigation,
        dashboardWidgets:
          key === "scoreboard"
            ? enabled
              ? current.dashboardWidgets.length > 0
                ? current.dashboardWidgets
                : ["scoreboard"]
              : []
            : current.dashboardWidgets,
      };
    });
  };

  const moveNavigation = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= navigationOrder.length) return;

    const nextOrder = [...navigationOrder];
    const currentItem = nextOrder[index];
    const targetItem = nextOrder[targetIndex];
    if (!currentItem || !targetItem) return;
    nextOrder[index] = targetItem;
    nextOrder[targetIndex] = currentItem;
    setForm((current) => ({ ...current, navigation: nextOrder }));
  };

  const toggleWidget = (key: GameplayDashboardWidgetKey) => {
    setForm((current) => {
      const isEnabled = current.dashboardWidgets.includes(key);
      if (isEnabled && current.dashboardWidgets.length === 1) {
        setFeedback({
          type: "error",
          text: "Rozgrywka potrzebuje przynajmniej jednego aktywnego elementu.",
        });
        return current;
      }

      setFeedback(null);
      return {
        ...current,
        dashboardWidgets: isEnabled
          ? current.dashboardWidgets.filter((widget) => widget !== key)
          : [...current.dashboardWidgets, key],
      };
    });
  };

  const saveTrip = async () => {
    if (!isAdmin) return;
    if (form.name.trim().length < 2) {
      setFeedback({ type: "error", text: "Nazwa wyjazdu musi mieć co najmniej 2 znaki." });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    const result = await updateTripSettingsAction({
      tripKey,
      name: form.name,
      startDate: nullable(form.startDate),
      endDate: nullable(form.endDate),
      destinationName: nullable(form.destinationName),
      destinationAddress: nullable(form.destinationAddress),
      destinationMapUrl: nullable(form.destinationMapUrl),
      playlistUrl: nullable(form.playlistUrl),
      financeMode: form.financeMode,
      settlementStrategy: form.settlementStrategy,
      modules: form.modules,
      dashboardWidgets: form.dashboardWidgets,
      navigation: navigationOrder,
    });

    setIsSaving(false);
    if (!result.ok) {
      setFeedback({ type: "error", text: result.error });
      return;
    }

    setFeedback({ type: "success", text: "Zmiany zostały zapisane." });
    router.refresh();
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setFeedback(null);
    const result = await updateParticipantProfileAction({
      tripKey,
      name: profile.name,
      avatarUrl: nullable(profile.avatarUrl),
    });

    setIsSaving(false);
    if (!result.ok) {
      setFeedback({ type: "error", text: result.error });
      return;
    }

    setFeedback({ type: "success", text: "Profil został zapisany." });
    router.refresh();
  };

  if (view === "menu") {
    return (
      <SettingsPage>
        <SettingsHeader
          title="Ustawienia"
          subtitle={isAdmin ? "Twój profil i ustawienia wyjazdu" : "Twój profil w tym wyjeździe"}
          backHref={`/t/${tripKey}`}
        />

        {isAdmin && initialTrip.joinPin && initialTrip.inviteToken && (
          <TripInviteSettingsCard
            tripName={form.name}
            joinPin={initialTrip.joinPin}
            inviteToken={initialTrip.inviteToken}
          />
        )}

        <SettingsMenu>
          <SettingsMenuItem
            icon={UserRound}
            title="Mój profil"
            description="Nazwa i avatar widoczne dla ekipy"
            onClick={() => openView("profile")}
          />
          {isAdmin && (
            <>
              <SettingsMenuItem
                icon={Settings2}
                title="Informacje o wyjeździe"
                description="Nazwa, termin i miejsce docelowe"
                onClick={() => openView("details")}
              />
              <SettingsMenuItem
                icon={Sparkles}
                title="Moduły i nawigacja"
                description="Funkcje wyjazdu i kolejność dolnego paska"
                onClick={() => openView("modules")}
              />
              {form.modules.scoreboard && (
                <SettingsMenuItem
                  icon={LayoutGrid}
                  title="Elementy Rozgrywki"
                  description="Punktacja, wyzwania, głosowania i koło"
                  onClick={() => openView("widgets")}
                />
              )}
              {form.modules.finances && (
                <SettingsMenuItem
                  icon={ReceiptText}
                  title="Rozliczenia"
                  description={`${getFinanceModeLabel(form.financeMode)} · ${getSettlementStrategyLabel(form.settlementStrategy)}`}
                  onClick={() => openView("finances")}
                />
              )}
              <SettingsMenuItem
                icon={Music2}
                title="Playlisty"
                description="Soundtracki dostępne dla całej ekipy"
                onClick={() => openView("playlists")}
              />
              <SettingsMenuItem
                icon={UsersRound}
                title="Uczestnicy"
                description="Dodawanie, edycja, aktywność i PIN-y osób"
                onClick={() => openView("participants")}
              />
            </>
          )}
        </SettingsMenu>
      </SettingsPage>
    );
  }

  if (view === "profile") {
    return (
      <SettingsPage>
        <SettingsHeader title="Mój profil" onBack={() => openView("menu")} />
        <FeedbackBanner feedback={feedback} />
        <SettingsCard>
          <div className="flex items-center gap-3">
            <Avatar
              user={{
                id: `${tripKey}-${initialProfile.name}`,
                name: profile.name || initialProfile.name,
                avatarUrl: nullable(profile.avatarUrl),
              }}
              className="h-16 w-16 text-2xl"
            />
            <div>
              <p className="text-theme-text font-bold">{profile.name || "Twój profil"}</p>
              <p className="text-theme-muted text-xs">Widoczny tylko w tym wyjeździe</p>
            </div>
          </div>
          <Input
            label="Nazwa"
            value={profile.name}
            onChange={(event) => setProfile({ ...profile, name: event.target.value })}
          />
          <Input
            type="url"
            label="Link do avatara"
            value={profile.avatarUrl}
            onChange={(event) => setProfile({ ...profile, avatarUrl: event.target.value })}
            placeholder="https://..."
          />
          <p className="text-theme-muted text-xs">
            Zostaw link pusty, aby korzystać z kolorowego avatara z pierwszą literą nazwy.
          </p>
        </SettingsCard>
        <SaveButton isSaving={isSaving} onClick={() => void saveProfile()} label="Zapisz profil" />
      </SettingsPage>
    );
  }

  if (view === "details") {
    return (
      <SettingsPage>
        <SettingsHeader title="Informacje o wyjeździe" onBack={() => openView("menu")} />
        <FeedbackBanner feedback={feedback} />
        <SettingsCard>
          <Input
            label="Nazwa wyjazdu"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <DateRangePicker
            value={{
              from: form.startDate ? parseISO(form.startDate) : undefined,
              to: form.endDate ? parseISO(form.endDate) : undefined,
            }}
            onChange={(range) =>
              setForm({
                ...form,
                startDate: range.from ? format(range.from, "yyyy-MM-dd") : "",
                endDate: range.to ? format(range.to, "yyyy-MM-dd") : "",
              })
            }
          />
        </SettingsCard>
        <SettingsCard title="Miejsce docelowe" icon={MapPin}>
          <Input
            label="Nazwa miejsca"
            value={form.destinationName}
            onChange={(event) => setForm({ ...form, destinationName: event.target.value })}
          />
          <Input
            label="Adres"
            value={form.destinationAddress}
            onChange={(event) => setForm({ ...form, destinationAddress: event.target.value })}
          />
          <Input
            type="url"
            label="Link do mapy"
            value={form.destinationMapUrl}
            onChange={(event) => setForm({ ...form, destinationMapUrl: event.target.value })}
          />
        </SettingsCard>
        <SaveButton isSaving={isSaving} onClick={() => void saveTrip()} />
      </SettingsPage>
    );
  }

  if (view === "modules") {
    return (
      <SettingsPage>
        <SettingsHeader title="Moduły i nawigacja" onBack={() => openView("menu")} />
        <FeedbackBanner feedback={feedback} />
        <SettingsCard title="Aktywne moduły" icon={Sparkles}>
          <div className="grid grid-cols-2 gap-2">
            {TRIP_MODULES.filter((module) => module.key !== "quests").map((module) => {
              const Icon = ICONS[module.key];
              const enabled =
                module.key === "scoreboard"
                  ? form.modules.scoreboard || form.modules.quests
                  : form.modules[module.key];
              return (
                <button
                  key={module.key}
                  type="button"
                  onClick={() => toggleModule(module.key)}
                  className={cn(
                    "relative flex min-h-24 flex-col items-start justify-between rounded-xl border p-3 text-left",
                    enabled
                      ? "border-theme-primary/40 bg-theme-primary/10"
                      : "border-theme-border bg-theme-bg/30",
                  )}
                >
                  <Icon className={enabled ? "text-theme-primary" : "text-theme-muted"} size={18} />
                  <span className="text-theme-text pr-5 text-xs font-bold">{module.name}</span>
                  {enabled && (
                    <Check className="text-theme-primary absolute top-2 right-2" size={15} />
                  )}
                </button>
              );
            })}
          </div>
        </SettingsCard>

        <SettingsCard title="Kolejność nawigacji" icon={LayoutGrid}>
          <p className="text-theme-muted text-xs">
            Pierwsze trzy aktywne moduły trafiają na dolny pasek. Pozostałe są zawsze dostępne w
            „Więcej”.
          </p>
          {navigationOrder.length === 0 ? (
            <p className="border-theme-border text-theme-muted rounded-xl border border-dashed p-4 text-center text-xs">
              Włącz Zakupy, Rozgrywkę, Rozliczenia lub Harmonogram.
            </p>
          ) : (
            <div className="border-theme-border divide-theme-border divide-y overflow-hidden rounded-xl border">
              {navigationOrder.map((key, index) => {
                const module = TRIP_MODULES.find((item) => item.key === key);
                const Icon = ICONS[key];
                return (
                  <div key={key} className="flex min-h-16 items-center gap-3 px-3 py-2">
                    <span className="bg-theme-primary/10 text-theme-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-theme-text block truncate text-sm font-bold">
                        {module?.shortName ?? key}
                      </span>
                      <span className="text-theme-muted block text-[10px]">
                        {index < 3 ? `Pozycja ${index + 1} na pasku` : "Dostępny w Więcej"}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => moveNavigation(index, -1)}
                      disabled={index === 0}
                      className="text-theme-muted flex h-10 w-10 items-center justify-center disabled:opacity-25"
                      aria-label={`Przesuń ${module?.shortName ?? key} wyżej`}
                    >
                      <ArrowUp size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveNavigation(index, 1)}
                      disabled={index === navigationOrder.length - 1}
                      className="text-theme-muted flex h-10 w-10 items-center justify-center disabled:opacity-25"
                      aria-label={`Przesuń ${module?.shortName ?? key} niżej`}
                    >
                      <ArrowDown size={17} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </SettingsCard>
        <SaveButton isSaving={isSaving} onClick={() => void saveTrip()} />
      </SettingsPage>
    );
  }

  if (view === "widgets") {
    return (
      <SettingsPage>
        <SettingsHeader title="Elementy Rozgrywki" onBack={() => openView("menu")} />
        <FeedbackBanner feedback={feedback} />
        <p className="text-theme-muted text-sm">
          Wybierz funkcje dostępne w całej Rozgrywce. Ich skróty pojawią się też automatycznie w
          Bazie.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {GAMEPLAY_WIDGETS.map(({ key, label, icon: Icon, description }) => {
            const visible = form.dashboardWidgets.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleWidget(key)}
                className={cn(
                  "relative flex min-h-28 flex-col items-start justify-between rounded-xl border p-3 text-left",
                  visible
                    ? "border-theme-primary/40 bg-theme-primary/10"
                    : "border-theme-border bg-theme-card",
                )}
              >
                <span className="bg-theme-primary/10 text-theme-primary flex h-9 w-9 items-center justify-center rounded-xl">
                  <Icon size={16} />
                </span>
                <span className="mt-3 pr-4">
                  <span className="text-theme-text block text-xs font-bold">{label}</span>
                  <span className="text-theme-muted mt-0.5 block text-[10px] leading-snug">
                    {description}
                  </span>
                </span>
                {visible && (
                  <Check className="text-theme-primary absolute right-3 bottom-3" size={14} />
                )}
              </button>
            );
          })}
        </div>
        <SaveButton isSaving={isSaving} onClick={() => void saveTrip()} />
      </SettingsPage>
    );
  }

  if (view === "finances") {
    return (
      <SettingsPage>
        <SettingsHeader title="Rozliczenia" onBack={() => openView("menu")} />
        <FeedbackBanner feedback={feedback} />

        {form.financeMode === "legacy" && (
          <div className="border-theme-primary/30 bg-theme-primary/8 rounded-2xl border p-4">
            <p className="text-theme-text text-sm font-bold">Dotychczasowy sposób liczenia</p>
            <p className="text-theme-muted mt-1 text-xs leading-relaxed">
              {initialTrip.financeEntryCount > 0
                ? "Ten wyjazd zachowuje stare rozliczenia, aby historia rachunków pozostała bez zmian."
                : "Rozliczenia są jeszcze puste, więc możesz bezpiecznie wybrać nowy sposób liczenia."}
            </p>
          </div>
        )}

        <SettingsCard title="Sposób dzielenia rachunków" icon={CircleDollarSign}>
          <FinanceModeOption
            selected={form.financeMode === "whole"}
            disabled={initialTrip.financeEntryCount > 0}
            title="Pełne złotówki"
            badge="Polecane"
            description="Kwoty i przelewy bez groszy. Każdy ma równy udział, a końcówkę z dzielenia bierze płatnik."
            onSelect={() => setForm((current) => ({ ...current, financeMode: "whole" }))}
          />
          <FinanceModeOption
            selected={form.financeMode === "precise"}
            disabled={initialTrip.financeEntryCount > 0}
            title="Dokładnie do grosza"
            description="Cały rachunek jest rozliczany co do grosza. Dobre, gdy grupa chce pełnej precyzji."
            onSelect={() => setForm((current) => ({ ...current, financeMode: "precise" }))}
          />
        </SettingsCard>

        <SettingsCard title="Proponowane przelewy" icon={ArrowUp}>
          <FinanceModeOption
            selected={form.settlementStrategy === "relational"}
            title="Między właściwymi osobami"
            badge="Domyślnie"
            description="Każdy oddaje bezpośrednio tym osobom, które rzeczywiście płaciły za jego część."
            onSelect={() =>
              setForm((current) => ({ ...current, settlementStrategy: "relational" }))
            }
          />
          <FinanceModeOption
            selected={form.settlementStrategy === "optimized"}
            title="Mniej przelewów"
            description="Aplikacja zachowuje końcowe bilanse, ale skraca łańcuch długów i ogranicza liczbę przelewów."
            onSelect={() => setForm((current) => ({ ...current, settlementStrategy: "optimized" }))}
          />
        </SettingsCard>

        {initialTrip.financeEntryCount > 0 && (
          <p className="text-theme-muted border-theme-border rounded-xl border px-4 py-3 text-xs leading-relaxed">
            Sposób zaokrąglania zostaje zablokowany po pierwszym wpisie, aby późniejsza zmiana nie
            naruszyła historii rachunków. Strategię przelewów możesz zmieniać w dowolnym momencie,
            bo nie modyfikuje zapisanych wydatków.
          </p>
        )}

        <SaveButton isSaving={isSaving} onClick={() => void saveTrip()} />
      </SettingsPage>
    );
  }

  if (view === "playlists") {
    return (
      <SettingsPage>
        <SettingsHeader title="Playlisty" onBack={() => openView("menu")} />
        {form.modules.playlist ? (
          <SettingsCard>
            <p className="text-theme-muted text-xs">
              Dodaj tyle soundtracków, ile potrzebuje ten wyjazd.
            </p>
            <PlaylistSettings tripKey={tripKey} playlists={initialTrip.playlists} />
          </SettingsCard>
        ) : (
          <SettingsCard>
            <p className="text-theme-muted text-sm">
              Moduł playlist jest wyłączony. Włącz go najpierw w „Moduły i nawigacja”.
            </p>
            <Button type="button" variant="outline" onClick={() => openView("modules")}>
              Przejdź do modułów
            </Button>
          </SettingsCard>
        )}
      </SettingsPage>
    );
  }

  return (
    <SettingsPage>
      <SettingsHeader title="Uczestnicy" onBack={() => openView("menu")} />
      <ParticipantManager
        tripKey={tripKey}
        currentUserId={currentUserId}
        participants={participants}
        activityNow={activityNow}
      />
    </SettingsPage>
  );
}

function TripInviteSettingsCard({
  tripName,
  joinPin,
  inviteToken,
}: {
  tripName: string;
  joinPin: string;
  inviteToken: string;
}) {
  const [feedback, setFeedback] = useState<"pin" | "link" | null>(null);

  const showFeedback = (value: "pin" | "link") => {
    setFeedback(value);
    window.setTimeout(() => setFeedback(null), 1800);
  };

  const copy = async (value: "pin" | "link") => {
    try {
      await navigator.clipboard.writeText(
        value === "pin" ? joinPin : `${window.location.origin}/join/${inviteToken}`,
      );
      showFeedback(value);
    } catch {
      // Schowek może być niedostępny bez zgody przeglądarki.
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/join/${inviteToken}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Dołącz do wyjazdu ${tripName}`, url });
        return;
      } catch (error) {
        if (error && typeof error === "object" && "name" in error && error.name === "AbortError") {
          return;
        }
      }
    }
    await copy("link");
  };

  return (
    <section className="bg-theme-card border-theme-border rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-theme-primary text-[10px] font-bold tracking-[0.16em] uppercase">
            Zaproszenie do wyjazdu
          </p>
          <p className="text-theme-muted mt-1 text-xs">Wyślij link albo podaj 6-cyfrowy PIN.</p>
        </div>
        <button
          type="button"
          onClick={() => void share()}
          className="border-theme-border text-theme-muted hover:text-theme-text flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
          aria-label="Udostępnij zaproszenie"
        >
          <Share2 size={17} />
        </button>
      </div>
      <div className="border-theme-border mt-4 flex min-h-14 items-center justify-between rounded-xl border px-3">
        <span className="text-theme-text font-mono text-lg font-bold tracking-[0.2em]">
          {joinPin}
        </span>
        <button
          type="button"
          onClick={() => void copy("pin")}
          className="text-theme-muted hover:text-theme-text flex min-h-11 items-center gap-2 px-2 text-xs font-bold"
        >
          {feedback === "pin" ? <Check size={16} /> : <Copy size={16} />}
          {feedback === "pin" ? "Skopiowano" : "Kopiuj PIN"}
        </button>
      </div>
    </section>
  );
}

function ParticipantManager({
  tripKey,
  currentUserId,
  participants,
  activityNow,
}: {
  tripKey: string;
  currentUserId: string;
  participants: ManagedParticipant[];
  activityNow: number;
}) {
  const router = useRouter();
  const [editor, setEditor] = useState<{ userId: string | null } | null>(null);
  const [name, setName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedPins, setRevealedPins] = useState<Set<string>>(new Set());

  const openEditor = (participant?: ManagedParticipant) => {
    setError(null);
    setName(participant?.name ?? "");
    setIsAdmin(participant?.isAdmin ?? false);
    setEditor({ userId: participant?.id ?? null });
  };

  const save = async () => {
    setIsSaving(true);
    setError(null);
    const result = editor?.userId
      ? await updateParticipantAction({
          tripKey,
          userId: editor.userId,
          name,
          isAdmin,
        })
      : await addParticipantAction({ tripKey, name, isAdmin });
    setIsSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setEditor(null);
    router.refresh();
  };

  const remove = async (participant: ManagedParticipant) => {
    if (!window.confirm(`Usunąć uczestnika ${participant.name}?`)) return;
    setIsSaving(true);
    setError(null);
    const result = await deleteParticipantAction({ tripKey, userId: participant.id });
    setIsSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <SettingsCard>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-theme-text text-sm font-bold">Ekipa · {participants.length}</h2>
          <p className="text-theme-muted mt-0.5 text-xs">Profile dostępne przy dołączaniu.</p>
        </div>
        <Button type="button" size="sm" onClick={() => openEditor()} className="gap-1.5">
          <Plus size={16} /> Dodaj
        </Button>
      </div>

      {error && (
        <p className="border-theme-danger/30 bg-theme-danger/10 text-theme-danger rounded-xl border px-3 py-2 text-xs font-bold">
          {error}
        </p>
      )}

      <div className="border-theme-border divide-theme-border divide-y overflow-hidden rounded-xl border px-3">
        {participants.map((participant) => {
          const revealed = revealedPins.has(participant.id);
          return (
            <div key={participant.id} className="flex min-h-19 items-center gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-theme-text truncate text-sm font-bold">
                  {participant.name}
                  {participant.id === currentUserId && (
                    <span className="text-theme-muted ml-1.5 text-[9px] uppercase">Ty</span>
                  )}
                  {participant.isAdmin && (
                    <span className="text-theme-primary ml-1.5 text-[9px] tracking-wider uppercase">
                      Admin
                    </span>
                  )}
                </p>
                <p className="text-theme-muted mt-0.5 truncate text-[10px]">
                  {formatLastSeen(participant.lastSeenAt, activityNow)}
                </p>
                {revealed && (
                  <p className="text-theme-muted mt-1 font-mono text-xs tracking-[0.2em]">
                    {participant.userPin ?? "Nie ustawiono"}
                  </p>
                )}
              </div>

              {participant.userPin && (
                <button
                  type="button"
                  onClick={() =>
                    setRevealedPins((current) => {
                      const next = new Set(current);
                      if (next.has(participant.id)) next.delete(participant.id);
                      else next.add(participant.id);
                      return next;
                    })
                  }
                  className="text-theme-muted hover:text-theme-text flex h-10 w-10 items-center justify-center"
                  aria-label={
                    revealed ? `Ukryj PIN ${participant.name}` : `Pokaż PIN ${participant.name}`
                  }
                >
                  {revealed ? <EyeOff size={16} /> : <KeyRound size={16} />}
                </button>
              )}
              <button
                type="button"
                onClick={() => openEditor(participant)}
                className="text-theme-muted hover:text-theme-text flex h-10 w-10 items-center justify-center"
                aria-label={`Edytuj ${participant.name}`}
              >
                <Pencil size={16} />
              </button>
              {participant.id !== currentUserId && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void remove(participant)}
                  className="text-theme-muted hover:text-theme-danger flex h-10 w-10 items-center justify-center disabled:opacity-40"
                  aria-label={`Usuń ${participant.name}`}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <ResponsiveDialog
        isOpen={editor !== null}
        setIsOpen={(open) => !open && setEditor(null)}
        title={editor?.userId ? "Edytuj uczestnika" : "Nowy uczestnik"}
        description="PIN uczestnika ustawi on sam przy pierwszym wejściu."
      >
        <div className="flex flex-col gap-4">
          {error && (
            <p className="border-theme-danger/30 bg-theme-danger/10 text-theme-danger rounded-xl border px-3 py-2 text-xs font-bold">
              {error}
            </p>
          )}
          <Input
            label="Nazwa"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setIsAdmin((current) => !current)}
            className={cn(
              "border-theme-border flex min-h-12 items-center justify-between rounded-xl border px-3 text-left",
              isAdmin && "border-theme-primary/40 bg-theme-primary/10",
            )}
          >
            <span>
              <span className="text-theme-text block text-sm font-bold">Administrator</span>
              <span className="text-theme-muted block text-[11px]">Może zmieniać cały wyjazd</span>
            </span>
            {isAdmin && <Check className="text-theme-primary" size={17} />}
          </button>
          <Button type="button" onClick={() => void save()} disabled={isSaving || !name.trim()}>
            {isSaving ? "Zapisywanie…" : editor?.userId ? "Zapisz zmiany" : "Dodaj uczestnika"}
          </Button>
        </div>
      </ResponsiveDialog>
    </SettingsCard>
  );
}

function isNavigationKey(key: TripModuleKey): key is TripNavigationKey {
  return (TRIP_NAVIGATION_KEYS as readonly string[]).includes(key);
}

function SettingsPage({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in pb-safe flex flex-col gap-5 pt-2">{children}</div>;
}

function SettingsHeader({
  title,
  subtitle,
  backHref,
  onBack,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
}) {
  const backClassName =
    "bg-theme-card border-theme-border text-theme-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-full border";

  return (
    <header className="flex items-center gap-3">
      {backHref ? (
        <Link href={backHref} className={backClassName} aria-label="Wróć">
          <ArrowLeft size={19} />
        </Link>
      ) : (
        <button type="button" onClick={onBack} className={backClassName} aria-label="Wróć">
          <ArrowLeft size={19} />
        </button>
      )}
      <div className="min-w-0">
        <h1 className="font-heading text-theme-text text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-theme-muted mt-0.5 truncate text-xs">{subtitle}</p>}
      </div>
    </header>
  );
}

function SettingsMenu({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-theme-card border-theme-border divide-theme-border divide-y overflow-hidden rounded-2xl border">
      {children}
    </div>
  );
}

function SettingsMenuItem({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-theme-primary/5 flex min-h-18 w-full items-center gap-3 px-4 py-3 text-left transition active:scale-99"
    >
      <span className="bg-theme-primary/10 text-theme-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-theme-text block truncate text-sm font-bold">{title}</span>
        <span className="text-theme-muted mt-0.5 block truncate text-[11px]">{description}</span>
      </span>
      <ChevronRight className="text-theme-muted shrink-0" size={17} />
    </button>
  );
}

function SettingsCard({
  title,
  icon: Icon,
  children,
}: {
  title?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-theme-card border-theme-border flex flex-col gap-4 rounded-2xl border p-4">
      {title && (
        <h2 className="text-theme-text flex items-center gap-2 text-sm font-bold">
          {Icon && <Icon className="text-theme-primary" size={17} />} {title}
        </h2>
      )}
      {children}
    </section>
  );
}

function FinanceModeOption({
  selected,
  disabled = false,
  title,
  description,
  badge,
  onSelect,
}: {
  selected: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  badge?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "border-theme-border flex min-h-24 w-full items-start gap-3 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55",
        selected && "border-theme-primary/45 bg-theme-primary/10",
      )}
    >
      <span
        className={cn(
          "border-theme-border mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          selected && "border-theme-primary bg-theme-primary text-theme-primary-foreground",
        )}
      >
        {selected && <Check size={13} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-theme-text text-sm font-bold">{title}</span>
          {badge && (
            <span className="bg-theme-primary/12 text-theme-primary rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">
              {badge}
            </span>
          )}
        </span>
        <span className="text-theme-muted mt-1 block text-xs leading-relaxed">{description}</span>
      </span>
    </button>
  );
}

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-bold",
        feedback.type === "success"
          ? "border-theme-success/30 bg-theme-success/10 text-theme-success"
          : "border-theme-danger/30 bg-theme-danger/10 text-theme-danger",
      )}
    >
      {feedback.text}
    </div>
  );
}

function SaveButton({
  isSaving,
  onClick,
  label = "Zapisz ustawienia",
}: {
  isSaving: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button onClick={onClick} disabled={isSaving} size="lg" className="gap-2">
      <Save size={18} /> {isSaving ? "Zapisywanie…" : label}
    </Button>
  );
}

function formatLastSeen(value: string | null, nowTimestamp: number) {
  if (!value) return "Jeszcze niewidziany w aplikacji";

  const seenAt = new Date(value);
  const now = new Date(nowTimestamp);
  const difference = Math.max(0, now.getTime() - seenAt.getTime());
  if (difference < 2 * 60_000) return "Widziany niedawno";

  const minutes = Math.floor(difference / 60_000);
  if (minutes < 60) return `Widziany ${relativeMinutes(minutes)} temu`;

  const hours = Math.floor(difference / 3_600_000);
  if (hours < 24) return `Widziany ${relativeHours(hours)} temu`;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const seenDay = new Date(seenAt.getFullYear(), seenAt.getMonth(), seenAt.getDate()).getTime();
  const days = Math.round((today - seenDay) / 86_400_000);

  if (days === 1) {
    return `Widziany wczoraj o ${seenAt.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  if (days > 1 && days < 7) return `Widziany ${days} dni temu`;
  return `Widziany ${seenAt.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function relativeMinutes(value: number) {
  if (value === 1) return "minutę";
  const lastTwo = value % 100;
  const last = value % 10;
  return last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)
    ? `${value} minuty`
    : `${value} minut`;
}

function relativeHours(value: number) {
  if (value === 1) return "godzinę";
  const lastTwo = value % 100;
  const last = value % 10;
  return last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)
    ? `${value} godziny`
    : `${value} godzin`;
}
