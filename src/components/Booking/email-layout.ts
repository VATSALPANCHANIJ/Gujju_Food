// Shared, dependency-free email building blocks (inline styles for email clients).
// Returns HTML strings — usable directly by Resend. Portable: no React, no deps.

import {
  GUEST_LABELS,
  MEAL_LABELS,
  OCCASION_LABELS,
  type Booking,
} from "@/lib/booking/types";

export const BRAND = {
  bg: "#FFF8F0",
  card: "#FFFDFB",
  teal: "#2BA7A0",
  tealDark: "#1F857F",
  gold: "#F4D06F",
  indigo: "#392F5A",
  text: "#2D2D2D",
  muted: "#6F6A78",
  line: "#E9E1D5",
};

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(t: string): string {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.line};color:${BRAND.muted};font-size:13px;letter-spacing:.06em;text-transform:uppercase;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.line};color:${BRAND.indigo};font-size:15px;font-weight:600;text-align:right;">${value}</td>
    </tr>`;
}

export function button(href: string, label: string, variant: "solid" | "ghost" = "solid"): string {
  const solid = `background:${BRAND.teal};color:#ffffff;border:1px solid ${BRAND.teal};`;
  const ghost = `background:#ffffff;color:${BRAND.tealDark};border:1px solid ${BRAND.teal};`;
  return `<a href="${href}" style="display:inline-block;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;margin:4px;${variant === "solid" ? solid : ghost}">${label}</a>`;
}

export function bookingRows(b: Booking): string {
  let rows =
    detailRow("Date", formatDate(b.booking_date)) +
    detailRow("Time", formatTime(b.booking_time)) +
    detailRow("Guests", `${GUEST_LABELS[b.guests]} Guests`) +
    detailRow("Meal", MEAL_LABELS[b.meal_type]);
  if (b.occasion) rows += detailRow("Occasion", OCCASION_LABELS[b.occasion]);
  if (b.special_request) rows += detailRow("Special Request", b.special_request);
  return rows;
}

/** Wraps content in the branded shell (header + card + footer). */
export function emailShell(opts: {
  preheader?: string;
  eyebrow: string;
  heading: string;
  body: string;
}): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BRAND.bg};font-family:Helvetica,Arial,sans-serif;color:${BRAND.text};">
    ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.card};border:1px solid ${BRAND.line};border-radius:18px;overflow:hidden;">
          <tr>
            <td style="background:${BRAND.indigo};padding:26px 32px;text-align:center;">
              <div style="color:${BRAND.gold};font-size:12px;letter-spacing:.32em;text-transform:uppercase;">Gujju Food Hub</div>
              <div style="color:#ffffff;font-size:13px;margin-top:4px;letter-spacing:.04em;">Authentic Gujarati flavours · Hobart, Tasmania</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="color:${BRAND.teal};font-size:12px;letter-spacing:.26em;text-transform:uppercase;margin-bottom:8px;">${opts.eyebrow}</div>
              <h1 style="margin:0 0 16px;color:${BRAND.indigo};font-size:26px;line-height:1.2;">${opts.heading}</h1>
              ${opts.body}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid ${BRAND.line};color:${BRAND.muted};font-size:12px;text-align:center;">
              Gujju Food Hub · Moonah, Hobart TAS · This email was sent regarding your reservation.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
