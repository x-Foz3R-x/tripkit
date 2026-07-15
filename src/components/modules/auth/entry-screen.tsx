"use client";

import { useState } from "react";
import { StartScreen } from "~/components/modules/auth/start-screen";
import { TripCreator } from "~/components/modules/auth/trip-creator";

export function EntryScreen({ initialError }: { initialError?: string | null }) {
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);

  return isCreatingTrip ? (
    <TripCreator onCancel={() => setIsCreatingTrip(false)} />
  ) : (
    <StartScreen initialError={initialError} onCreateNew={() => setIsCreatingTrip(true)} />
  );
}
