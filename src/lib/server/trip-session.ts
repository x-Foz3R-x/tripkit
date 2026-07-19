import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { env } from "~/env";

const COOKIE_PREFIX = "wyjezdnik_trip_";
const SESSION_VERSION = 1;
const SESSION_MAX_AGE = 60 * 60 * 24 * 180;

export type TripSession = {
  version: typeof SESSION_VERSION;
  tripId: string;
  urlKey: string;
  userId: string | null;
  issuedAt: number;
};

function getSessionSecret() {
  if (!env.SESSION_SECRET) {
    throw new Error(
      "Brakuje SESSION_SECRET. Dodaj co najmniej 32 losowe znaki do zmiennych środowiskowych.",
    );
  }

  return env.SESSION_SECRET;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(encodedPayload: string) {
  return createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url");
}

function isValidUrlKey(urlKey: string) {
  return /^[0-9a-f]{12}$/.test(urlKey);
}

export function getTripSessionCookieName(urlKey: string) {
  if (!isValidUrlKey(urlKey)) throw new Error("Nieprawidłowy identyfikator wyjazdu.");
  return `${COOKIE_PREFIX}${urlKey}`;
}

export function getTripSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
  };
}

export function createTripSessionToken(session: Omit<TripSession, "issuedAt" | "version">) {
  const payload: TripSession = {
    ...session,
    version: SESSION_VERSION,
    issuedAt: Date.now(),
  };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyTripSessionToken(token: string): TripSession | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<TripSession>;

    if (
      parsed.version !== SESSION_VERSION ||
      typeof parsed.tripId !== "string" ||
      typeof parsed.urlKey !== "string" ||
      !isValidUrlKey(parsed.urlKey) ||
      (parsed.userId !== null && typeof parsed.userId !== "string") ||
      typeof parsed.issuedAt !== "number"
    ) {
      return null;
    }

    return parsed as TripSession;
  } catch {
    return null;
  }
}

export const getTripSession = cache(async function getTripSession(urlKey: string) {
  if (!isValidUrlKey(urlKey)) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(getTripSessionCookieName(urlKey))?.value;
  return token ? verifyTripSessionToken(token) : null;
});

export async function setTripSession(session: Omit<TripSession, "issuedAt" | "version">) {
  const cookieStore = await cookies();
  cookieStore.set(
    getTripSessionCookieName(session.urlKey),
    createTripSessionToken(session),
    getTripSessionCookieOptions(),
  );
}

export async function removeTripSession(urlKey: string) {
  const cookieStore = await cookies();
  cookieStore.delete(getTripSessionCookieName(urlKey));
}
