// Email sending via Resend, using the branded templates in components/Booking.
// Activation: `npm i resend`.

import { Resend } from "resend";
import type { Booking } from "@/lib/booking/types";
import { BookingConfirmationEmail } from "@/components/Booking/BookingConfirmationEmail";
import { BookingOwnerEmail } from "@/components/Booking/BookingOwnerEmail";
import { BookingReminder } from "@/components/Booking/BookingReminder";

function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function from(): string {
  return process.env.BOOKING_FROM_EMAIL || "Gujju Food Hub <onboarding@resend.dev>";
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function sendCustomerConfirmation(b: Booking) {
  const r = resend();
  if (!r) return;
  const { subject, html } = BookingConfirmationEmail(b, siteUrl());
  await r.emails.send({ from: from(), to: b.email, subject, html });
}

export async function sendOwnerNotification(b: Booking) {
  const r = resend();
  const owner = process.env.BOOKING_OWNER_EMAIL;
  if (!r || !owner) return;
  const { subject, html } = BookingOwnerEmail(b);
  await r.emails.send({ from: from(), to: owner, subject, html });
}

export async function sendReminder(b: Booking) {
  const r = resend();
  if (!r) return;
  const { subject, html } = BookingReminder(b, siteUrl());
  await r.emails.send({ from: from(), to: b.email, subject, html });
}
