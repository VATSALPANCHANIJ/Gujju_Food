// Supabase ADMIN client — SERVER ONLY.
// Uses the service role key (bypasses RLS). MUST never be imported into a client
// component / browser bundle. Import only from API routes / server code.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Hard guard: if this ever ends up in a browser bundle, fail loudly.
if (typeof window !== "undefined") {
  throw new Error("supabase-admin must never be imported on the client.");
}

// Env values are .trim()'d to survive copy-paste mistakes (trailing spaces /
// newlines / accidental comments) — a common cause of "works locally, fails on
// the host" because dashboards keep whatever was pasted verbatim.
const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  if (!URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase admin env missing: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  cached = createClient(URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(URL && SERVICE_ROLE_KEY);
}

// Decode a JWT payload without verifying the signature (just to read `role`).
function decodeJwtRole(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(b64, "base64").toString("utf8");
    return (JSON.parse(json) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

// Validates that the configured key is a real service_role JWT. Catches the two
// most common host misconfigurations: the ANON key pasted into the service var
// (→ RLS blocks inserts), and a malformed/garbled value (→ "Invalid API key").
export function checkServiceRoleKey():
  | { ok: true }
  | { ok: false; reason: string } {
  if (!URL) return { ok: false, reason: "NEXT_PUBLIC_SUPABASE_URL is not set." };
  if (!SERVICE_ROLE_KEY) return { ok: false, reason: "SUPABASE_SERVICE_ROLE_KEY is not set." };

  const role = decodeJwtRole(SERVICE_ROLE_KEY);
  if (role === null) {
    return {
      ok: false,
      reason:
        "SUPABASE_SERVICE_ROLE_KEY is not a valid JWT (malformed paste — extra text, comment, or whitespace?).",
    };
  }
  if (role !== "service_role") {
    return {
      ok: false,
      reason: `SUPABASE_SERVICE_ROLE_KEY has role "${role}", expected "service_role" (looks like the anon key was pasted).`,
    };
  }
  return { ok: true };
}
