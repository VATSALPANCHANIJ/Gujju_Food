// Google Sheets sync — SERVER ONLY. Appends each booking as a row using a
// Google Service Account. Supabase stays the primary DB; the sheet is a mirror.
// A failure here MUST NEVER fail the booking (caller catches/logs).

import { google } from "googleapis";

// Hard guard: service-account credentials must never reach the browser bundle.
if (typeof window !== "undefined") {
  throw new Error("google-sheet must never be imported on the client.");
}

// The row appended to the sheet, in column order A..L.
export interface SheetBookingRow {
  booking_reference: string;
  name: string;
  email: string;
  phone: string;
  guests: number | string;
  booking_date: string; // Reservation Date
  booking_time: string; // Reservation Time
  meal_type: string;
  occasion?: string | null;
  special_request?: string | null;
  status: string;
  created_at?: string | null;
}

function getConfig() {
  const clientEmail = (process.env.GOOGLE_CLIENT_EMAIL || "").trim();
  // Private keys are multi-line PEM. Env vars store them with escaped "\n"
  // (and Vercel sometimes wraps in quotes) — normalise both.
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "")
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .trim();
  const spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || "").trim();
  const sheetTab = (process.env.GOOGLE_SHEET_TAB || "Bookings").trim();
  return { clientEmail, privateKey, spreadsheetId, sheetTab };
}

export function isGoogleSheetsConfigured(): boolean {
  const { clientEmail, privateKey, spreadsheetId } = getConfig();
  // A real service-account key is a PEM block; reject obviously-wrong values.
  return Boolean(
    clientEmail &&
      spreadsheetId &&
      privateKey.includes("BEGIN") &&
      privateKey.includes("PRIVATE KEY")
  );
}

// Column order MUST match the header row you set in the sheet (A..L).
function toRow(b: SheetBookingRow): (string | number)[] {
  return [
    b.booking_reference,
    b.name,
    b.email,
    b.phone,
    String(b.guests),
    b.booking_date,
    b.booking_time,
    b.meal_type,
    b.occasion ?? "",
    b.special_request ?? "",
    b.status,
    b.created_at ?? new Date().toISOString(),
  ];
}

/**
 * Appends one booking to the Google Sheet. Throws on failure so the caller can
 * log it — but the caller must NOT let that failure fail the booking.
 */
export async function appendBookingToSheet(booking: SheetBookingRow): Promise<void> {
  if (!isGoogleSheetsConfigured()) {
    console.warn("[Google Sheets] Not configured — skipping append.");
    return;
  }

  const { clientEmail, privateKey, spreadsheetId, sheetTab } = getConfig();

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  console.log("[Google Sheets] Connected");

  console.log("[Google Sheets] Appending booking...", booking.booking_reference);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetTab}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [toRow(booking)] },
  });
  console.log("[Google Sheets] Booking appended successfully");
}
