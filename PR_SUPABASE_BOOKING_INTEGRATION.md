# PR: Connect Table Booking System to Supabase (database integration)

## Summary
Wires the existing (UI-complete) Table Booking form to **Supabase** via a
server-side Next.js API route. Adds browser + admin Supabase clients, a
production-ready `POST /api/bookings/create` route (validation → reference +
manage token → insert), and points the form's submission logic at it.

**No UI, styling, animation, layout, component, Hero, Product Showcase, Booking,
or Admin changes.** Only the database integration + the form's submit call.

---

## What changed

### Added
| File | Purpose |
|---|---|
| `src/lib/supabase.ts` | Browser Supabase client (anon key, RLS-gated). Safe for client components. |
| `src/lib/supabase-admin.ts` | **Server-only** admin client (service role key). Throws if imported on the client; key never reaches the browser. |
| `src/app/api/bookings/create/route.ts` | `POST` endpoint: rate-limit → server validation → generate `GFH-YYYY-0001` reference + `crypto.randomUUID()` manage token → insert into `bookings` → structured JSON. |
| `PR_SUPABASE_BOOKING_INTEGRATION.md` | This document. |

### Modified
| File | Change |
|---|---|
| `src/lib/booking/client.ts` | `submitBooking()` now calls `/api/bookings/create` and maps the response to the success screen. (This is the single integration point — components untouched.) |
| `next.config.ts` | `output: "export"` and `trailingSlash` are now gated behind `STATIC_EXPORT=true`. **Default = server mode** so API routes run (Vercel / `next dev`). |
| `package.json` / lockfile | Added `@supabase/supabase-js`. |

### Untouched (verified)
Hero, Product Showcase, Booking UI/animations/2-step flow, Admin UI, email
templates, validation rules, DB schema, env values.

---

## Folder structure (relevant)
```
src/
  app/
    api/
      bookings/
        create/
          route.ts        ← NEW  (POST handler)
  lib/
    supabase.ts           ← NEW  (browser client)
    supabase-admin.ts     ← NEW  (server admin client)
    booking/
      client.ts           ← MODIFIED (calls /api/bookings/create)
      validation.ts        (reused, unchanged)
      types.ts             (reused, unchanged)
next.config.ts            ← MODIFIED (server mode by default)
```

---

## Installation / dependencies
```bash
npm install @supabase/supabase-js
```

## Environment variables (already in your `.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # SERVER ONLY — used only in API routes
```
Set the same three in **Vercel → Project → Settings → Environment Variables**.

---

## API contract — `POST /api/bookings/create`

**Request body** (JSON):
```json
{
  "name": "Aarav Patel",
  "email": "aarav@example.com",
  "phone": "+61412345678",
  "guests": "3-4",
  "booking_date": "2026-06-22",
  "booking_time": "19:00",
  "meal_type": "dinner",
  "occasion": "anniversary",
  "special_request": "Window seat please"
}
```

**Success — `201`:**
```json
{
  "success": true,
  "message": "Your table has been reserved.",
  "booking_id": "uuid",
  "booking_reference": "GFH-2026-0001",
  "manage_token": "uuid"
}
```

**Errors (structured JSON):**
| Status | When | Body |
|---|---|---|
| `400` | Malformed JSON | `{ success:false, message }` |
| `422` | Validation failed | `{ success:false, message, fieldErrors }` |
| `429` | Rate limited | `{ success:false, message }` |
| `503` | Supabase env not configured | `{ success:false, message }` |
| `500` | DB / server failure | `{ success:false, message }` |

### Field mapping → `bookings`
`name, email, phone, guests, booking_date, booking_time, meal_type, occasion,
special_request, booking_reference, manage_token, status` (set to `pending`).
`created_at` / `updated_at` are left to the table's column defaults.

### Booking reference
`GFH-<year>-NNNN` (e.g. `GFH-2026-0001`), sequential per year. Computed from the
latest existing reference for the year; on a unique-constraint race the insert
retries (up to 5×) with the next number.

### Manage token
`crypto.randomUUID()` — unguessable, used for the no-login manage link
(`/manage?token=...`). Returned to the client; the success screen builds the URL.

---

## Security
- **Service role key is server-only** — used solely inside the API route via
  `supabase-admin.ts`, which throws if imported in the browser. Never bundled to
  the client.
- **Authoritative server-side validation** (`validateBooking`) — the client is
  never trusted.
- **Rate-limit-ready**: in-memory per-IP limiter (6/min) with a clear seam to
  swap for Upstash/Vercel KV in multi-instance deploys.
- Browser client uses the anon key only (RLS-gated).

---

## Deployment note (important)
A server API route **cannot run on a static export** (GitHub Pages). So:
- **Default build = server mode** → deploy to **Vercel** (recommended). API works,
  served at domain root (no `basePath`).
- **Static export** is still available with `STATIC_EXPORT=true` (`next build`
  → `./out`, under `/Gujju_Food`) **but the booking API is excluded** in that mode.

---

## Testing performed
- `npm run build` ✓ — compiles in server mode; route shown as `ƒ /api/bookings/create` (dynamic). TypeScript clean.
- `POST /api/bookings/create` with invalid body → **422** with per-field `fieldErrors` ✓
- `POST /api/bookings/create` with valid body, no keys → **503** structured JSON ✓
- Form end-to-end (dev): submits to `/api/bookings/create` (verified via fetch interception); success screen renders "Table Reserved" with reference; loading/error states intact ✓
- No console errors ✓

> With real Supabase keys present, the valid path inserts into `bookings` and
> returns `201` with `GFH-2026-NNNN`. (Not exercised here — no keys in this env.)

---

## Rollback
Revert this PR: delete the three new files, restore `client.ts` to call the prior
endpoint, and restore `next.config.ts` (`output: "export"` + `trailingSlash: true`).
No database or schema changes were made, so there is nothing to roll back on Supabase.

## Out of scope (follow-ups)
- Resend confirmation/owner emails on insert.
- `/manage` + `/admin/bookings` API routes (staged in `booking-backend/`).
- Reminder cron. Turnstile server verification.
