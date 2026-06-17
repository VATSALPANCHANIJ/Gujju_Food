// Customer confirmation email — "Your Reservation at Gujju Food Hub".
// Dependency-free HTML (inline styles). Returns { subject, html } for Resend.

import type { Booking } from "@/lib/booking/types";
import { BRAND, bookingRows, button, emailShell } from "./email-layout";
import { manageUrl } from "@/lib/booking/reference";

export function BookingConfirmationEmail(b: Booking, siteUrl: string) {
  const base = manageUrl(siteUrl, b.manage_token); // /manage?token=...
  const body = `
    <p style="margin:0 0 18px;color:${BRAND.text};font-size:15px;line-height:1.6;">
      Dear ${b.name}, your table is reserved. We can't wait to welcome you for an
      authentic taste of Gujarat.
    </p>
    <div style="display:inline-block;padding:8px 16px;border-radius:10px;background:rgba(244,208,111,.25);color:${BRAND.indigo};font-weight:700;letter-spacing:.08em;margin-bottom:18px;">
      Reference: ${b.booking_reference}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 22px;">
      ${bookingRows(b)}
    </table>
    <div style="text-align:center;margin-top:8px;">
      ${button(base, "Manage Booking", "solid")}
      ${button(`${base}&action=reschedule`, "Reschedule", "ghost")}
      ${button(`${base}&action=cancel`, "Cancel", "ghost")}
    </div>`;

  return {
    subject: "Your Reservation at Gujju Food Hub",
    html: emailShell({
      preheader: `Reserved for ${b.name} · ${b.booking_date} ${b.booking_time}`,
      eyebrow: "Reservation Confirmed",
      heading: "Your table is reserved",
      body,
    }),
  };
}
