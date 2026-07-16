"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarDays, Clock3, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteScheduleItemAction, saveScheduleItemAction } from "~/app/actions/schedule";
import { DatePicker } from "~/components/date-range-picker";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { Database } from "~/types/database";

type ScheduleItem = Database["public"]["Tables"]["schedule_items"]["Row"];

export function ScheduleScreen({
  tripKey,
  isAdmin,
  items,
  databaseReady,
  tripStartDate,
}: {
  tripKey: string;
  isAdmin: boolean;
  items: ScheduleItem[];
  databaseReady: boolean;
  tripStartDate: string | null;
}) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<ScheduleItem | null>(null);
  const groups = useMemo(() => groupItems(items), [items]);

  const openEditor = (item: ScheduleItem | null) => {
    setActiveItem(item);
    setIsEditorOpen(true);
  };

  return (
    <div className="animate-fade-in pb-safe flex flex-col gap-6 pt-3">
      <header className="px-1 pt-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-theme-primary text-[10px] font-bold tracking-[0.18em] uppercase">
              Karta podróży · {items.length} {items.length === 1 ? "punkt" : "punktów"}
            </p>
            <h1 className="font-heading text-theme-text mt-1 text-3xl font-semibold">
              Co, gdzie, kiedy
            </h1>
            <p className="text-theme-muted mt-2 truncate text-xs">
              {items[0] ? `Najbliżej: ${items[0].title}` : "Miejsce na plan albo pełen spontan."}
            </p>
          </div>
          {isAdmin && databaseReady ? (
            <Button
              size="icon"
              onClick={() => openEditor(null)}
              aria-label="Dodaj punkt harmonogramu"
            >
              <Plus size={20} />
            </Button>
          ) : null}
        </div>
      </header>

      {!databaseReady ? (
        <section className="border-theme-accent/30 bg-theme-accent/10 rounded-2xl border p-5">
          <h2 className="text-theme-text font-bold">Harmonogram czeka na migrację</h2>
          <p className="text-theme-muted mt-1 text-sm">
            Dane wyjazdu są bezpieczne. Administrator musi uruchomić najnowszą migrację Supabase,
            aby można było dodawać wydarzenia.
          </p>
        </section>
      ) : groups.length === 0 ? (
        <section className="border-theme-border flex min-h-72 flex-col items-center justify-center gap-4 rounded-3xl border border-dashed p-8 text-center">
          <span className="bg-theme-card text-theme-primary flex h-14 w-14 items-center justify-center rounded-2xl">
            <CalendarDays size={25} />
          </span>
          <div>
            <h2 className="font-heading text-theme-text text-2xl font-semibold">
              Tu może powstać plan
            </h2>
            <p className="text-theme-muted mx-auto mt-2 max-w-64 text-sm">
              Jeśli ten wyjazd jest spontaniczny, nic nie musisz dodawać.
            </p>
          </div>
          {isAdmin && <Button onClick={() => openEditor(null)}>Dodaj pierwszy punkt</Button>}
        </section>
      ) : (
        <div className="flex flex-col gap-7">
          {groups.map(([date, dateItems]) => (
            <section key={date} className="flex flex-col gap-3">
              <div className="sticky top-0 z-10 -mx-1 px-1 py-1 backdrop-blur-md">
                <p className="text-theme-primary text-[10px] font-bold tracking-[0.16em] uppercase">
                  {format(parseISO(date), "EEEE", { locale: pl })}
                </p>
                <h2 className="font-heading text-theme-text text-2xl font-semibold">
                  {format(parseISO(date), "d MMMM", { locale: pl })}
                </h2>
              </div>

              <div className="before:bg-theme-border relative flex flex-col gap-3 before:absolute before:top-4 before:bottom-4 before:left-[4.45rem] before:w-px">
                {dateItems.map((item) => {
                  const content = (
                    <>
                      <div className="text-theme-muted flex w-14 shrink-0 flex-col pt-1 text-right font-mono text-xs font-bold">
                        <span>{formatTime(item.start_time) ?? "—"}</span>
                        {item.end_time && (
                          <span className="mt-0.5 text-[10px] opacity-60">
                            {formatTime(item.end_time)}
                          </span>
                        )}
                      </div>
                      <span className="bg-theme-primary ring-theme-bg relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4" />
                      <div className="bg-theme-card border-theme-border min-w-0 flex-1 rounded-2xl border p-4 text-left">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-theme-text text-base font-bold">{item.title}</h3>
                            {(item.location_name || item.location_address) && (
                              <p className="text-theme-muted mt-1 flex items-start gap-1.5 text-xs">
                                <MapPin className="mt-0.5 shrink-0" size={13} />
                                <span>
                                  {[item.location_name, item.location_address]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-theme-muted mt-2 line-clamp-2 text-sm">
                                {item.notes}
                              </p>
                            )}
                          </div>
                          {isAdmin && <Pencil className="text-theme-muted shrink-0" size={15} />}
                        </div>
                      </div>
                    </>
                  );

                  return isAdmin ? (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openEditor(item)}
                      className="flex items-start gap-3 active:scale-99"
                    >
                      {content}
                    </button>
                  ) : (
                    <div key={item.id} className="flex items-start gap-3">
                      {content}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <ResponsiveDialog
        isOpen={isEditorOpen}
        setIsOpen={setIsEditorOpen}
        title={activeItem ? "Edytuj punkt planu" : "Nowy punkt planu"}
        description="Dodaj tylko tyle szczegółów, ile naprawdę jest potrzebne."
      >
        <ScheduleItemForm
          key={activeItem?.id ?? "new"}
          tripKey={tripKey}
          item={activeItem}
          initialDate={tripStartDate}
          onDone={() => setIsEditorOpen(false)}
        />
      </ResponsiveDialog>
    </div>
  );
}

function ScheduleItemForm({
  tripKey,
  item,
  initialDate,
  onDone,
}: {
  tripKey: string;
  item: ScheduleItem | null;
  initialDate: string | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(item?.title ?? "");
  const [eventDate, setEventDate] = useState<Date | undefined>(
    item?.event_date ? parseISO(item.event_date) : initialDate ? parseISO(initialDate) : new Date(),
  );
  const [startTime, setStartTime] = useState(formatTime(item?.start_time) ?? "");
  const [endTime, setEndTime] = useState(formatTime(item?.end_time) ?? "");
  const [locationName, setLocationName] = useState(item?.location_name ?? "");
  const [locationAddress, setLocationAddress] = useState(item?.location_address ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nullable = (value: string) => value.trim() || null;

  const save = async () => {
    if (!eventDate || !title.trim()) {
      setError("Dodaj nazwę i wybierz dzień.");
      return;
    }
    setIsSaving(true);
    setError(null);
    const result = await saveScheduleItemAction({
      id: item?.id ?? null,
      tripKey,
      title,
      notes: nullable(notes),
      eventDate: format(eventDate, "yyyy-MM-dd"),
      startTime: nullable(startTime),
      endTime: nullable(endTime),
      locationName: nullable(locationName),
      locationAddress: nullable(locationAddress),
    });
    setIsSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
    onDone();
  };

  const remove = async () => {
    if (!item || !window.confirm("Usunąć ten punkt z harmonogramu?")) return;
    setIsSaving(true);
    setError(null);
    const result = await deleteScheduleItemAction({ id: item.id, tripKey });
    setIsSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
    onDone();
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="border-theme-danger/30 bg-theme-danger/10 text-theme-danger rounded-xl border px-3 py-2 text-sm font-bold">
          {error}
        </div>
      )}
      <Input
        label="Nazwa punktu"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="np. Wyjazd z parkingu"
        autoFocus
      />
      <DatePicker value={eventDate} onChange={setEventDate} />
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="time"
          label="Od"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
        />
        <Input
          type="time"
          label="Do"
          value={endTime}
          onChange={(event) => setEndTime(event.target.value)}
        />
      </div>
      <Input
        label="Miejsce"
        value={locationName}
        onChange={(event) => setLocationName(event.target.value)}
        placeholder="np. Domek, plaża, dworzec"
      />
      <Input
        label="Adres"
        value={locationAddress}
        onChange={(event) => setLocationAddress(event.target.value)}
        placeholder="Opcjonalny"
      />
      <label className="flex flex-col gap-2">
        <span className="text-theme-muted text-xs font-bold">Notatka</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Co warto wiedzieć?"
          className="bg-theme-card border-theme-border text-theme-text placeholder:text-theme-muted/60 focus:border-theme-primary resize-none rounded-xl border p-3 outline-hidden"
        />
      </label>
      <div className="flex gap-3 pt-1">
        {item && (
          <Button
            type="button"
            variant="outline"
            onClick={remove}
            disabled={isSaving}
            className="text-theme-danger shrink-0"
          >
            <Trash2 size={17} />
            Usuń
          </Button>
        )}
        <Button type="button" onClick={save} disabled={isSaving} className="flex-1">
          <Clock3 size={17} />
          {isSaving ? "Zapisywanie…" : "Zapisz punkt"}
        </Button>
      </div>
    </div>
  );
}

function groupItems(items: ScheduleItem[]) {
  const groups = new Map<string, ScheduleItem[]>();
  for (const item of items) {
    const current = groups.get(item.event_date) ?? [];
    current.push(item);
    groups.set(item.event_date, current);
  }
  return [...groups.entries()];
}

function formatTime(value: string | null | undefined) {
  return value ? value.slice(0, 5) : null;
}
