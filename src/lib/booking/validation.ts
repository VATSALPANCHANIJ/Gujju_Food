// Shared validation — runs on the client (instant feedback) AND on the server
// (authoritative). Zero dependencies so it stays portable.

import type { BookingInput, GuestRange, MealType, Occasion } from "./types";

export const GUEST_RANGES: GuestRange[] = ["1-2", "3-4", "5-6", "7+"];
export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
export const OCCASIONS: Occasion[] = [
  "birthday",
  "anniversary",
  "date-night",
  "family-gathering",
  "other",
];

// Bookings allowed from today through the next 10 days (inclusive).
export const MAX_DAYS_AHEAD = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accept international-ish numbers: digits, spaces, +, -, parentheses (8–16 digits).
const PHONE_RE = /^[+]?[\d][\d\s().-]{7,18}$/;

export type FieldErrors = Partial<Record<keyof BookingInput, string>>;

/** Returns YYYY-MM-DD for `today` and the latest bookable date. */
export function bookingDateBounds(now: Date = new Date()): { min: string; max: string } {
  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const min = new Date(now);
  const max = new Date(now);
  max.setDate(max.getDate() + MAX_DAYS_AHEAD);
  return { min: toISO(min), max: toISO(max) };
}

export function validateBooking(
  input: Partial<BookingInput>,
  now: Date = new Date()
): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.name || input.name.trim().length < 2) {
    errors.name = "Please enter your name.";
  }
  if (!input.email || !EMAIL_RE.test(input.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (!input.phone || !PHONE_RE.test(input.phone.trim())) {
    errors.phone = "Please enter a valid mobile number.";
  }
  if (!input.guests || !GUEST_RANGES.includes(input.guests)) {
    errors.guests = "Please choose how many guests.";
  }
  if (!input.meal_type || !MEAL_TYPES.includes(input.meal_type)) {
    errors.meal_type = "Please choose a meal.";
  }
  if (input.occasion && !OCCASIONS.includes(input.occasion)) {
    errors.occasion = "Please choose a valid occasion.";
  }

  // Date must be within [today, today + 10 days].
  if (!input.booking_date) {
    errors.booking_date = "Please choose a date.";
  } else {
    const { min, max } = bookingDateBounds(now);
    if (input.booking_date < min) errors.booking_date = "That date has passed.";
    else if (input.booking_date > max)
      errors.booking_date = `Bookings open only up to ${MAX_DAYS_AHEAD} days ahead.`;
  }

  if (!input.booking_time) {
    errors.booking_time = "Please choose a time.";
  }

  if (input.special_request && input.special_request.length > 500) {
    errors.special_request = "Please keep requests under 500 characters.";
  }

  return errors;
}

export function isValid(errors: FieldErrors): boolean {
  return Object.keys(errors).length === 0;
}
