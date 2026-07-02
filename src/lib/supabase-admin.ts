// Supabase ADMIN client — SERVER ONLY.
// Uses the service role / secret key (bypasses RLS). MUST never be imported into
// a client component / browser bundle. Import only from API routes / server code.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Hard guard: service credentials must never reach the browser bundle.
if (typeof window !== "undefined") {
  throw new Error("supabase-admin must never be imported on the client.");
}

// Prefer a server-only SUPABASE_URL (runtime) over NEXT_PUBLIC_* (inlined at
// build time). Trim values to survive copy-paste whitespace/newlines.
const URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
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

// Decode a JWT payload (no signature check) just to read `role`.
function decodeJwtRole(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    return (JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

// Accepts BOTH the new Supabase secret key ("sb_secret_…") and a legacy
// service_role JWT ("eyJ…"). Rejects publishable/anon keys and garbled pastes.
export function checkServiceRoleKey(): { ok: true } | { ok: false; reason: string } {
  if (!URL) return { ok: false, reason: "NEXT_PUBLIC_SUPABASE_URL is not set." };
  if (!SERVICE_ROLE_KEY) return { ok: false, reason: "SUPABASE_SERVICE_ROLE_KEY is not set." };

  if (SERVICE_ROLE_KEY.startsWith("sb_secret_")) return { ok: true };
  if (SERVICE_ROLE_KEY.startsWith("sb_publishable_")) {
    return {
      ok: false,
      reason: 'SUPABASE_SERVICE_ROLE_KEY is a publishable key ("sb_publishable_…"). Use the SECRET key ("sb_secret_…").',
    };
  }

  const role = decodeJwtRole(SERVICE_ROLE_KEY);
  if (role === "service_role") return { ok: true };
  if (role === "anon") {
    return { ok: false, reason: 'SUPABASE_SERVICE_ROLE_KEY has role "anon". Use the service_role / secret key.' };
  }
  if (role) return { ok: false, reason: `SUPABASE_SERVICE_ROLE_KEY has role "${role}", expected "service_role".` };

  return {
    ok: false,
    reason: 'SUPABASE_SERVICE_ROLE_KEY is not recognised. Expected "sb_secret_…" or a service_role JWT.',
  };
}
