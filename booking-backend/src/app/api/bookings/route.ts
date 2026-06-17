// POST /api/bookings — create a reservation.
// Flow: Turnstile → validate → insert (Supabase) → emails (Resend) → result.

import { NextResponse } from "next/server";
import { validateBooking, isValid } from "@/lib/booking/validation";
import { generateBookingReference, generateManageToken, manageUrl } from "@/lib/booking/reference";
import type { Booking, BookingInput, BookingResult } from "@/lib/booking/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/booking/server/supabase";
import { verifyTurnstile } from "@/lib/booking/server/turnstile";
import { sendCustomerConfirmation, sendOwnerNotification } from "@/lib/booking/server/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Very small in-memory rate limit (per warm instance). For hard guarantees use
// Upstash/Vercel KV — see BOOKING_ARCHITECTURE.md.
const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string, max = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.t > windowMs) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  rec.n += 1;
  return rec.n > max;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ message: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  let input: BookingInput;
  try {
    input = (await req.json()) as BookingInput;
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  // 1) Bot protection
  const human = await verifyTurnstile(input.turnstile_token, ip);
  if (!human) {
    return NextResponse.json({ message: "Verification failed. Please try again." }, { status: 400 });
  }

  // 2) Authoritative validation
  const errors = validateBooking(input);
  if (!isValid(errors)) {
    return NextResponse.json({ message: "Please check the highlighted fields.", fieldErrors: errors }, { status: 422 });
  }

  // 3) Persist
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: "Booking service not configured." }, { status: 501 });
  }

  const reference = generateBookingReference();
  const manage_token = generateManageToken();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      booking_reference: reference,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      guests: input.guests,
      booking_date: input.booking_date,
      booking_time: input.booking_time,
      meal_type: input.meal_type,
      occasion: input.occasion ?? null,
      special_request: input.special_request?.trim() || null,
      status: "pending",
      manage_token,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ message: "Could not save your reservation. Please try again." }, { status: 500 });
  }

  const booking = data as Booking;

  // 4) Emails (don't fail the booking if email hiccups)
  try {
    await Promise.allSettled([sendCustomerConfirmation(booking), sendOwnerNotification(booking)]);
  } catch {
    /* logged by Resend; reservation already saved */
  }

  // 5) Result for the success screen
  const result: BookingResult = {
    booking_reference: booking.booking_reference,
    name: booking.name,
    booking_date: booking.booking_date,
    booking_time: booking.booking_time,
    guests: booking.guests,
    meal_type: booking.meal_type,
    occasion: booking.occasion ?? null,
    manage_url: manageUrl(process.env.NEXT_PUBLIC_SITE_URL || "", booking.manage_token),
  };
  return NextResponse.json(result, { status: 201 });
}
