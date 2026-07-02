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
  // Defaults to the reservations tab in this project's sheet. Override with the
  // GOOGLE_SHEET_TAB env var if your tab is named differently.
  const sheetTab = (process.env.GOOGLE_SHEET_TAB || "Upcoming Reservations").trim();
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

// Extract the useful bits of a Google API error (never swallow it).
function describeGoogleError(e: unknown): string {
  const err = e as {
    message?: string;
    code?: number | string;
    response?: { data?: unknown };
    errors?: unknown;
  };
  const parts: string[] = [];
  if (err?.code !== undefined) parts.push(`code=${err.code}`);
  if (err?.message) parts.push(`message=${err.message}`);
  if (err?.response?.data) parts.push(`response=${JSON.stringify(err.response.data)}`);
  else if (err?.errors) parts.push(`errors=${JSON.stringify(err.errors)}`);
  return parts.join(" | ") || String(e);
}

/**
 * Appends one booking to the Google Sheet. Throws on failure so the caller can
 * log it — but the caller MUST NOT let that failure fail the booking.
 */
export async function appendBookingToSheet(booking: SheetBookingRow): Promise<void> {
  if (!isGoogleSheetsConfigured()) {
    console.warn("[Google Sheets] Not configured — skipping append.");
    return;
  }

  const { clientEmail, privateKey, spreadsheetId, sheetTab } = getConfig();
  console.log("[Google Sheets] Google env loaded", {
    clientEmail,
    spreadsheetId,
    tab: sheetTab,
    keyLines: privateKey.split("\n").length,
  });

  try {
    console.log("[Google Sheets] Authentication started");
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    await auth.authorize(); // fail fast + clear log if creds are bad
    console.log("[Google Sheets] Authentication successful");

    const sheets = google.sheets({ version: "v4", auth });

    // Open the spreadsheet + confirm the target worksheet exists.
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "properties.title,sheets.properties.title",
    });
    const tabs = (meta.data.sheets || []).map((s) => s.properties?.title).filter(Boolean) as string[];
    console.log("[Google Sheets] Spreadsheet opened:", meta.data.properties?.title, "| tabs:", tabs);

    if (!tabs.includes(sheetTab)) {
      throw new Error(
        `Worksheet "${sheetTab}" not found. Existing tabs: ${JSON.stringify(tabs)}. ` +
          `Set GOOGLE_SHEET_TAB to one of them.`
      );
    }
    console.log("[Google Sheets] Worksheet found:", sheetTab);

    console.log("[Google Sheets] Append started:", booking.booking_reference);
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTab}!A1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [toRow(booking)] },
    });
    console.log(
      "[Google Sheets] Append successful:",
      res.data.updates?.updatedRange,
      `(${res.data.updates?.updatedRows} row)`
    );
  } catch (e) {
    // Do NOT swallow — log the complete Google API error, then rethrow so the
    // route logs it too. The route keeps the booking (already in Supabase).
    console.error("[Google Sheets] Google API error:", describeGoogleError(e));
    throw e;
  }
}
