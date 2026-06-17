// Reminder email — sent ~2 hours before the reservation.

import type { Booking } from "@/lib/booking/types";
import { BRAND, bookingRows, button, emailShell } from "./email-layout";
import { manageUrl } from "@/lib/booking/reference";

export function BookingReminder(b: Booking, siteUrl: string) {
  const base = manageUrl(siteUrl, b.manage_token);
  const body = `
    <p style="margin:0 0 18px;color:${BRAND.text};font-size:15px;line-height:1.6;">
      Hi ${b.name}, this is a friendly reminder that your table at Gujju Food Hub
      is coming up soon. We look forward to seeing you!
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 22px;">
      ${bookingRows(b)}
    </table>
    <div style="text-align:center;">
      ${button(base, "Manage Booking", "solid")}
      ${button(`${base}&action=cancel`, "Cancel Booking", "ghost")}
    </div>`;

  return {
    subject: "Reminder: your table at Gujju Food Hub is soon",
    html: emailShell({
      preheader: `See you at ${b.booking_time} today`,
      eyebrow: "See You Soon",
      heading: "Your reservation is coming up",
      body,
    }),
  };
}
