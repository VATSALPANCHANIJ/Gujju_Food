// POST /api/bookings/create
// Server-side: validate → generate reference + manage token → insert into the
// existing `bookings` table → return success. Service role key stays server-only.

import { NextResponse } from "next/server";
import { validateBooking, isValid } from "@/lib/booking/validation";
import type { BookingInput } from "@/lib/booking/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---- lightweight, rate-limit-ready guard (per warm instance) ----------------
// For multi-instance hard limits, swap this Map for Upstash/Vercel KV.
const RATE_LIMIT = { max: 6, windowMs: 60_000 };
const hits = new Map<string, { count: number; start: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > RATE_LIMIT.windowMs) {
    hits.set(ip, { count: 1, start: now });
    return false;
  }
  rec.count += 1;
  return rec.count > RATE_LIMIT.max;
}

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// ---- booking reference: GFH-<year>-0001 (sequential per year) ----------------
async function nextBookingReference(
  admin: ReturnType<typeof getSupabaseAdmin>
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GFH-${year}-`;
  const { data, error } = await admin
    .from("bookings")
    .select("booking_reference")
    .like("booking_reference", `${prefix}%`)
    .order("booking_reference", { ascending: false })
    .limit(1);

  let next = 1;
  if (!error && data && data.length > 0) {
    const last = String(data[0].booking_reference);
    const n = parseInt(last.slice(prefix.length), 10);
    if (Number.isFinite(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status });
}

// The existing `bookings.guests` column is INTEGER, but the form sends a range
// chip ("1-2" | "3-4" | "5-6" | "7+"). Store the upper bound (party-size ceiling).
const GUESTS_TO_INT: Record<string, number> = { "1-2": 2, "3-4": 4, "5-6": 6, "7+": 7 };
function guestsToInt(range: string): number {
  return GUESTS_TO_INT[range] ?? (Number.parseInt(range, 10) || 1);
}

export async function POST(req: Request) {
  console.log("[booking] BOOKING API STARTED");
  console.log(
    "[booking] env — SUPABASE_URL set?",
    !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    "| SERVICE_ROLE set?",
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1) Rate limit (anti-duplicate / abuse)
  if (isRateLimited(clientIp(req))) {
    return json(
      { success: false, message: "Too many requests. Please wait a moment and try again." },
      429
    );
  }

  // 2) Parse body
  let input: BookingInput;
  try {
    input = (await req.json()) as BookingInput;
  } catch {
    return json({ success: false, message: "Invalid request body." }, 400);
  }

  // 3) Server-side validation (authoritative — never trust the client)
  const fieldErrors = validateBooking(input);
  if (!isValid(fieldErrors)) {
    return json(
      { success: false, message: "Please check the highlighted fields.", fieldErrors },
      422
    );
  }

  // 4) Config guard
  if (!isSupabaseConfigured()) {
    return json(
      { success: false, message: "Booking service is not configured." },
      503
    );
  }

  const admin = getSupabaseAdmin();

  // 5) Insert with reference-collision retry (handles concurrent inserts)
  const payload = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    guests: guestsToInt(input.guests),
    booking_date: input.booking_date,
    booking_time: input.booking_time,
    meal_type: input.meal_type,
    occasion: input.occasion ?? null,
    special_request: input.special_request?.trim() || null,
    status: "pending" as const,
  };

  for (let attempt = 0; attempt < 5; attempt++) {
    const booking_reference = await nextBookingReference(admin);
    const manage_token = crypto.randomUUID();

    console.log("[booking] INSERTING", { booking_reference, guests: payload.guests });

    const { data, error } = await admin
      .from("bookings")
      .insert({ ...payload, booking_reference, manage_token })
      .select("id, booking_reference, manage_token")
      .single();

    console.log("[booking] INSERT RESULT", { ok: !error, id: data?.id ?? null, code: error?.code ?? null });
    if (error) console.error("[booking] SUPABASE ERROR", error);

    if (!error && data) {
      return json(
        {
          success: true,
          message: "Your table has been reserved.",
          booking_id: data.id,
          booking_reference: data.booking_reference,
          manage_token: data.manage_token,
        },
        201
      );
    }

    // 23505 = unique_violation (reference race) → recompute and retry
    if (error && (error as { code?: string }).code === "23505") continue;

    // Any other DB error → stop
    if (error) {
      return json(
        {
          success: false,
          message: "Could not save your reservation. Please try again.",
          // TEMP production diagnostics — remove after root cause confirmed.
          debug: {
            code: (error as { code?: string }).code ?? null,
            message: error.message ?? null,
            hint: (error as { hint?: string }).hint ?? null,
            details: (error as { details?: string }).details ?? null,
            serviceKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            urlPresent: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          },
        },
        500
      );
    }
  }

  return json(
    { success: false, message: "Could not generate a unique booking reference. Please retry." },
    500
  );
}
