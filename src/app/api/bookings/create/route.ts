// POST /api/bookings/create
<<<<<<< HEAD
// Flow: validate → insert into Supabase → append to Google Sheets → 201.
// A Google append failure returns 500 (the booking is already in Supabase;
// the failure is surfaced, never silently ignored).
=======
// Server-side: validate → generate reference + manage token → insert into the
// existing `bookings` table → return success. Service role key stays server-only.
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2

import { NextResponse } from "next/server";
import { validateBooking, isValid } from "@/lib/booking/validation";
import type { BookingInput } from "@/lib/booking/types";
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  checkServiceRoleKey,
} from "@/lib/supabase-admin";
import { appendBookingToSheet } from "@/lib/google-sheet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

<<<<<<< HEAD
// ---- lightweight, rate-limit-ready guard (per warm instance) ----------------
const RATE_LIMIT = { max: 6, windowMs: 60_000 };
const hits = new Map<string, { count: number; start: number }>();
=======
// Set BOOKING_DEBUG=1 (env) to include DB error details in 500 responses.
const DEBUG = process.env.BOOKING_DEBUG === "1";

// ---- lightweight, rate-limit-ready guard (per warm instance) ----------------
// For multi-instance hard limits, swap this Map for Upstash/Vercel KV.
const RATE_LIMIT = { max: 6, windowMs: 60_000 };
const hits = new Map<string, { count: number; start: number }>();

>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
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
<<<<<<< HEAD
=======

>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

<<<<<<< HEAD
// The existing `bookings.guests` column is INTEGER; the form sends a range chip.
const GUESTS_TO_INT: Record<string, number> = { "1-2": 2, "3-4": 4, "5-6": 6, "7+": 7 };
function guestsToInt(range: string): number {
  return GUESTS_TO_INT[range] ?? (Number.parseInt(range, 10) || 1);
}

// Booking reference: GFH-<year>-0001 (sequential per year).
async function nextBookingReference(admin: ReturnType<typeof getSupabaseAdmin>): Promise<string> {
=======
// ---- booking reference: GFH-<year>-0001 (sequential per year) ----------------
async function nextBookingReference(
  admin: ReturnType<typeof getSupabaseAdmin>
): Promise<string> {
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
  const year = new Date().getFullYear();
  const prefix = `GFH-${year}-`;
  const { data, error } = await admin
    .from("bookings")
    .select("booking_reference")
    .like("booking_reference", `${prefix}%`)
    .order("booking_reference", { ascending: false })
    .limit(1);
<<<<<<< HEAD
  let next = 1;
  if (!error && data && data.length > 0) {
    const n = parseInt(String(data[0].booking_reference).slice(prefix.length), 10);
=======

  let next = 1;
  if (!error && data && data.length > 0) {
    const last = String(data[0].booking_reference);
    const n = parseInt(last.slice(prefix.length), 10);
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
    if (Number.isFinite(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status });
}

<<<<<<< HEAD
export async function POST(req: Request) {
  console.log("[booking] API Started");

  if (isRateLimited(clientIp(req))) {
    return json({ success: false, message: "Too many requests. Please wait a moment and try again." }, 429);
  }

  // 1) Validate request
=======
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
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
  let input: BookingInput;
  try {
    input = (await req.json()) as BookingInput;
  } catch {
<<<<<<< HEAD
    return json({ success: false, message: "Invalid request body." }, 400);
  }
  const fieldErrors = validateBooking(input);
  if (!isValid(fieldErrors)) {
    return json({ success: false, message: "Please check the highlighted fields.", fieldErrors }, 422);
  }

  // Config guards
  if (!isSupabaseConfigured()) {
    return json({ success: false, message: "Booking service is not configured." }, 503);
  }
  const keyCheck = checkServiceRoleKey();
  if (!keyCheck.ok) {
    console.error("[booking] SERVICE ROLE KEY INVALID:", keyCheck.reason);
    return json({ success: false, message: "Booking service is misconfigured." }, 500);
  }

  const admin = getSupabaseAdmin();

=======
    console.warn("[booking] 400 — invalid JSON body");
    return json({ success: false, message: "Invalid request body." }, 400);
  }
  console.log("[booking] request received", {
    date: input?.booking_date,
    time: input?.booking_time,
    guests: input?.guests,
    meal: input?.meal_type,
  });

  // 3) Server-side validation (authoritative — never trust the client)
  const fieldErrors = validateBooking(input);
  if (!isValid(fieldErrors)) {
    console.warn("[booking] 422 — validation failed:", Object.keys(fieldErrors));
    return json(
      { success: false, message: "Please check the highlighted fields.", fieldErrors },
      422
    );
  }
  console.log("[booking] validation passed");

  // 4) Config guard
  if (!isSupabaseConfigured()) {
    console.error(
      "[booking] 503 — Supabase env missing. URL set?",
      !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
      "| SERVICE_ROLE set?",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    return json(
      { success: false, message: "Booking service is not configured." },
      503
    );
  }

  // 4b) Validate the service role key up front so a wrong/garbled key (the
  // classic host env-var mistake) fails with a precise, actionable message
  // instead of an opaque insert error.
  const keyCheck = checkServiceRoleKey();
  if (!keyCheck.ok) {
    console.error("[booking] SERVICE ROLE KEY INVALID:", keyCheck.reason);
    return json(
      {
        success: false,
        message: "Booking service is misconfigured. Please contact us.",
        debug: DEBUG ? { reason: keyCheck.reason } : undefined,
      },
      500
    );
  }

  const admin = getSupabaseAdmin();
  console.log("[booking] supabase connected (service key valid)");

  // 5) Insert with reference-collision retry (handles concurrent inserts)
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
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

<<<<<<< HEAD
  // 2) Save booking to Supabase (retry on reference collision)
=======
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
  for (let attempt = 0; attempt < 5; attempt++) {
    const booking_reference = await nextBookingReference(admin);
    const manage_token = crypto.randomUUID();

<<<<<<< HEAD
=======
    console.log("[booking] INSERTING", { booking_reference, guests: payload.guests });

>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
    const { data, error } = await admin
      .from("bookings")
      .insert({ ...payload, booking_reference, manage_token })
      .select("id, booking_reference, manage_token, created_at")
      .single();

<<<<<<< HEAD
    // 23505 = unique_violation (reference race) → recompute and retry
    if (error && (error as { code?: string }).code === "23505") continue;

    if (error || !data) {
      console.error("[booking] SUPABASE ERROR", error);
      return json({ success: false, message: "Could not save your reservation. Please try again." }, 500);
    }

    // 3) Log successful insert
    console.log("[booking] Supabase insert successful", data.booking_reference);

    // 4-6) Append to Google Sheets — awaited BEFORE returning success.
    // On failure: log the full error and return 500 (do NOT silently ignore).
    try {
      console.log("[booking] Calling appendBookingToSheet()");
      await appendBookingToSheet({
        booking_reference: data.booking_reference,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        created_at: (data as { created_at?: string }).created_at ?? null,
        booking_date: payload.booking_date,
        booking_time: payload.booking_time,
        guests: payload.guests,
        meal_type: payload.meal_type,
        occasion: payload.occasion,
        special_request: payload.special_request,
        status: payload.status,
      });
      console.log("[booking] Google append successful");
    } catch (sheetErr) {
      console.error("[booking] Google append failed:", sheetErr);
      return json(
        {
          success: false,
          message: "Reservation saved, but syncing to Google Sheets failed. Please contact us.",
          booking_reference: data.booking_reference,
=======
    console.log("[booking] INSERT RESULT", { ok: !error, id: data?.id ?? null, code: error?.code ?? null });
    if (error) console.error("[booking] SUPABASE ERROR", error);

    if (!error && data) {
      console.log("[booking] Supabase insert successful", data.booking_reference);

      // Mirror to Google Sheets. Supabase is the source of truth; a Sheets
      // failure is logged but MUST NOT fail the booking (already saved).
      // Awaited so the row is written before we return success.
      try {
        console.log("[booking] Calling Google Sheets append");
        await appendBookingToSheet({
          booking_reference: data.booking_reference,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          guests: payload.guests,
          booking_date: payload.booking_date,
          booking_time: payload.booking_time,
          meal_type: payload.meal_type,
          occasion: payload.occasion,
          special_request: payload.special_request,
          status: payload.status,
          created_at: (data as { created_at?: string }).created_at ?? null,
        });
        console.log("[booking] Google append successful");
      } catch (sheetErr) {
        console.error("[booking] Google append failed", sheetErr);
      }

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
          debug: DEBUG
            ? {
                code: (error as { code?: string }).code ?? null,
                message: error.message ?? null,
                hint: (error as { hint?: string }).hint ?? null,
                details: (error as { details?: string }).details ?? null,
              }
            : undefined,
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
        },
        500
      );
    }
<<<<<<< HEAD

    // 7) Return success
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

  return json({ success: false, message: "Could not generate a unique booking reference. Please retry." }, 500);
=======
  }

  return json(
    { success: false, message: "Could not generate a unique booking reference. Please retry." },
    500
  );
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
}
