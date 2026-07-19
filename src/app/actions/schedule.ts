"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { closedTripMutationError, getTripActionContext } from "~/lib/server/trip-action-context";

const tripKeySchema = z.string().regex(/^[0-9a-f]{12}$/);
const nullableText = (max: number) => z.string().trim().max(max).nullable();
const nullableTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .nullable();

const scheduleItemSchema = z
  .object({
    id: z.string().uuid().nullable(),
    tripKey: tripKeySchema,
    title: z.string().trim().min(1).max(120),
    notes: nullableText(1000),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: nullableTime,
    endTime: nullableTime,
    locationName: nullableText(160),
    locationAddress: nullableText(300),
  })
  .refine(
    ({ startTime, endTime }) => !startTime || !endTime || startTime <= endTime,
    "Godzina zakończenia nie może być wcześniejsza niż rozpoczęcie.",
  );

const deleteScheduleItemSchema = z.object({
  id: z.string().uuid(),
  tripKey: tripKeySchema,
});

export type SaveScheduleItemInput = z.infer<typeof scheduleItemSchema>;
export type ScheduleActionResult = { ok: true } | { ok: false; error: string };

async function getAdminContext(tripKey: string) {
  const context = await getTripActionContext(tripKey);
  return context?.participant.is_admin ? context : null;
}

function databaseErrorMessage(code?: string) {
  if (code && ["42P01", "PGRST205"].includes(code)) {
    return "Brakuje tabeli harmonogramu. Uruchom najnowszą migrację Supabase.";
  }
  return "Nie udało się zapisać punktu harmonogramu.";
}

export async function saveScheduleItemAction(
  input: SaveScheduleItemInput,
): Promise<ScheduleActionResult> {
  const parsed = scheduleItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Sprawdź dane wydarzenia." };
  }

  const context = await getAdminContext(parsed.data.tripKey);
  if (!context) {
    return { ok: false, error: "Tylko Zarządca może edytować harmonogram." };
  }
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const values = parsed.data;
  const payload = {
    title: values.title,
    notes: values.notes,
    event_date: values.eventDate,
    start_time: values.startTime,
    end_time: values.endTime,
    location_name: values.locationName,
    location_address: values.locationAddress,
    updated_at: new Date().toISOString(),
  };

  const result = values.id
    ? await context.supabase
        .from("schedule_items")
        .update(payload)
        .eq("id", values.id)
        .eq("trip_id", context.session.tripId)
    : await context.supabase.from("schedule_items").insert({
        ...payload,
        trip_id: context.session.tripId,
        created_by: context.participant.id,
      });

  if (result.error) {
    console.error("Błąd zapisu harmonogramu:", result.error);
    return { ok: false, error: databaseErrorMessage(result.error.code) };
  }

  revalidatePath(`/t/${values.tripKey}/schedule`);
  revalidatePath(`/t/${values.tripKey}`);
  return { ok: true };
}

export async function deleteScheduleItemAction(input: {
  id: string;
  tripKey: string;
}): Promise<ScheduleActionResult> {
  const parsed = deleteScheduleItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowy punkt harmonogramu." };

  const context = await getAdminContext(parsed.data.tripKey);
  if (!context) {
    return { ok: false, error: "Tylko Zarządca może edytować harmonogram." };
  }
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const { data: deletedItem, error } = await context.supabase
    .from("schedule_items")
    .delete()
    .eq("id", parsed.data.id)
    .eq("trip_id", context.session.tripId)
    .select("id")
    .maybeSingle();

  if (error || !deletedItem) {
    console.error("Błąd usuwania punktu harmonogramu:", error);
    return { ok: false, error: databaseErrorMessage(error?.code) };
  }

  revalidatePath(`/t/${parsed.data.tripKey}/schedule`);
  revalidatePath(`/t/${parsed.data.tripKey}`);
  return { ok: true };
}
