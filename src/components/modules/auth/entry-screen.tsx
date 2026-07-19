"use client";

import { useState } from "react";
import { StartScreen } from "~/components/modules/auth/start-screen";
import { TripCreator } from "~/components/modules/auth/trip-creator";

export function EntryScreen({
  initialError,
  returnTo,
}: {
  initialError?: string | null;
  returnTo?: string | null;
}) {
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);

  return isCreatingTrip ? (
    <TripCreator onCancel={() => setIsCreatingTrip(false)} />
  ) : (
    <StartScreen
      initialError={initialError}
      returnTo={returnTo}
      onCreateNew={() => setIsCreatingTrip(true)}
    />
  );
}
