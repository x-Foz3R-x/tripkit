"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Check, ChevronRight, Lock, Plus, ReceiptText, UsersRound } from "lucide-react";
import {
  createShoppingItemAction,
  getShoppingItemsAction,
  updateShoppingAudienceAction,
} from "~/app/actions/shopping";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { ShoppingList } from "~/components/modules/shopping/shopping-list";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Link } from "~/components/ui/link";
import { createBrowserSupabaseClient } from "~/lib/supabase/client";
import { useTripRoute } from "~/providers/trip-route-provider";
import type { Database } from "~/types/database";
import { cn } from "~/lib/utils";

type ShoppingItem = Database["public"]["Tables"]["shopping_list"]["Row"];
type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name" | "avatar_url">;
type RealtimeStatus = "connecting" | "live" | "fallback";
type PresenceMode = "viewing" | "typing";
type PresencePayload = { userId?: string; mode?: PresenceMode };

export function ShoppingScreen({
  initialItems,
  initialUsers,
}: {
  initialItems: ShoppingItem[];
  initialUsers: User[];
}) {
  const { modules, tripId, urlKey, userId: activeUserId } = useTripRoute();
  const [items, setItems] = useState(initialItems);
  const [itemName, setItemName] = useState("");
  const [forUsers, setForUsers] = useState<string[]>([]);
  const [audienceDraft, setAudienceDraft] = useState<string[]>([]);
  const [editingAudienceItem, setEditingAudienceItem] = useState<ShoppingItem | null>(null);
  const [activeOptionsItemId, setActiveOptionsItemId] = useState<string | null>(null);
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [isSavingAudience, setIsSavingAudience] = useState(false);
  const [audienceError, setAudienceError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("connecting");
  const [presenceModes, setPresenceModes] = useState<Record<string, PresenceMode>>(
    activeUserId ? { [activeUserId]: "viewing" } : {},
  );
  const presenceChannel = useRef<RealtimeChannel | null>(null);
  const ownPresenceMode = useRef<PresenceMode>("viewing");

  const upsertItem = useCallback((nextItem: ShoppingItem) => {
    setItems((current) => {
      const exists = current.some((item) => item.id === nextItem.id);
      const next = exists
        ? current.map((item) => (item.id === nextItem.id ? nextItem : item))
        : [...current, nextItem];
      return next.sort((first, second) => first.created_at.localeCompare(second.created_at));
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }, []);

  const refreshItems = useCallback(async () => {
    const result = await getShoppingItemsAction({ tripKey: urlKey });
    if (result.ok) setItems(result.items);
  }, [urlKey]);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (!activeUserId) return;

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`shopping:${tripId}`, {
        config: { presence: { key: activeUserId } },
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, PresencePayload[]>;
        const nextModes: Record<string, PresenceMode> = {};
        Object.values(state)
          .flat()
          .forEach((presence) => {
            if (!presence.userId) return;
            const mode = presence.mode === "typing" ? "typing" : "viewing";
            if (mode === "typing" || !nextModes[presence.userId]) {
              nextModes[presence.userId] = mode;
            }
          });
        if (document.visibilityState === "visible") {
          nextModes[activeUserId] ??= "viewing";
        }
        setPresenceModes(nextModes);
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shopping_list",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => upsertItem(payload.new as ShoppingItem),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shopping_list",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => upsertItem(payload.new as ShoppingItem),
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "shopping_list",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => removeItem((payload.old as Partial<ShoppingItem>).id ?? ""),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("live");
          if (document.visibilityState === "visible") {
            ownPresenceMode.current = "viewing";
            void channel.track({
              userId: activeUserId,
              mode: "viewing",
              joinedAt: new Date().toISOString(),
            });
          }
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRealtimeStatus("fallback");
          setPresenceModes({ [activeUserId]: "viewing" });
        }
      });
    presenceChannel.current = channel;

    const interval = window.setInterval(() => void refreshItems(), 15_000);
    const refreshOnFocus = () => void refreshItems();
    const updateVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshItems();
        ownPresenceMode.current = "viewing";
        void channel.track({
          userId: activeUserId,
          mode: "viewing",
          joinedAt: new Date().toISOString(),
        });
      } else {
        void channel.untrack();
      }
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", updateVisibility);
      presenceChannel.current = null;
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [activeUserId, refreshItems, removeItem, tripId, upsertItem]);

  const openItems = items.filter((item) => !item.is_completed).length;
  const selectedUsers = useMemo(
    () => initialUsers.filter((user) => forUsers.includes(user.id)),
    [forUsers, initialUsers],
  );
  const onlineUsers = useMemo(
    () =>
      initialUsers
        .filter((user) => Boolean(presenceModes[user.id]))
        .sort(
          (first, second) => Number(second.id === activeUserId) - Number(first.id === activeUserId),
        ),
    [activeUserId, initialUsers, presenceModes],
  );
  const audiencePresets = useMemo(() => {
    const presets = new Map<string, string[]>();
    items.forEach((item) => {
      const ids = [...new Set(item.for_users)].sort();
      if (ids.length === 0) return;
      presets.set(ids.join(":"), ids);
    });
    return [...presets.values()].slice(0, 4);
  }, [items]);

  const addItem = async () => {
    const trimmedName = itemName.trim();
    if (!trimmedName || isAdding) return;

    setIsAdding(true);
    setAddError(null);
    const result = await createShoppingItemAction({
      tripKey: urlKey,
      itemName: trimmedName,
      forUsers,
    });
    setIsAdding(false);

    if (!result.ok) {
      setAddError(result.error);
      return;
    }

    upsertItem(result.item);
    setItemName("");
    updateOwnPresence("viewing");
  };

  const updateOwnPresence = (mode: PresenceMode) => {
    if (ownPresenceMode.current === mode) return;
    ownPresenceMode.current = mode;
    void presenceChannel.current?.track({ userId: activeUserId, mode });
  };

  const openNewAudience = () => {
    setEditingAudienceItem(null);
    setAudienceDraft(forUsers);
    setAudienceError(null);
    setIsAudienceOpen(true);
  };

  const openItemAudience = (item: ShoppingItem) => {
    setActiveOptionsItemId(null);
    setEditingAudienceItem(item);
    setAudienceDraft(item.for_users);
    setAudienceError(null);
    setIsAudienceOpen(true);
  };

  const returnToItemOptions = () => {
    const itemId = editingAudienceItem?.id ?? null;
    setIsAudienceOpen(false);
    setEditingAudienceItem(null);
    setAudienceError(null);
    setActiveOptionsItemId(itemId);
  };

  const saveAudience = async () => {
    const normalizedAudience =
      audienceDraft.length === initialUsers.length ? [] : [...new Set(audienceDraft)].sort();

    if (!editingAudienceItem) {
      setForUsers(normalizedAudience);
      setIsAudienceOpen(false);
      return;
    }

    setIsSavingAudience(true);
    setAudienceError(null);
    const result = await updateShoppingAudienceAction({
      tripKey: urlKey,
      itemId: editingAudienceItem.id,
      forUsers: normalizedAudience,
    });
    setIsSavingAudience(false);
    if (!result.ok) {
      setAudienceError(result.error);
      return;
    }

    upsertItem(result.item);
    setIsAudienceOpen(false);
    setEditingAudienceItem(null);
  };

  if (!modules.shopping || !activeUserId) {
    return (
      <div className="animate-fade-in flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="bg-theme-card text-theme-muted border-theme-border flex h-16 w-16 items-center justify-center rounded-full border shadow-xs">
          <Lock size={28} />
        </div>
        <div>
          <h2 className="font-heading text-theme-text mb-2 text-3xl font-semibold">
            Lista niedostępna
          </h2>
          <p className="font-body text-theme-muted mx-auto mb-6 max-w-64 text-sm">
            Musisz najpierw wybrać swój profil w tym wyjeździe.
          </p>
          <Link.Arrow href={`/t/${urlKey}`} variant="primary" size="base">
            Wróć do Bazy
          </Link.Arrow>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in -mx-4 -mt-4">
      <section className="shopping-notebook relative min-h-[calc(100dvh-6.5rem-env(safe-area-inset-bottom))] overflow-hidden pb-[calc(6.5rem+env(safe-area-inset-bottom))] shadow-none">
        <span className="bg-theme-primary/45 absolute inset-y-0 left-6 w-px" />
        <div className="absolute top-4 left-0 flex w-full justify-around px-8">
          {[0, 1, 2, 3, 4, 5].map((hole) => (
            <span
              key={hole}
              className="bg-theme-bg border-theme-border h-2 w-2 rounded-full border"
            />
          ))}
        </div>

        <header className="px-5 pt-12 pb-4 pl-11">
          <h1 className="font-heading text-theme-text text-3xl font-semibold">Lista zakupów</h1>

          <div className="mt-3 flex min-h-8 items-center justify-between gap-3">
            <div className="flex shrink-0 items-center gap-3 text-xs">
              <span className="text-theme-text font-bold">{openItems} do kupienia</span>
            </div>
            {realtimeStatus === "live" && (
              <div className="flex min-w-0 items-center justify-end gap-2">
                <PresenceAvatars users={onlineUsers} />
                <p className="text-theme-muted truncate text-[10px]">
                  {formatPresenceText(onlineUsers, presenceModes, activeUserId)}
                </p>
              </div>
            )}
          </div>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void addItem();
          }}
          className={cn(
            "border-theme-border/55 border-t px-5 py-3 pl-11",
            openItems > 0 && "border-b",
          )}
        >
          <div className="border-theme-border/80 bg-theme-bg/18 divide-theme-border/70 divide-y overflow-hidden rounded-xl border">
            <div className="flex min-h-12 items-center pl-3">
              <input
                value={itemName}
                onChange={(event) => {
                  setItemName(event.target.value);
                  updateOwnPresence(event.target.value ? "typing" : "viewing");
                }}
                onFocus={() => updateOwnPresence(itemName ? "typing" : "viewing")}
                onBlur={() => updateOwnPresence("viewing")}
                placeholder="Dopisz rzecz…"
                autoComplete="off"
                className="font-note text-theme-text placeholder:text-theme-muted/65 min-w-0 flex-1 bg-transparent text-lg leading-none outline-hidden"
              />
              <button
                type="submit"
                disabled={!itemName.trim() || isAdding}
                className="text-theme-primary hover:bg-theme-primary/7 flex h-12 w-12 shrink-0 items-center justify-center disabled:opacity-25"
                aria-label="Dodaj rzecz do listy"
              >
                <Plus size={18} />
              </button>
            </div>
            <button
              type="button"
              onClick={openNewAudience}
              className="hover:bg-theme-primary/5 flex min-h-10 w-full items-center gap-2 px-3 text-left"
            >
              <ReceiptText className="text-theme-primary shrink-0" size={13} />
              <span className="text-theme-muted min-w-0 flex-1 truncate text-[10px]">
                Rachunek:{" "}
                <span className="text-theme-text font-bold">
                  {forUsers.length === 0
                    ? "wspólny"
                    : `osobny · ${formatAudienceNames(selectedUsers)}`}
                </span>
              </span>
              <ChevronRight className="text-theme-muted shrink-0" size={15} />
            </button>
          </div>
          {addError && <p className="text-theme-danger mt-1 text-xs font-bold">{addError}</p>}
        </form>

        <ShoppingList
          items={items}
          users={initialUsers}
          activeUserId={activeUserId}
          activeOptionsItemId={activeOptionsItemId}
          onOptionsItemChange={setActiveOptionsItemId}
          onItemChanged={upsertItem}
          onItemDeleted={removeItem}
          onEditAudience={openItemAudience}
        />
      </section>

      <ResponsiveDialog
        isOpen={isAudienceOpen}
        setIsOpen={(open) => {
          setIsAudienceOpen(open);
          if (!open) setEditingAudienceItem(null);
        }}
        title={editingAudienceItem ? "Zmień rachunek" : "Wybierz rachunek"}
        description="Wybierz osoby, których ma dotyczyć ta rzecz. Pozycje z tym samym składem pokażemy razem."
        onBack={editingAudienceItem ? returnToItemOptions : undefined}
      >
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setAudienceDraft([])}
            className={cn(
              "border-theme-border flex min-h-14 items-center justify-between rounded-xl border px-3 text-left",
              audienceDraft.length === 0 && "border-theme-primary/40 bg-theme-primary/10",
            )}
          >
            <span>
              <span className="text-theme-text block text-sm font-bold">Rachunek wspólny</span>
              <span className="text-theme-muted mt-0.5 block text-[10px]">Dla całej ekipy</span>
            </span>
            {audienceDraft.length === 0 && <Check className="text-theme-primary" size={17} />}
          </button>

          {audiencePresets.length > 0 && (
            <div>
              <p className="text-theme-muted mb-2 text-[10px] font-bold tracking-wider uppercase">
                Ostatnie podziały
              </p>
              <div className="flex flex-wrap gap-2">
                {audiencePresets.map((preset) => {
                  const selected = sameAudience(audienceDraft, preset);
                  const presetUsers = initialUsers.filter((user) => preset.includes(user.id));
                  return (
                    <button
                      key={preset.join(":")}
                      type="button"
                      onClick={() => setAudienceDraft(preset)}
                      className={cn(
                        "border-theme-border min-h-10 rounded-full border px-3 text-[10px] font-bold",
                        selected &&
                          "border-theme-primary/40 bg-theme-primary/10 text-theme-primary",
                      )}
                    >
                      {formatAudienceNames(presetUsers)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center gap-2">
              <UsersRound className="text-theme-primary" size={15} />
              <p className="text-theme-text text-xs font-bold">Osoby na rachunku</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {initialUsers.map((user) => {
                const selected = audienceDraft.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() =>
                      setAudienceDraft((current) =>
                        selected ? current.filter((id) => id !== user.id) : [...current, user.id],
                      )
                    }
                    className={cn(
                      "border-theme-border flex min-h-13 items-center gap-2 rounded-xl border px-2.5 text-left text-xs font-bold",
                      selected && "border-theme-primary/40 bg-theme-primary/10",
                    )}
                  >
                    <Avatar
                      user={{ id: user.id, name: user.name, avatarUrl: user.avatar_url }}
                      className="h-7 w-7 text-[11px]"
                    />
                    <span className="min-w-0 flex-1 truncate">{user.name}</span>
                    {selected && <Check className="text-theme-primary shrink-0" size={14} />}
                  </button>
                );
              })}
            </div>
          </div>

          {audienceError && <p className="text-theme-danger text-xs font-bold">{audienceError}</p>}
          <Button type="button" disabled={isSavingAudience} onClick={() => void saveAudience()}>
            {editingAudienceItem ? "Zapisz rachunek" : "Użyj tego rachunku"}
          </Button>
        </div>
      </ResponsiveDialog>
    </div>
  );
}

function PresenceAvatars({ users }: { users: User[] }) {
  return (
    <div className="flex shrink-0 -space-x-1.5">
      {users.slice(0, 2).map((user) => (
        <Avatar
          key={user.id}
          user={{ id: user.id, name: user.name, avatarUrl: user.avatar_url }}
          className="ring-theme-card h-5 w-5 text-[8px] ring-2"
        />
      ))}
    </div>
  );
}

function formatPresenceText(
  users: User[],
  modes: Record<string, PresenceMode>,
  activeUserId: string,
) {
  const typingUsers = users.filter((user) => modes[user.id] === "typing");
  const otherTypingUsers = typingUsers.filter((user) => user.id !== activeUserId);
  if (modes[activeUserId] === "typing") {
    if (otherTypingUsers.length > 0) {
      return `Dopisujesz z ${otherTypingUsers[0]!.name}`;
    }
    return "Dopisujesz…";
  }
  if (otherTypingUsers.length === 1) return `${otherTypingUsers[0]!.name} właśnie dopisuje…`;
  if (otherTypingUsers.length > 1) return `${otherTypingUsers.length} osoby dopisują…`;

  const others = users.filter((user) => user.id !== activeUserId);
  if (others.length === 0) return "Tylko Ty";
  if (others.length === 1) return `W notatniku: Ty i ${others[0]!.name}`;
  return `W notatniku: Ty +${others.length}`;
}

function formatAudienceNames(users: User[]) {
  if (users.length === 0) return "wybrane osoby";
  if (users.length === 1) return `tylko ${users[0]!.name}`;
  if (users.length === 2) return `${users[0]!.name} i ${users[1]!.name}`;
  return `${users[0]!.name}, ${users[1]!.name} +${users.length - 2}`;
}

function sameAudience(first: string[], second: string[]) {
  const firstSorted = [...first].sort();
  const secondSorted = [...second].sort();
  return (
    firstSorted.length === secondSorted.length &&
    firstSorted.every((userId, index) => userId === secondSorted[index])
  );
}
