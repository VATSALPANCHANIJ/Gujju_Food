// Google Sheets sync — SERVER ONLY. Appends each booking as a row using a
<<<<<<< HEAD
// Google Service Account authenticated from ENV VARS (no JSON key file).
// Supabase stays the primary database; the sheet is a synchronized copy.
=======
// Google Service Account. Supabase stays the primary DB; the sheet is a mirror.
// A failure here MUST NEVER fail the booking (caller catches/logs).
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2

import { google } from "googleapis";

// Hard guard: service-account credentials must never reach the browser bundle.
if (typeof window !== "undefined") {
  throw new Error("google-sheet must never be imported on the client.");
}

<<<<<<< HEAD
const WORKSHEET = "Upcoming Reservations";

// The booking object route.ts passes in.
export interface SheetBookingRow {
  booking_reference: string;
  name: string; // Customer Name
  phone: string;
  email: string;
  created_at?: string | null; // Booked On
  booking_date: string; // Reservation Date
  booking_time: string; // Reservation Time
  guests: number | string;
=======
// The row appended to the sheet, in column order A..L.
export interface SheetBookingRow {
  booking_reference: string;
  name: string;
  email: string;
  phone: string;
  guests: number | string;
  booking_date: string; // Reservation Date
  booking_time: string; // Reservation Time
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
  meal_type: string;
  occasion?: string | null;
  special_request?: string | null;
  status: string;
<<<<<<< HEAD
}

function getConfig() {
  const projectId = (process.env.GOOGLE_PROJECT_ID || "").trim();
  const clientEmail = (process.env.GOOGLE_CLIENT_EMAIL || "").trim();
  // Env vars store the PEM with escaped "\n" (Vercel sometimes wraps in quotes).
  // Convert "\n" back into real newlines before authentication.
=======
  created_at?: string | null;
}

function getConfig() {
  const clientEmail = (process.env.GOOGLE_CLIENT_EMAIL || "").trim();
  // Private keys are multi-line PEM. Env vars store them with escaped "\n"
  // (and Vercel sometimes wraps in quotes) — normalise both.
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "")
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .trim();
  const spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || "").trim();
<<<<<<< HEAD
  return { projectId, clientEmail, privateKey, spreadsheetId };
}

// Column order MUST match the header row in the sheet (A..L):
// Reference · Name · Phone · Email · Booked On · Date · Time · Guests · Meal ·
// Occasion · Special Request · Status
=======
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
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
function toRow(b: SheetBookingRow): (string | number)[] {
  return [
    b.booking_reference,
    b.name,
<<<<<<< HEAD
    b.phone,
    b.email,
    b.created_at ?? new Date().toISOString(),
    b.booking_date,
    b.booking_time,
    String(b.guests),
=======
    b.email,
    b.phone,
    String(b.guests),
    b.booking_date,
    b.booking_time,
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
    b.meal_type,
    b.occasion ?? "",
    b.special_request ?? "",
    b.status,
<<<<<<< HEAD
  ];
}

function describeGoogleError(e: unknown): string {
  const err = e as { message?: string; code?: number | string; response?: { data?: unknown }; errors?: unknown };
=======
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
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
  const parts: string[] = [];
  if (err?.code !== undefined) parts.push(`code=${err.code}`);
  if (err?.message) parts.push(`message=${err.message}`);
  if (err?.response?.data) parts.push(`response=${JSON.stringify(err.response.data)}`);
  else if (err?.errors) parts.push(`errors=${JSON.stringify(err.errors)}`);
  return parts.join(" | ") || String(e);
}

/**
<<<<<<< HEAD
 * Appends one booking to the "Upcoming Reservations" worksheet.
 * Throws (with the full Google API error) if anything fails — the caller decides
 * how to respond. Requires GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY,
 * GOOGLE_SPREADSHEET_ID (GOOGLE_PROJECT_ID is read for completeness).
 */
export async function appendBookingToSheet(booking: SheetBookingRow): Promise<void> {
  const { projectId, clientEmail, privateKey, spreadsheetId } = getConfig();

  console.log("[Google Sheets] Initializing", {
    projectId: projectId || "(unset)",
    clientEmail,
    spreadsheetId,
    keyLines: privateKey.split("\n").length,
  });

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error(
      "Google Sheets not configured: GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY / GOOGLE_SPREADSHEET_ID are required."
    );
  }

  try {
=======
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
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
<<<<<<< HEAD
    await auth.authorize();
=======
    await auth.authorize(); // fail fast + clear log if creds are bad
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
    console.log("[Google Sheets] Authentication successful");

    const sheets = google.sheets({ version: "v4", auth });

<<<<<<< HEAD
    console.log("[Google Sheets] Opening spreadsheet");
=======
    // Open the spreadsheet + confirm the target worksheet exists.
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "properties.title,sheets.properties.title",
    });
<<<<<<< HEAD
    const tabs = (meta.data.sheets || [])
      .map((s) => s.properties?.title)
      .filter((t): t is string => Boolean(t));

    if (!tabs.includes(WORKSHEET)) {
      throw new Error(
        `Worksheet "${WORKSHEET}" does not exist in "${meta.data.properties?.title}". ` +
          `Existing tabs: ${JSON.stringify(tabs)}.`
      );
    }

    console.log("[Google Sheets] Appending row", booking.booking_reference);
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${WORKSHEET}!A1`,
=======
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
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [toRow(booking)] },
    });
    console.log(
<<<<<<< HEAD
      "[Google Sheets] Row appended successfully",
=======
      "[Google Sheets] Append successful:",
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
      res.data.updates?.updatedRange,
      `(${res.data.updates?.updatedRows} row)`
    );
  } catch (e) {
<<<<<<< HEAD
    // Do NOT swallow — log the complete Google API error and rethrow.
    console.error("[Google Sheets] ERROR:", describeGoogleError(e));
=======
    // Do NOT swallow — log the complete Google API error, then rethrow so the
    // route logs it too. The route keeps the booking (already in Supabase).
    console.error("[Google Sheets] Google API error:", describeGoogleError(e));
>>>>>>> 2eddf3938e2e531da4e9edc684aaf1327d70cdb2
    throw e;
  }
}
