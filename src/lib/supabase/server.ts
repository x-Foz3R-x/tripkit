import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";
import type { Database } from "~/types/database";

export function createServerSupabaseClient() {
  const key = env.SUPABASE_SECRET_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, key, {
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
