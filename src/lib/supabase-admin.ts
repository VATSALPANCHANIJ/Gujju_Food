// Supabase ADMIN client — SERVER ONLY.
// Uses the service role key (bypasses RLS). MUST never be imported into a client
// component / browser bundle. Import only from API routes / server code.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Hard guard: if this ever ends up in a browser bundle, fail loudly.
if (typeof window !== "undefined") {
  throw new Error("supabase-admin must never be imported on the client.");
}

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin env missing: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
