// /api/bookings/manage?token=...  — customer self-service, no login.
//   GET   → fetch the booking for the manage page
//   PATCH → change date / time / guests   (body: { date?, time?, guests? })
//   POST  → cancel                         (body: { action: "cancel" })

import { NextResponse } from "next/server";
import { bookingDateBounds, GUEST_RANGES } from "@/lib/booking/validation";
import type { Booking } from "@/lib/booking/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/booking/server/supabase";
import { sendCustomerConfirmation } from "@/lib/booking/server/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenFrom(req: Request): string | null {
  return new URL(req.url).searchParams.get("token");
}

async function findByToken(token: string): Promise<Booking | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("bookings").select().eq("manage_token", token).single();
  return (data as Booking) || null;
}

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ message: "Not configured." }, { status: 501 });
  const token = tokenFrom(req);
  if (!token) return NextResponse.json({ message: "Missing token." }, { status: 400 });
  const booking = await findByToken(token);
  if (!booking) return NextResponse.json({ message: "Reservation not found." }, { status: 404 });
  return NextResponse.json({ booking });
}

export async function PATCH(req: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ message: "Not configured." }, { status: 501 });
  const token = tokenFrom(req);
  if (!token) return NextResponse.json({ message: "Missing token." }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as {
    date?: string;
    time?: string;
    guests?: string;
  };

  const existing = await findByToken(token);
  if (!existing) return NextResponse.json({ message: "Reservation not found." }, { status: 404 });
  if (existing.status === "cancelled" || existing.status === "completed") {
    return NextResponse.json({ message: "This reservation can no longer be changed." }, { status: 409 });
  }

  const patch: Record<string, unknown> = {};
  if (body.date) {
    const { min, max } = bookingDateBounds();
    if (body.date < min || body.date > max) {
      return NextResponse.json({ message: "Choose a date within the next 10 days." }, { status: 422 });
    }
    patch.booking_date = body.date;
  }
  if (body.time) patch.booking_time = body.time;
  if (body.guests) {
    if (!GUEST_RANGES.includes(body.guests as Booking["guests"])) {
      return NextResponse.json({ message: "Invalid guest selection." }, { status: 422 });
    }
    patch.guests = body.guests;
  }
  // A change re-opens confirmation.
  patch.status = "pending";
  patch.reminder_sent_at = null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .update(patch)
    .eq("manage_token", token)
    .select()
    .single();
  if (error || !data) return NextResponse.json({ message: "Update failed." }, { status: 500 });

  await sendCustomerConfirmation(data as Booking).catch(() => {});
  return NextResponse.json({ booking: data });
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ message: "Not configured." }, { status: 501 });
  const token = tokenFrom(req);
  if (!token) return NextResponse.json({ message: "Missing token." }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "cancel") return NextResponse.json({ message: "Unsupported action." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("manage_token", token)
    .select()
    .single();
  if (error || !data) return NextResponse.json({ message: "Cancel failed." }, { status: 500 });
  return NextResponse.json({ booking: data });
}
