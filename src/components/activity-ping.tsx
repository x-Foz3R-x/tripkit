"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { touchParticipantActivityAction } from "~/app/actions/activity";

export function ActivityPing({ tripKey }: { tripKey: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const touch = () => {
      if (document.visibilityState !== "visible") return;
      void touchParticipantActivityAction(tripKey).catch(() => {
        // Obecność jest pomocnicza i nie może psuć widoku przy słabym zasięgu.
      });
    };

    touch();
    document.addEventListener("visibilitychange", touch);
    return () => document.removeEventListener("visibilitychange", touch);
  }, [pathname, tripKey]);

  return null;
}
