"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { closedTripMutationError, getTripActionContext } from "~/lib/server/trip-action-context";
import type { Database } from "~/types/database";

export type ShoppingItem = Database["public"]["Tables"]["shopping_list"]["Row"];

const tripKeySchema = z.string().regex(/^[0-9a-f]{12}$/);
const createItemSchema = z.object({
  tripKey: tripKeySchema,
  itemName: z.string().trim().min(1).max(160),
  forUsers: z.array(z.string().uuid()).max(100),
});
const itemMutationSchema = z.object({
  tripKey: tripKeySchema,
  itemId: z.string().uuid(),
});
const audienceMutationSchema = itemMutationSchema.extend({
  forUsers: z.array(z.string().uuid()).max(100),
});

export type ShoppingActionResult = { ok: true } | { ok: false; error: string };
export type ShoppingItemActionResult =
  { ok: true; item: ShoppingItem } | { ok: false; error: string };
export type ShoppingItemsActionResult =
  { ok: true; items: ShoppingItem[] } | { ok: false; error: string };

function revalidateShopping(tripKey: string) {
  revalidatePath(`/t/${tripKey}/shopping`);
  revalidatePath(`/t/${tripKey}`);
}

export async function createShoppingItemAction(input: {
  tripKey: string;
  itemName: string;
  forUsers: string[];
}): Promise<ShoppingItemActionResult> {
  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Sprawdź nazwę i odbiorców produktu." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Sesja wygasła. Wejdź ponownie do wyjazdu." };
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const forUsers = [...new Set(parsed.data.forUsers)];
  if (forUsers.length > 0) {
    const { data: participants, error } = await context.supabase
      .from("users")
      .select("id")
      .eq("trip_id", context.session.tripId)
      .in("id", forUsers);

    if (error || participants?.length !== forUsers.length) {
      return { ok: false, error: "Co najmniej jedna osoba nie należy do tego wyjazdu." };
    }
  }

  const { data: item, error } = await context.supabase
    .from("shopping_list")
    .insert({
      trip_id: context.session.tripId,
      added_by: context.participant.id,
      item_name: parsed.data.itemName,
      for_users: forUsers,
    })
    .select("*")
    .single();

  if (error || !item) {
    console.error("Błąd dodawania produktu:", error);
    return { ok: false, error: "Nie udało się dodać produktu." };
  }

  revalidateShopping(parsed.data.tripKey);
  return { ok: true, item };
}

export async function toggleShoppingItemAction(input: {
  tripKey: string;
  itemId: string;
  isCompleted: boolean;
}): Promise<ShoppingItemActionResult> {
  const parsed = itemMutationSchema.extend({ isCompleted: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowy produkt." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Sesja wygasła. Wejdź ponownie do wyjazdu." };
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const { data: item, error } = await context.supabase
    .from("shopping_list")
    .update({
      is_completed: parsed.data.isCompleted,
      completed_by: parsed.data.isCompleted ? context.participant.id : null,
      completed_at: parsed.data.isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.itemId)
    .eq("trip_id", context.session.tripId)
    .select("*")
    .single();

  if (error || !item) return { ok: false, error: "Nie udało się zaktualizować produktu." };
  revalidateShopping(parsed.data.tripKey);
  return { ok: true, item };
}

export async function updateShoppingAudienceAction(input: {
  tripKey: string;
  itemId: string;
  forUsers: string[];
}): Promise<ShoppingItemActionResult> {
  const parsed = audienceMutationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowy rachunek." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Sesja wygasła. Wejdź ponownie do wyjazdu." };
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const requestedUsers = [...new Set(parsed.data.forUsers)];
  const { data: participants, error: participantsError } = await context.supabase
    .from("users")
    .select("id")
    .eq("trip_id", context.session.tripId);

  if (participantsError) return { ok: false, error: "Nie udało się sprawdzić uczestników." };

  const participantIds = new Set((participants ?? []).map((participant) => participant.id));
  if (requestedUsers.some((userId) => !participantIds.has(userId))) {
    return { ok: false, error: "Co najmniej jedna osoba nie należy do tego wyjazdu." };
  }

  const normalizedUsers =
    requestedUsers.length === participantIds.size ? [] : requestedUsers.sort();
  const { data: item, error } = await context.supabase
    .from("shopping_list")
    .update({
      for_users: normalizedUsers,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.itemId)
    .eq("trip_id", context.session.tripId)
    .select("*")
    .single();

  if (error || !item) return { ok: false, error: "Nie udało się zmienić rachunku." };
  revalidateShopping(parsed.data.tripKey);
  return { ok: true, item };
}

export async function deleteShoppingItemAction(input: {
  tripKey: string;
  itemId: string;
}): Promise<ShoppingActionResult> {
  const parsed = itemMutationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowy produkt." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Sesja wygasła. Wejdź ponownie do wyjazdu." };
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const { error } = await context.supabase
    .from("shopping_list")
    .delete()
    .eq("id", parsed.data.itemId)
    .eq("trip_id", context.session.tripId);

  if (error) return { ok: false, error: "Nie udało się usunąć produktu." };
  revalidateShopping(parsed.data.tripKey);
  return { ok: true };
}

export async function clearCompletedShoppingItemsAction(input: {
  tripKey: string;
}): Promise<ShoppingActionResult> {
  const parsed = z.object({ tripKey: tripKeySchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowy wyjazd." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Sesja wygasła. Wejdź ponownie do wyjazdu." };
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const { error } = await context.supabase
    .from("shopping_list")
    .delete()
    .eq("trip_id", context.session.tripId)
    .eq("is_completed", true);

  if (error) return { ok: false, error: "Nie udało się usunąć skreślonych rzeczy." };
  revalidateShopping(parsed.data.tripKey);
  return { ok: true };
}

export async function getShoppingItemsAction(input: {
  tripKey: string;
}): Promise<ShoppingItemsActionResult> {
  const parsed = z.object({ tripKey: tripKeySchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowy wyjazd." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Sesja wygasła. Wejdź ponownie do wyjazdu." };

  const { data, error } = await context.supabase
    .from("shopping_list")
    .select("*")
    .eq("trip_id", context.session.tripId)
    .order("created_at");

  if (error) return { ok: false, error: "Nie udało się odświeżyć listy." };
  return { ok: true, items: data ?? [] };
}
