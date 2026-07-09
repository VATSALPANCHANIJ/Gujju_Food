// Pure, client-safe admin helpers (NO Supabase import) — usable in client
// components as well as on the server.

export const OWNER_STATUSES = ["pending", "confirmed", "completed", "cancelled", "no-show"] as const;
export type OwnerStatus = (typeof OWNER_STATUSES)[number];

export const STATUS_LABEL: Record<OwnerStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No Show",
};

export interface AdminBooking {
  id: string;
  booking_reference: string;
  name: string;
  email: string;
  phone: string;
  guests: number | string;
  booking_date: string;
  booking_time: string;
  meal_type: string;
  occasion: string | null;
  special_request: string | null;
  status: string;
  manage_token?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface DashboardStats {
  today: number;
  tomorrow: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  noShow: number;
  completed: number;
  totalGuestsToday: number;
  upcoming: number;
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}
export function tomorrowISO(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  return toISODate(d);
}

export function computeStats(bookings: AdminBooking[], now: Date = new Date()): DashboardStats {
  const t = todayISO(now);
  const tm = tomorrowISO(now);
  const active = (b: AdminBooking) => b.status !== "cancelled";
  const guests = (b: AdminBooking) => Number(b.guests) || 0;
  return {
    today: bookings.filter((b) => b.booking_date === t && active(b)).length,
    tomorrow: bookings.filter((b) => b.booking_date === tm && active(b)).length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    noShow: bookings.filter((b) => b.status === "no-show").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    totalGuestsToday: bookings.filter((b) => b.booking_date === t && active(b)).reduce((s, b) => s + guests(b), 0),
    upcoming: bookings.filter((b) => b.booking_date >= t && active(b)).length,
  };
}

// display helpers
export function fmtDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
export function fmtTime(t: string): string {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
export function fmtDateTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}
