"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { closedTripMutationError, getTripActionContext } from "~/lib/server/trip-action-context";
import {
  PACKING_PRESET_KEYS,
  getPackingPresetItems,
  parsePackingPresetKeys,
  type PackingPresetKey,
} from "~/lib/packing";
import type { Database } from "~/types/database";

const tripKeySchema = z.string().regex(/^[0-9a-f]{12}$/);
const presetKeySchema = z.enum(PACKING_PRESET_KEYS);
const presetStateSchema = z.object({
  tripKey: tripKeySchema,
  itemKey: z.string().trim().min(1).max(160),
  isChecked: z.boolean(),
  isHidden: z.boolean().default(false),
});
const personalItemSchema = z.object({
  tripKey: tripKeySchema,
  label: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80).default("Moje rzeczy"),
});
const personalMutationSchema = z.object({
  tripKey: tripKeySchema,
  itemId: z.string().uuid(),
});

type PersonalItem = Database["public"]["Tables"]["packing_personal_items"]["Row"];

export type PackingActionResult = { ok: true } | { ok: false; error: string };
export type PackingPersonalItemResult =
  { ok: true; item: PersonalItem } | { ok: false; error: string };

function refreshPacking(tripKey: string) {
  revalidatePath(`/t/${tripKey}`);
  revalidatePath(`/t/${tripKey}/settings`);
}

export async function updatePackingPresetsAction(input: {
  tripKey: string;
  presetKeys: PackingPresetKey[];
}): Promise<PackingActionResult> {
  const parsed = z
    .object({
      tripKey: tripKeySchema,
      presetKeys: z.array(presetKeySchema).max(PACKING_PRESET_KEYS.length),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowe zestawy pakowania." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context?.participant.is_admin) {
    return { ok: false, error: "Tylko Zarządca może wybierać zestawy dla uczestników." };
  }
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const presetKeys = [...new Set(parsed.data.presetKeys)];
  const { error } = await context.supabase
    .from("trips")
    .update({
      packing_presets: presetKeys,
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.session.tripId);

  if (error) return { ok: false, error: "Nie udało się zapisać zestawów pakowania." };
  refreshPacking(parsed.data.tripKey);
  return { ok: true };
}

export async function setPackingPresetItemStateAction(input: {
  tripKey: string;
  itemKey: string;
  isChecked: boolean;
  isHidden?: boolean;
}): Promise<PackingActionResult> {
  const parsed = presetStateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowa rzecz do spakowania." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Sesja wygasła. Wejdź ponownie do wyjazdu." };
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const { data: trip, error: tripError } = await context.supabase
    .from("trips")
    .select("packing_presets")
    .eq("id", context.session.tripId)
    .maybeSingle();
  if (tripError || !trip) return { ok: false, error: "Nie udało się odczytać pakowania." };

  const allowedItems = new Set(
    getPackingPresetItems(parsePackingPresetKeys(trip.packing_presets)).map((item) => item.key),
  );
  if (!allowedItems.has(parsed.data.itemKey)) {
    return { ok: false, error: "Ta rzecz nie należy już do zestawów tego wyjazdu." };
  }

  const { error } = await context.supabase.from("packing_item_states").upsert(
    {
      trip_id: context.session.tripId,
      user_id: context.participant.id,
      item_key: parsed.data.itemKey,
      is_checked: parsed.data.isChecked,
      is_hidden: parsed.data.isHidden,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "trip_id,user_id,item_key" },
  );

  if (error) return { ok: false, error: "Nie udało się zapisać postępu pakowania." };
  refreshPacking(parsed.data.tripKey);
  return { ok: true };
}

export async function addPackingPersonalItemAction(input: {
  tripKey: string;
  label: string;
  category?: string;
}): Promise<PackingPersonalItemResult> {
  const parsed = personalItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Podaj krótką nazwę rzeczy." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Sesja wygasła. Wejdź ponownie do wyjazdu." };
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const { data: item, error } = await context.supabase
    .from("packing_personal_items")
    .insert({
      trip_id: context.session.tripId,
      user_id: context.participant.id,
      label: parsed.data.label,
      category: parsed.data.category,
    })
    .select("*")
    .single();

  if (error || !item) return { ok: false, error: "Nie udało się dopisać rzeczy." };
  refreshPacking(parsed.data.tripKey);
  return { ok: true, item };
}

export async function togglePackingPersonalItemAction(input: {
  tripKey: string;
  itemId: string;
  isChecked: boolean;
}): Promise<PackingPersonalItemResult> {
  const parsed = personalMutationSchema.extend({ isChecked: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowa rzecz." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Sesja wygasła. Wejdź ponownie do wyjazdu." };
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const { data: item, error } = await context.supabase
    .from("packing_personal_items")
    .update({
      is_checked: parsed.data.isChecked,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.itemId)
    .eq("trip_id", context.session.tripId)
    .eq("user_id", context.participant.id)
    .select("*")
    .single();

  if (error || !item) return { ok: false, error: "Nie udało się zapisać rzeczy." };
  refreshPacking(parsed.data.tripKey);
  return { ok: true, item };
}

export async function deletePackingPersonalItemAction(input: {
  tripKey: string;
  itemId: string;
}): Promise<PackingActionResult> {
  const parsed = personalMutationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowa rzecz." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Sesja wygasła. Wejdź ponownie do wyjazdu." };
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const { error } = await context.supabase
    .from("packing_personal_items")
    .delete()
    .eq("id", parsed.data.itemId)
    .eq("trip_id", context.session.tripId)
    .eq("user_id", context.participant.id);

  if (error) return { ok: false, error: "Nie udało się usunąć rzeczy." };
  refreshPacking(parsed.data.tripKey);
  return { ok: true };
}
