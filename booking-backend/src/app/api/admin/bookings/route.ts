// /api/admin/bookings — owner panel data + actions. Guarded by a shared token.
//   GET   → list all reservations (newest first)
//   PATCH → set status (confirm / arrived / completed / cancel)
// On "completed", the customer is recorded in past_customers for retention.

import { NextResponse } from "next/server";
import type { Booking, BookingStatus } from "@/lib/booking/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/booking/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: BookingStatus[] = ["pending", "confirmed", "arrived", "completed", "cancelled"];

function authorized(req: Request): boolean {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  if (!expected) return false;
  return req.headers.get("x-admin-token") === expected;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ message: "Not configured." }, { status: 501 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select()
    .order("booking_date", { ascending: true })
    .order("booking_time", { ascending: true });
  if (error) return NextResponse.json({ message: "Could not load reservations." }, { status: 500 });
  return NextResponse.json({ bookings: data });
}

export async function PATCH(req: Request) {
  if (!authorized(req)) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ message: "Not configured." }, { status: 501 });

  const body = (await req.json().catch(() => ({}))) as { id?: string; status?: BookingStatus };
  if (!body.id || !body.status || !VALID.includes(body.status)) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: body.status })
    .eq("id", body.id)
    .select()
    .single();
  if (error || !data) return NextResponse.json({ message: "Update failed." }, { status: 500 });

  const booking = data as Booking;
  if (booking.status === "completed") {
    await supabase.rpc("record_past_customer", {
      p_name: booking.name,
      p_phone: booking.phone,
      p_email: booking.email,
      p_visit: booking.booking_date,
    });
  }

  return NextResponse.json({ booking });
}
