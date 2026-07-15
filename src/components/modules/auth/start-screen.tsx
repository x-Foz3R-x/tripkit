// src/components/modules/auth/start-screen.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, KeyRound, Lock, UserRound } from "lucide-react";
import { REGEXP_ONLY_DIGITS_AND_CHARS, REGEXP_ONLY_DIGITS } from "input-otp";
import { supabase } from "~/lib/supabase";
import { useTrip } from "~/providers/trip-provider";
import { Button } from "~/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/components/ui/input-otp";
import type { Database } from "~/types/database";

type User = Database["public"]["Tables"]["users"]["Row"];
type Trip = Database["public"]["Tables"]["trips"]["Row"];

interface StartScreenProps {
  onCreateNew: () => void;
}

function StartScreenContent({ onCreateNew }: StartScreenProps) {
  const { joinTrip } = useTrip();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<"trip_pin" | "select_user" | "user_pin">("trip_pin");

  const [tripPin, setTripPin] = useState("");
  const [foundTrip, setFoundTrip] = useState<Trip | null>(null);
  const [tripUsers, setTripUsers] = useState<User[]>([]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPin, setUserPin] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrip = async (pin: string) => {
    if (pin.length !== 6) return;
    setIsLoading(true);
    setError(null);

    const { data: tripData, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("join_pin", pin)
      .single();

    if (tripError || !tripData) {
      setError("Nie znaleziono wyjazdu o tym kodzie.");
      setIsLoading(false);
      return;
    }

    const { data: usersData } = await supabase
      .from("users")
      .select("*")
      .eq("trip_id", tripData.id)
      .order("name");

    setFoundTrip(tripData);
    setTripUsers(usersData ?? []);
    setIsLoading(false);
    setStep("select_user");
  };

  useEffect(() => {
    const urlPin = searchParams.get("pin");
    if (urlPin && urlPin.length === 6 && step === "trip_pin") {
      const cleanPin = urlPin.toUpperCase();
      setTripPin(cleanPin);
      void fetchTrip(cleanPin);
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleManualFindTrip = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchTrip(tripPin);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setUserPin("");
    setError(null);
    setStep("user_pin");
  };

  const handleVerifyUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !foundTrip) return;
    if (userPin.length !== 4) return;

    setIsLoading(true);
    setError(null);

    if (!selectedUser.user_pin) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ user_pin: userPin })
        .eq("id", selectedUser.id);

      if (updateError) {
        setError("Błąd podczas zapisywania PIN-u.");
        setIsLoading(false);
        return;
      }

      joinTrip({ tripId: foundTrip.id, userId: selectedUser.id });
      return;
    }

    if (selectedUser.user_pin !== userPin) {
      setError("Nieprawidłowy PIN.");
      setIsLoading(false);
      return;
    }

    joinTrip({ tripId: foundTrip.id, userId: selectedUser.id });
  };

  return (
    <div className="animate-fade-in flex min-h-[85vh] flex-col items-center justify-center p-6 text-center">
      {step === "trip_pin" && (
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
          <div className="text-theme-primary bg-theme-primary/10 flex h-20 w-20 items-center justify-center rounded-2xl shadow-sm">
            <Image src="/favicon.png" alt="logo" width={100} height={100} />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-theme-text text-4xl font-bold">Wyjezdnik</h1>
            <p className="text-theme-muted font-body px-4 text-sm">
              Wpisz 6-znakowy kod wyjazdu, aby dołączyć do ekipy.
            </p>
          </div>

          <form onSubmit={handleManualFindTrip} className="flex w-full flex-col items-center gap-4">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              value={tripPin}
              onChange={(val) => setTripPin(val.toUpperCase())}
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="bg-theme-card border-theme-border text-theme-text h-12 w-10 rounded-lg border text-lg font-bold uppercase sm:h-14 sm:w-12"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {error && <span className="text-theme-primary text-xs font-bold">{error}</span>}

            <Button
              type="submit"
              disabled={tripPin.length !== 6 || isLoading}
              className="mt-4 h-12 w-full text-xs font-bold tracking-widest uppercase shadow-lg"
            >
              {isLoading ? "Szukanie..." : "Dołącz do wyjazdu"}
            </Button>
          </form>

          <button
            onClick={onCreateNew}
            className="text-theme-muted hover:text-theme-text mt-4 text-[11px] font-bold tracking-widest uppercase underline decoration-dashed underline-offset-4 transition-colors"
          >
            Stwórz nowy wyjazd
          </button>
        </div>
      )}

      {step === "select_user" && foundTrip && (
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-theme-muted text-[10px] font-bold tracking-widest uppercase">
              Znaleziono wyjazd:
            </span>
            <h2 className="font-heading text-theme-text text-3xl font-bold">{foundTrip.name}</h2>
            <p className="text-theme-muted font-body mt-2 text-sm">
              Wybierz, kim jesteś z poniższej listy.
            </p>
          </div>

          <div className="mt-4 grid w-full grid-cols-2 gap-3">
            {tripUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="bg-theme-card border-theme-border hover:border-theme-primary/50 hover:bg-theme-primary/10 flex items-center gap-3 rounded-xl border p-3 text-left transition active:scale-95"
              >
                <div className="text-theme-muted bg-theme-text/5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <UserRound size={18} />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-theme-text truncate text-sm font-bold">{user.name}</span>
                  <span className="text-theme-muted mt-0.5 font-mono text-[9px] tracking-widest uppercase">
                    {user.user_pin ? "Zabezpieczone" : "Brak PINu"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep("trip_pin")}
            className="text-theme-muted hover:text-theme-text mt-4 text-xs font-bold tracking-widest uppercase transition-colors"
          >
            Wróć
          </button>
        </div>
      )}

      {step === "user_pin" && selectedUser && (
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
          <div className="text-theme-muted bg-theme-text/5 flex h-16 w-16 items-center justify-center rounded-full shadow-sm">
            <KeyRound size={28} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-theme-text text-3xl font-bold">
              Cześć, {selectedUser.name}!
            </h2>
            <p className="text-theme-muted font-body px-4 text-sm">
              {selectedUser.user_pin
                ? "Podaj swój 4-cyfrowy PIN dostępu, aby wejść."
                : "To Twoje pierwsze logowanie. Ustal swój prywatny PIN, aby zabezpieczyć konto."}
            </p>
          </div>

          <form onSubmit={handleVerifyUser} className="flex w-full flex-col items-center gap-4">
            <InputOTP
              maxLength={4}
              pattern={REGEXP_ONLY_DIGITS}
              value={userPin}
              onChange={setUserPin}
            >
              <InputOTPGroup className="gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="bg-theme-card border-theme-border text-theme-text h-14 w-12 rounded-xl border text-2xl font-bold sm:h-16 sm:w-14"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {error && <span className="text-theme-primary text-xs font-bold">{error}</span>}

            <Button
              type="submit"
              disabled={userPin.length !== 4 || isLoading}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase shadow-lg"
            >
              {isLoading
                ? "Przetwarzanie..."
                : selectedUser.user_pin
                  ? "Odblokuj Wyjazd"
                  : "Ustaw PIN i Wejdź"}
              {!isLoading && <ArrowRight size={16} />}
            </Button>
          </form>

          <button
            onClick={() => setStep("select_user")}
            className="text-theme-muted hover:text-theme-text mt-4 text-xs font-bold tracking-widest uppercase transition-colors"
          >
            To nie ja
          </button>
        </div>
      )}
    </div>
  );
}

export function StartScreen({ onCreateNew }: StartScreenProps) {
  return (
    <Suspense
      fallback={
        <div className="text-theme-text/50 flex min-h-screen items-center justify-center text-sm">
          Ładowanie...
        </div>
      }
    >
      <StartScreenContent onCreateNew={onCreateNew} />
    </Suspense>
  );
}
