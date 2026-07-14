"use client";

import { useState } from "react";
import { useTrip } from "~/providers/trip-provider";
import { Dashboard } from "~/components/modules/hub/dashboard";
import { StartScreen } from "~/components/modules/auth/start-screen";
import { TripCreator } from "~/components/modules/auth/trip-creator";

export default function HomePage() {
  const { activeSession, isLoaded } = useTrip();
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);

  if (!isLoaded) return null;
  if (activeSession) return <Dashboard />;

  return (
    <div className="brand-shell bg-theme-bg text-theme-text -mx-4 -mt-4 min-h-dvh px-4 pt-4">
      {isCreatingTrip ? (
        <TripCreator onCancel={() => setIsCreatingTrip(false)} />
      ) : (
        <StartScreen onCreateNew={() => setIsCreatingTrip(true)} />
      )}
    </div>
  );
}
