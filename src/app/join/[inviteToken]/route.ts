import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "~/lib/supabase/server";
import {
  createTripSessionToken,
  getTripSessionCookieName,
  getTripSessionCookieOptions,
} from "~/lib/server/trip-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteToken: string }> },
) {
  const { inviteToken } = await params;
  const invalidInviteUrl = new URL("/?error=invalid-invite", request.url);

  if (!/^[0-9a-f]{32}$/.test(inviteToken)) {
    return NextResponse.redirect(invalidInviteUrl);
  }

  const supabase = createServerSupabaseClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select("id, url_key")
    .eq("invite_token", inviteToken)
    .maybeSingle();

  if (error) {
    console.error("Błąd wyszukiwania wyjazdu po tokenie zaproszenia:", error);
    return NextResponse.redirect(new URL("/?error=database", request.url));
  }
  if (!trip) return NextResponse.redirect(invalidInviteUrl);

  try {
    const response = NextResponse.redirect(new URL(`/t/${trip.url_key}/join`, request.url));
    response.cookies.set(
      getTripSessionCookieName(trip.url_key),
      createTripSessionToken({ tripId: trip.id, urlKey: trip.url_key, userId: null }),
      getTripSessionCookieOptions(),
    );
    return response;
  } catch {
    return NextResponse.redirect(new URL("/?error=session-config", request.url));
  }
}
