"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { closedTripMutationError, getTripActionContext } from "~/lib/server/trip-action-context";

const tripKeySchema = z.string().regex(/^[0-9a-f]{12}$/);
const challengeSchema = z.object({
  tripKey: tripKeySchema,
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).nullable(),
  points: z.number().int().min(0).max(100000),
  audience: z.enum(["individual", "team", "either"]),
});
const pollSchema = z.object({
  tripKey: tripKeySchema,
  question: z.string().trim().min(1).max(240),
  options: z.array(z.string().trim().min(1).max(160)).min(2).max(6),
});

export type GameplayActionResult = { ok: true } | { ok: false; error: string };

function refreshGameplay(tripKey: string) {
  revalidatePath(`/t/${tripKey}/gameplay`);
  revalidatePath(`/t/${tripKey}`);
}

export async function createChallengeAction(
  input: z.infer<typeof challengeSchema>,
): Promise<GameplayActionResult> {
  const parsed = challengeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Sprawdź treść i punktację wyzwania." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context?.participant.is_admin) {
    return { ok: false, error: "Tylko Zarządca może dodawać wyzwania." };
  }
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const { error } = await context.supabase.from("game_challenges").insert({
    trip_id: context.session.tripId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    points: parsed.data.points,
    audience: parsed.data.audience,
    created_by: context.participant.id,
  });

  if (error) return { ok: false, error: "Nie udało się dodać wyzwania." };
  refreshGameplay(parsed.data.tripKey);
  return { ok: true };
}

export async function claimChallengeAction(input: {
  tripKey: string;
  challengeId: string;
}): Promise<GameplayActionResult> {
  const parsed = z
    .object({ tripKey: tripKeySchema, challengeId: z.string().uuid() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowe wyzwanie." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Sesja wygasła. Wejdź ponownie do wyjazdu." };
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const { data: challenge, error: challengeError } = await context.supabase
    .from("game_challenges")
    .select("id, audience, is_active")
    .eq("id", parsed.data.challengeId)
    .eq("trip_id", context.session.tripId)
    .maybeSingle();

  if (challengeError || !challenge?.is_active) {
    return { ok: false, error: "To wyzwanie nie jest już aktywne." };
  }

  const useTeam = challenge.audience === "team" || challenge.audience === "either";
  if (useTeam && !context.participant.team_id) {
    return { ok: false, error: "Do tego wyzwania potrzebujesz drużyny." };
  }

  const { error } = await context.supabase.from("game_challenge_entries").insert({
    challenge_id: challenge.id,
    user_id: useTeam ? null : context.participant.id,
    team_id: useTeam ? context.participant.team_id : null,
  });

  if (error?.code === "23505") return { ok: false, error: "To wyzwanie jest już podjęte." };
  if (error) return { ok: false, error: "Nie udało się podjąć wyzwania." };
  refreshGameplay(parsed.data.tripKey);
  return { ok: true };
}

export async function completeChallengeAction(input: {
  tripKey: string;
  entryId: string;
}): Promise<GameplayActionResult> {
  const parsed = z.object({ tripKey: tripKeySchema, entryId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowe zgłoszenie." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context?.participant.is_admin) {
    return { ok: false, error: "Tylko Zarządca może zaliczyć wyzwanie." };
  }
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const { error } = await context.supabase.rpc("complete_game_challenge", {
    p_entry_id: parsed.data.entryId,
    p_trip_id: context.session.tripId,
    p_completed_by: context.participant.id,
  });

  if (error) {
    console.error("Błąd zaliczania wyzwania:", error);
    return { ok: false, error: "Nie udało się zaliczyć wyzwania." };
  }

  refreshGameplay(parsed.data.tripKey);
  return { ok: true };
}

export async function createPollAction(input: {
  tripKey: string;
  question: string;
  options: string[];
}): Promise<GameplayActionResult> {
  const parsed = pollSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dodaj pytanie i od 2 do 6 odpowiedzi." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Sesja wygasła. Wejdź ponownie do wyjazdu." };
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const options = parsed.data.options.filter(
    (option, index, all) =>
      all.findIndex(
        (candidate) => candidate.toLocaleLowerCase("pl") === option.toLocaleLowerCase("pl"),
      ) === index,
  );
  if (options.length < 2) return { ok: false, error: "Odpowiedzi muszą się od siebie różnić." };

  const { data: poll, error: pollError } = await context.supabase
    .from("polls")
    .insert({
      trip_id: context.session.tripId,
      question: parsed.data.question,
      status: "open",
      created_by: context.participant.id,
    })
    .select("id")
    .single();

  if (pollError || !poll) return { ok: false, error: "Nie udało się utworzyć głosowania." };

  const { error: optionsError } = await context.supabase
    .from("poll_options")
    .insert(
      options.map((label, sortOrder) => ({ poll_id: poll.id, label, sort_order: sortOrder })),
    );
  if (optionsError) {
    await context.supabase.from("polls").delete().eq("id", poll.id);
    return { ok: false, error: "Nie udało się zapisać odpowiedzi." };
  }

  refreshGameplay(parsed.data.tripKey);
  return { ok: true };
}

export async function voteInPollAction(input: {
  tripKey: string;
  pollId: string;
  optionId: string;
}): Promise<GameplayActionResult> {
  const parsed = z
    .object({
      tripKey: tripKeySchema,
      pollId: z.string().uuid(),
      optionId: z.string().uuid(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowy głos." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Sesja wygasła. Wejdź ponownie do wyjazdu." };
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const [{ data: poll }, { data: option }] = await Promise.all([
    context.supabase
      .from("polls")
      .select("id, status")
      .eq("id", parsed.data.pollId)
      .eq("trip_id", context.session.tripId)
      .maybeSingle(),
    context.supabase
      .from("poll_options")
      .select("id")
      .eq("id", parsed.data.optionId)
      .eq("poll_id", parsed.data.pollId)
      .maybeSingle(),
  ]);

  if (poll?.status !== "open" || !option) {
    return { ok: false, error: "To głosowanie jest już zamknięte." };
  }

  const { error } = await context.supabase.from("poll_votes").upsert(
    {
      poll_id: poll.id,
      option_id: option.id,
      user_id: context.participant.id,
      created_at: new Date().toISOString(),
    },
    { onConflict: "poll_id,user_id" },
  );

  if (error) return { ok: false, error: "Nie udało się zapisać głosu." };
  refreshGameplay(parsed.data.tripKey);
  return { ok: true };
}

export async function closePollAction(input: {
  tripKey: string;
  pollId: string;
}): Promise<GameplayActionResult> {
  const parsed = z.object({ tripKey: tripKeySchema, pollId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowe głosowanie." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context?.participant.is_admin) {
    return { ok: false, error: "Tylko Zarządca może zamknąć głosowanie." };
  }
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const { error } = await context.supabase
    .from("polls")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", parsed.data.pollId)
    .eq("trip_id", context.session.tripId)
    .eq("status", "open");

  if (error) return { ok: false, error: "Nie udało się zamknąć głosowania." };
  refreshGameplay(parsed.data.tripKey);
  return { ok: true };
}

export async function deletePollAction(input: {
  tripKey: string;
  pollId: string;
}): Promise<GameplayActionResult> {
  const parsed = z.object({ tripKey: tripKeySchema, pollId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowe głosowanie." };

  const context = await getTripActionContext(parsed.data.tripKey);
  if (!context?.participant.is_admin) {
    return { ok: false, error: "Tylko Zarządca może usunąć głosowanie." };
  }
  const closedError = closedTripMutationError(context);
  if (closedError) return closedError;

  const { data: deletedPoll, error } = await context.supabase
    .from("polls")
    .delete()
    .eq("id", parsed.data.pollId)
    .eq("trip_id", context.session.tripId)
    .select("id")
    .maybeSingle();

  if (error || !deletedPoll) {
    return { ok: false, error: "Nie udało się usunąć głosowania." };
  }
  refreshGameplay(parsed.data.tripKey);
  return { ok: true };
}
