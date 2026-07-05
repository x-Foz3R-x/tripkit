import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";
import type { Database } from "~/types/database";

// Podpinamy wygenerowane typy do klienta
export const supabase = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
