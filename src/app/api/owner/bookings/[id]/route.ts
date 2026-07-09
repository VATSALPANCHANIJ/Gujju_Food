// PATCH /api/owner/bookings/:id  → update status
// DELETE /api/owner/bookings/:id → delete booking
// Both require a valid owner session.

import { NextResponse } from "next/server";
import { isOwnerRequest } from "@/lib/admin/server-auth";
import { updateBookingStatus, deleteBooking, OWNER_STATUSES, type OwnerStatus } from "@/lib/admin/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isOwnerRequest())) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  if (!body.status || !OWNER_STATUSES.includes(body.status as OwnerStatus)) {
    return NextResponse.json({ success: false, message: "Invalid status." }, { status: 400 });
  }
  try {
    const booking = await updateBookingStatus(id, body.status as OwnerStatus);
    return NextResponse.json({ success: true, booking });
  } catch (e) {
    return NextResponse.json({ success: false, message: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isOwnerRequest())) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    await deleteBooking(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: (e as Error).message }, { status: 500 });
  }
}
