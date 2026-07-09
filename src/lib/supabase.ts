// Supabase BROWSER client — safe for client components.
// Uses the public anon key only (RLS-gated). Never put the service role key here.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!url || !anonKey) {
  // Don't throw at import time (keeps the build/SSG green if envs are absent in
  // a given environment); calls will simply fail until the vars are provided.
  if (typeof window !== "undefined") {
    console.warn("[supabase] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
}

export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: { persistSession: false },
});
