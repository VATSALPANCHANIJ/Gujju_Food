// Google Sheets sync — SERVER ONLY. Appends each booking as a row using a
// Google Service Account authenticated from ENV VARS (no JSON key file).
// Supabase stays the primary database; the sheet is a synchronized copy.

import { google } from "googleapis";

// Hard guard: service-account credentials must never reach the browser bundle.
if (typeof window !== "undefined") {
  throw new Error("google-sheet must never be imported on the client.");
}

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
  meal_type: string;
  occasion?: string | null;
  special_request?: string | null;
  status: string;
}

function getConfig() {
  const projectId = (process.env.GOOGLE_PROJECT_ID || "").trim();
  const clientEmail = (process.env.GOOGLE_CLIENT_EMAIL || "").trim();
  // Env vars store the PEM with escaped "\n" (Vercel sometimes wraps in quotes).
  // Convert "\n" back into real newlines before authentication.
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "")
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .trim();
  const spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || "").trim();
  return { projectId, clientEmail, privateKey, spreadsheetId };
}

// Column order MUST match the header row in the sheet (A..L):
// Reference · Name · Phone · Email · Booked On · Date · Time · Guests · Meal ·
// Occasion · Special Request · Status
function toRow(b: SheetBookingRow): (string | number)[] {
  return [
    b.booking_reference,
    b.name,
    b.phone,
    b.email,
    b.created_at ?? new Date().toISOString(),
    b.booking_date,
    b.booking_time,
    String(b.guests),
    b.meal_type,
    b.occasion ?? "",
    b.special_request ?? "",
    b.status,
  ];
}

function describeGoogleError(e: unknown): string {
  const err = e as { message?: string; code?: number | string; response?: { data?: unknown }; errors?: unknown };
  const parts: string[] = [];
  if (err?.code !== undefined) parts.push(`code=${err.code}`);
  if (err?.message) parts.push(`message=${err.message}`);
  if (err?.response?.data) parts.push(`response=${JSON.stringify(err.response.data)}`);
  else if (err?.errors) parts.push(`errors=${JSON.stringify(err.errors)}`);
  return parts.join(" | ") || String(e);
}

/**
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
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    await auth.authorize();
    console.log("[Google Sheets] Authentication successful");

    const sheets = google.sheets({ version: "v4", auth });

    console.log("[Google Sheets] Opening spreadsheet");
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "properties.title,sheets.properties.title",
    });
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
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [toRow(booking)] },
    });
    console.log(
      "[Google Sheets] Row appended successfully",
      res.data.updates?.updatedRange,
      `(${res.data.updates?.updatedRows} row)`
    );
  } catch (e) {
    // Do NOT swallow — log the complete Google API error and rethrow.
    console.error("[Google Sheets] ERROR:", describeGoogleError(e));
    throw e;
  }
}
