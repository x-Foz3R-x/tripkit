import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";
import type { Database } from "~/types/database";

export function createServerSupabaseClient() {
  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error(
      "Brakuje SUPABASE_SECRET_KEY. Po włączeniu RLS dane są dostępne wyłącznie dla serwera.",
    );
  }

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function hasSupabaseSecretKey() {
  return Boolean(env.SUPABASE_SECRET_KEY);
}
