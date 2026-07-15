"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient, hasSupabaseSecretKey } from "~/lib/supabase/server";
import { verifyPin } from "~/lib/server/pin";
import { getTripSession, setTripSession } from "~/lib/server/trip-session";

export type TripFormState = {
  error: string | null;
};

const joinPinSchema = z.string().regex(/^\d{6}$/);
const userPinSchema = z.string().regex(/^\d{4}$/);

const createTripSchema = z.object({
  name: z.string().trim().min(2).max(80),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  modules: z.object({
    finances: z.boolean(),
    shopping: z.boolean(),
    scoreboard: z.boolean(),
  }),
  adminName: z.string().trim().min(1).max(60),
  adminPin: userPinSchema,
  members: z.array(z.string().trim().min(1).max(60)).max(100),
  teams: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().trim().min(1).max(60),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      }),
    )
    .max(20),
  memberAssignments: z.record(z.string(), z.string()),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

export type CreateTripResult = { ok: true; urlKey: string } | { ok: false; error: string };

export async function joinTripByPinAction(
  _previousState: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const parsedPin = joinPinSchema.safeParse(String(formData.get("joinPin") ?? ""));
  if (!parsedPin.success) return { error: "Wpisz pełny 6-cyfrowy PIN." };

  const supabase = createServerSupabaseClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select("id, url_key")
    .eq("join_pin", parsedPin.data)
    .maybeSingle();

  if (error) {
    console.error("Błąd wyszukiwania wyjazdu po PIN-ie:", error);
    return { error: "Nie udało się połączyć z bazą wyjazdów. Spróbuj ponownie." };
  }
  if (!trip) return { error: "Nie znaleziono wyjazdu o tym PIN-ie." };

  try {
    await setTripSession({ tripId: trip.id, urlKey: trip.url_key, userId: null });
  } catch {
    return { error: "Brakuje konfiguracji sesji po stronie serwera." };
  }

  redirect(`/t/${trip.url_key}/join`);
}

export async function verifyParticipantAction(
  _previousState: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const tripKey = String(formData.get("tripKey") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const parsedPin = userPinSchema.safeParse(String(formData.get("userPin") ?? ""));

  if (!/^[0-9a-f]{12}$/.test(tripKey) || !z.string().uuid().safeParse(userId).success) {
    return { error: "Nieprawidłowe dane uczestnika." };
  }
  if (!parsedPin.success) return { error: "Wpisz pełny 4-cyfrowy PIN." };

  const session = await getTripSession(tripKey);
  if (!session) return { error: "Sesja wygasła. Dołącz do wyjazdu ponownie." };

  const supabase = createServerSupabaseClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, trip_id, user_pin")
    .eq("id", userId)
    .eq("trip_id", session.tripId)
    .maybeSingle();

  if (error) {
    console.error("Błąd wyszukiwania uczestnika:", error);
    return { error: "Nie udało się połączyć z bazą wyjazdu. Spróbuj ponownie." };
  }
  if (!user) return { error: "Nie znaleziono uczestnika." };

  if (user.user_pin !== null) {
    const isCorrect = verifyPin(parsedPin.data, user.user_pin);
    if (!isCorrect) return { error: "Nieprawidłowy PIN uczestnika." };
  } else {
    const { error: updateError } = await supabase
      .from("users")
      .update({ user_pin: parsedPin.data })
      .eq("id", user.id);

    if (updateError) return { error: "Nie udało się ustawić PIN-u uczestnika." };
  }

  await setTripSession({ tripId: user.trip_id, urlKey: tripKey, userId: user.id });
  redirect(`/t/${tripKey}`);
}

export async function createTripAction(input: CreateTripInput): Promise<CreateTripResult> {
  const parsed = createTripSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Sprawdź dane wyjazdu i spróbuj ponownie." };

  if (!hasSupabaseSecretKey()) {
    return {
      ok: false,
      error: "Brakuje SUPABASE_SECRET_KEY w konfiguracji serwera.",
    };
  }

  const values = parsed.data;
  const supabase = createServerSupabaseClient();

  try {
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        name: values.name,
        start_date: values.startDate,
        end_date: values.endDate,
        modules: values.modules,
      })
      .select("id, url_key")
      .single();

    if (tripError || !trip) throw tripError ?? new Error("Nie utworzono wyjazdu.");

    const teamIdMap: Record<string, string> = {};
    if (values.modules.scoreboard && values.teams.length > 0) {
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .insert(
          values.teams.map((team) => ({
            trip_id: trip.id,
            name: team.name,
            color_hex: team.color,
          })),
        )
        .select("id, name");

      if (teamsError) throw teamsError;
      for (const team of teams ?? []) {
        const localTeam = values.teams.find((candidate) => candidate.name === team.name);
        if (localTeam) teamIdMap[localTeam.id] = team.id;
      }
    }

    const { data: admin, error: adminError } = await supabase
      .from("users")
      .insert({
        trip_id: trip.id,
        name: values.adminName,
        user_pin: values.adminPin,
        is_admin: true,
        team_id: teamIdMap[values.memberAssignments[values.adminName] ?? ""] ?? null,
      })
      .select("id")
      .single();

    if (adminError || !admin) throw adminError ?? new Error("Nie utworzono organizatora.");

    if (values.members.length > 0) {
      const { error: membersError } = await supabase.from("users").insert(
        values.members.map((name) => ({
          trip_id: trip.id,
          name,
          is_admin: false,
          team_id: teamIdMap[values.memberAssignments[name] ?? ""] ?? null,
        })),
      );

      if (membersError) throw membersError;
    }

    await setTripSession({ tripId: trip.id, urlKey: trip.url_key, userId: admin.id });
    return { ok: true, urlKey: trip.url_key };
  } catch (error) {
    console.error("Błąd tworzenia wyjazdu:", error);
    return { ok: false, error: "Nie udało się utworzyć wyjazdu." };
  }
}
