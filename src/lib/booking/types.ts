// Shared booking domain types — used by the UI, the API routes, and the emails.
// Self-contained so the Booking module stays portable.

export type MealType = "breakfast" | "lunch" | "dinner";

export type Occasion =
  | "birthday"
  | "anniversary"
  | "date-night"
  | "family-gathering"
  | "other";

export type GuestRange = "1-2" | "3-4" | "5-6" | "7+";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "arrived"
  | "completed"
  | "cancelled";

// What the form collects and POSTs to the API.
export interface BookingInput {
  name: string;
  email: string;
  phone: string;
  guests: GuestRange;
  booking_date: string; // ISO date: YYYY-MM-DD
  booking_time: string; // 24h HH:mm
  meal_type: MealType;
  occasion?: Occasion | null;
  special_request?: string | null;
  turnstile_token?: string; // Cloudflare Turnstile response token
}

// A persisted booking row (mirrors the Supabase `bookings` table).
export interface Booking extends Omit<BookingInput, "turnstile_token"> {
  id: string;
  booking_reference: string;
  status: BookingStatus;
  manage_token: string;
  created_at: string;
  updated_at: string;
}

// API response for a successful reservation — drives the success screen.
export interface BookingResult {
  booking_reference: string;
  name: string;
  booking_date: string;
  booking_time: string;
  guests: GuestRange;
  meal_type: MealType;
  occasion?: Occasion | null;
  manage_url?: string;
  /** True when the backend is not yet connected and this is a preview response. */
  preview?: boolean;
}

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export const OCCASION_LABELS: Record<Occasion, string> = {
  birthday: "Birthday",
  anniversary: "Anniversary",
  "date-night": "Date Night",
  "family-gathering": "Family Gathering",
  other: "Other",
};

export const GUEST_LABELS: Record<GuestRange, string> = {
  "1-2": "1–2",
  "3-4": "3–4",
  "5-6": "5–6",
  "7+": "7+",
};
