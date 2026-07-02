// The single integration point between the UI and the backend.
// The form calls submitBooking(); success is returned ONLY for a real HTTP 201
// from the API (a row was inserted). There is no local/preview success path —
// any non-2xx response throws a BookingError that the form surfaces as an error.

import type { BookingInput, BookingResult } from "./types";

export class BookingError extends Error {
  status?: number;
  fieldErrors?: Record<string, string>;
  constructor(message: string, status?: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "BookingError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function submitBooking(input: BookingInput): Promise<BookingResult> {
  let res: Response;
  try {
    res = await fetch("/api/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new BookingError("Network error. Please check your connection and try again.");
  }

  const data = await res.json().catch(() => ({} as Record<string, unknown>));

  // Success ONLY on 201 Created with a real booking reference from the DB.
  if (res.status === 201 && (data as { booking_reference?: string }).booking_reference) {
    const d = data as { booking_reference: string; manage_token?: string };
    return {
      booking_reference: d.booking_reference,
      name: input.name,
      booking_date: input.booking_date,
      booking_time: input.booking_time,
      guests: input.guests,
      meal_type: input.meal_type,
      occasion: input.occasion ?? null,
      manage_url: d.manage_token
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/manage?token=${d.manage_token}`
        : undefined,
    };
  }

  // Anything else is a real failure — never fabricate success.
  const message =
    (data as { message?: string }).message ||
    "We couldn't complete your reservation. Please try again.";
  throw new BookingError(message, res.status, (data as { fieldErrors?: Record<string, string> }).fieldErrors);
}
