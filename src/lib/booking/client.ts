// The single integration point between the UI and the backend.
// The form calls submitBooking() and never talks to fetch/Supabase directly,
// so swapping in the live API requires zero changes to the components.

import type { BookingInput, BookingResult } from "./types";
import { generateBookingReference } from "./reference";

export class BookingError extends Error {
  fieldErrors?: Record<string, string>;
  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "BookingError";
    this.fieldErrors = fieldErrors;
  }
}

// Until the backend is wired, the UI still needs to demonstrate the full
// success experience for client review. This flag controls that. Set
// NEXT_PUBLIC_BOOKING_DEMO=false once Supabase/Resend/Turnstile are connected
// to force real API responses only.
const PREVIEW_FALLBACK = process.env.NEXT_PUBLIC_BOOKING_DEMO !== "false";

export async function submitBooking(input: BookingInput): Promise<BookingResult> {
  try {
    const res = await fetch("/api/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    // Route missing / not configured (e.g. static host) → preview the UX.
    if (res.status === 404 || res.status === 501 || res.status === 503) {
      if (PREVIEW_FALLBACK) return previewResult(input);
      throw new BookingError("Booking service is not available yet.");
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new BookingError(
        data?.message || "We couldn't complete your reservation. Please try again.",
        data?.fieldErrors
      );
    }

    // The API returns { booking_reference, booking_id, manage_token }. The success
    // screen also needs the chosen details, so merge them from the input.
    return {
      booking_reference: data.booking_reference,
      name: input.name,
      booking_date: input.booking_date,
      booking_time: input.booking_time,
      guests: input.guests,
      meal_type: input.meal_type,
      occasion: input.occasion ?? null,
      manage_url: data.manage_token
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/manage?token=${data.manage_token}`
        : undefined,
    };
  } catch (err) {
    if (err instanceof BookingError) throw err;
    // Network failure (e.g. no API in this environment) → preview, or surface.
    if (PREVIEW_FALLBACK) return previewResult(input);
    throw new BookingError("Network error. Please check your connection and try again.");
  }
}

// Local, clearly-flagged preview response. NOT persisted, NO emails sent.
function previewResult(input: BookingInput): BookingResult {
  return {
    booking_reference: generateBookingReference(),
    name: input.name,
    booking_date: input.booking_date,
    booking_time: input.booking_time,
    guests: input.guests,
    meal_type: input.meal_type,
    occasion: input.occasion ?? null,
    preview: true,
  };
}
