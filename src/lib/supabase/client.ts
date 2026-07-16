"use client";

import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";
import type { Database } from "~/types/database";

let browserClient: ReturnType<typeof createClient<Database>> | null = null;

export function createBrowserSupabaseClient() {
  browserClient ??= createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );

  return browserClient;
}
