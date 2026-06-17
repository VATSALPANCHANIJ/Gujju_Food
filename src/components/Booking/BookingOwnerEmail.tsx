// Owner notification email — "New Table Reservation".

import type { Booking } from "@/lib/booking/types";
import { BRAND, bookingRows, detailRow, emailShell } from "./email-layout";

export function BookingOwnerEmail(b: Booking) {
  const body = `
    <p style="margin:0 0 18px;color:${BRAND.text};font-size:15px;line-height:1.6;">
      A new reservation has come in. Details below.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 8px;">
      ${detailRow("Customer", b.name)}
      ${detailRow("Phone", b.phone)}
      ${detailRow("Email", b.email)}
      ${bookingRows(b)}
      ${detailRow("Status", b.status.toUpperCase())}
      ${detailRow("Reference", b.booking_reference)}
    </table>
    <p style="margin:16px 0 0;color:${BRAND.muted};font-size:13px;">
      Manage all reservations in the admin panel.
    </p>`;

  return {
    subject: `New Table Reservation · ${b.name} · ${b.booking_date}`,
    html: emailShell({
      preheader: `${b.name} · ${b.guests} · ${b.booking_date} ${b.booking_time}`,
      eyebrow: "New Reservation",
      heading: "New Table Reservation",
      body,
    }),
  };
}
