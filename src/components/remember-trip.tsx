"use client";

import { useEffect } from "react";
import { rememberTrip } from "~/lib/saved-trips";

export function RememberTrip({
  tripName,
  urlKey,
  userName,
}: {
  tripName: string;
  urlKey: string;
  userName: string;
}) {
  useEffect(() => {
    rememberTrip({ tripName, urlKey, userName });
  }, [tripName, urlKey, userName]);

  return null;
}
