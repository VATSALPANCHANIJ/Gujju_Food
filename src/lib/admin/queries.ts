// Owner-panel data access — SERVER ONLY. Reads/writes the EXISTING `bookings`
// table via the Supabase service role. No new tables, no data duplication.

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  computeStats,
  todayISO,
  tomorrowISO,
  OWNER_STATUSES,
  type AdminBooking,
  type DashboardStats,
  type OwnerStatus,
} from "./shared";

// Re-export the shared pieces so existing importers keep working.
export { computeStats, todayISO, tomorrowISO, OWNER_STATUSES };
export type { AdminBooking, DashboardStats, OwnerStatus };

/** All bookings, newest first. Restaurant scale — a single query is fine. */
export async function fetchAllBookings(): Promise<AdminBooking[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load bookings: ${error.message}`);
  return (data || []) as AdminBooking[];
}

export async function updateBookingStatus(id: string, status: OwnerStatus): Promise<AdminBooking> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Status update failed: ${error?.message || "not found"}`);
  return data as AdminBooking;
}

export async function deleteBooking(id: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("bookings").delete().eq("id", id);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

async function nextReference(): Promise<string> {
  const admin = getSupabaseAdmin();
  const prefix = `GFH-${new Date().getFullYear()}-`;
  const { data } = await admin
    .from("bookings")
    .select("booking_reference")
    .like("booking_reference", `${prefix}%`)
    .order("booking_reference", { ascending: false })
    .limit(1);
  let n = 1;
  if (data && data.length) {
    const parsed = parseInt(String(data[0].booking_reference).slice(prefix.length), 10);
    if (Number.isFinite(parsed)) n = parsed + 1;
  }
  return `${prefix}${String(n).padStart(4, "0")}`;
}

export interface WalkInInput {
  name: string;
  phone: string;
  email?: string;
  guests: number;
  booking_date: string;
  booking_time: string;
  meal_type: string;
  occasion?: string | null;
  special_request?: string | null;
  status?: OwnerStatus;
}

export async function createWalkIn(input: WalkInInput): Promise<AdminBooking> {
  const admin = getSupabaseAdmin();
  const booking_reference = await nextReference();
  const manage_token = crypto.randomUUID();
  const { data, error } = await admin
    .from("bookings")
    .insert({
      booking_reference,
      name: input.name.trim(),
      email: (input.email || "").trim().toLowerCase() || `walkin+${booking_reference}@gujju-food.local`,
      phone: input.phone.trim(),
      guests: input.guests,
      booking_date: input.booking_date,
      booking_time: input.booking_time,
      meal_type: input.meal_type,
      occasion: input.occasion ?? null,
      special_request: input.special_request?.trim() || "Walk-in (added by owner)",
      status: input.status || "confirmed",
      manage_token,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`Walk-in create failed: ${error?.message || "unknown"}`);
  return data as AdminBooking;
}
