// /api/cron/reminders — invoked by Vercel Cron (see vercel.json).
// Sends the 2-hours-before reminder once per booking. Idempotent via reminder_sent_at.
// Schedule it every ~15 min; the window + flag prevent duplicates.

import { NextResponse } from "next/server";
import type { Booking } from "@/lib/booking/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/booking/server/supabase";
import { sendReminder } from "@/lib/booking/server/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Venue wall-clock offset from UTC, in minutes (Hobart AEST = +600, AEDT = +660).
const OFFSET_MIN = Number(process.env.BOOKING_UTC_OFFSET_MIN ?? 600);

function bookingInstantMs(b: Pick<Booking, "booking_date" | "booking_time">): number {
  // Interpret stored date+time as venue-local, convert to a UTC instant.
  const utcAsIfLocal = Date.parse(`${b.booking_date}T${b.booking_time}:00Z`);
  return utcAsIfLocal - OFFSET_MIN * 60_000;
}

export async function GET(req: Request) {
  // Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET>.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseConfigured()) return NextResponse.json({ message: "Not configured." }, { status: 501 });

  const supabase = getSupabaseAdmin();
  const now = Date.now();
  const windowMs = 2 * 60 * 60 * 1000; // 2 hours

  // Candidates: confirmed/pending, not yet reminded, dated today or tomorrow.
  const { data, error } = await supabase
    .from("bookings")
    .select()
    .in("status", ["pending", "confirmed"])
    .is("reminder_sent_at", null);
  if (error) return NextResponse.json({ message: "Query failed." }, { status: 500 });

  const due = (data as Booking[]).filter((b) => {
    const delta = bookingInstantMs(b) - now;
    return delta > 0 && delta <= windowMs;
  });

  let sent = 0;
  for (const b of due) {
    try {
      await sendReminder(b);
      await supabase
        .from("bookings")
        .update({ reminder_sent_at: new Date(now).toISOString() })
        .eq("id", b.id);
      sent++;
    } catch {
      /* try again next tick */
    }
  }

  return NextResponse.json({ checked: data?.length ?? 0, sent });
}
