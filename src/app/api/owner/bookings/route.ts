// POST /api/owner/bookings → owner creates a manual walk-in booking.
// Requires a valid owner session. Uses the existing bookings table.

import { NextResponse } from "next/server";
import { isOwnerRequest } from "@/lib/admin/server-auth";
import { createWalkIn, type WalkInInput } from "@/lib/admin/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await isOwnerRequest())) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Partial<WalkInInput>;
  if (!body.name || !body.phone || !body.booking_date || !body.booking_time || !body.meal_type || !body.guests) {
    return NextResponse.json({ success: false, message: "Name, phone, date, time, meal and guests are required." }, { status: 422 });
  }
  try {
    const booking = await createWalkIn({
      name: body.name,
      phone: body.phone,
      email: body.email,
      guests: Number(body.guests),
      booking_date: body.booking_date,
      booking_time: body.booking_time,
      meal_type: body.meal_type,
      occasion: body.occasion ?? null,
      special_request: body.special_request ?? null,
      status: body.status,
    });
    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, message: (e as Error).message }, { status: 500 });
  }
}
