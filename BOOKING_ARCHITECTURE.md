# Gujju Food Hub — Table Booking System

A self-contained, portable reservation system. The **UI is live now** (mounted
after the showcase for review). The **backend is written and staged** in
`booking-backend/`, ready to activate once you connect Supabase, Resend, and
Turnstile and deploy to Vercel — no rewrites required.

---

## 1. What is live right now (no keys needed)

- `src/components/Booking/` — the whole UI + email templates + admin table.
- `src/lib/booking/` — types, validation, reference/token generation, and the
  single client integration point (`client.ts → submitBooking()`).
- The section is mounted in `src/app/page.tsx` as `<BookingSection />`.

Until the backend is connected, the form runs in **preview mode**: it validates
and shows the full “Table Reserved” success experience locally (nothing is saved,
no emails sent). Flip `NEXT_PUBLIC_BOOKING_DEMO=false` to disable preview once
the API is live.

**Portability:** every style is namespaced under `.gfh-booking` and all logic is
isolated in `Booking/` + `lib/booking/`. Move `<BookingSection />` anywhere in the
page — no refactor.

---

## 2. Why the backend is staged (and the GitHub Pages note)

The marketing site currently builds with `output: "export"` (static → GitHub
Pages). A booking backend (API routes, Supabase, Resend, Turnstile, cron) needs a
**server runtime** and cannot run on a static host. Your spec already targets
**Vercel** for exactly this reason.

To avoid breaking the current static build, all server-only code lives in
`booking-backend/` (excluded from the build via `tsconfig.json`). It mirrors the
final `src/` layout, so activation is a copy.

---

## 3. Activation (≈10 minutes, do this on Vercel)

```bash
# 1. Install backend dependencies
npm install @supabase/supabase-js resend

# 2. Move the staged server code into place (mirrors src/)
#    Windows PowerShell:
Copy-Item booking-backend/src/* src/ -Recurse -Force
Copy-Item booking-backend/vercel.json vercel.json

# 3. Disable static export so API routes work (Vercel serves static + dynamic)
#    In next.config.ts, remove `output: "export"` (or gate it behind an env).

# 4. Create the database: run supabase/schema.sql in Supabase → SQL Editor

# 5. Set env vars (see .env.example) locally (.env.local) AND in Vercel

# 6. Deploy to Vercel. Cron (vercel.json) runs the reminder every 15 min.
```

After this, set `NEXT_PUBLIC_BOOKING_DEMO=false`.

> Keeping GitHub Pages too? You can: serve the static marketing build there and
> point the booking form/admin at your Vercel domain. Simplest is to host the
> whole site on Vercel.

---

## 4. Environment variables

See `.env.example`. Summary:

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | public | builds manage-booking links in emails |
| `NEXT_PUBLIC_BOOKING_DEMO` | public | `true` = preview mode; `false` = live only |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **server** | DB writes (bypasses RLS) — never expose |
| `RESEND_API_KEY` | server | sending email |
| `BOOKING_FROM_EMAIL` | server | verified Resend sender |
| `BOOKING_OWNER_EMAIL` | server | owner notification recipient |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | public | renders the Turnstile widget |
| `TURNSTILE_SECRET_KEY` | server | verifies the Turnstile token |
| `ADMIN_ACCESS_TOKEN` | server | gate for `/admin/bookings` |
| `CRON_SECRET` | server | authorizes the reminder cron |
| `BOOKING_UTC_OFFSET_MIN` | server | venue offset for reminder timing (Hobart 600/660) |

---

## 5. Database (`supabase/schema.sql`)

- `bookings` — the reservation (all spec fields + `manage_token`, `reminder_sent_at`).
- `past_customers` — populated when a booking is marked **completed**
  (`record_past_customer` upserts by phone, increments `visit_count`).
- **RLS enabled with no public policies** → the tables are only reachable through
  the server routes (which use the service-role key). The anon key can do nothing.

Status enum: `pending → confirmed → arrived → completed`, plus `cancelled`.

---

## 6. API (in `booking-backend/src/app/api/`)

| Route | Method | Purpose |
|---|---|---|
| `/api/bookings` | POST | create: Turnstile → validate → insert → emails |
| `/api/bookings/manage?token=` | GET | fetch a booking (manage page) |
| `/api/bookings/manage?token=` | PATCH | change date / time / guests |
| `/api/bookings/manage?token=` | POST | cancel (`{action:"cancel"}`) |
| `/api/admin/bookings` | GET | list all (header `x-admin-token`) |
| `/api/admin/bookings` | PATCH | set status; `completed` → past_customers |
| `/api/cron/reminders` | GET | 2-hour reminder sweep (Bearer `CRON_SECRET`) |

The UI only ever calls `submitBooking()` (`src/lib/booking/client.ts`). When the
backend is live it hits `/api/bookings` for real; nothing else in the UI changes.

---

## 7. Emails (Resend) — `src/components/Booking/`

Branded, inline-styled HTML (no extra deps):

- `BookingConfirmationEmail.tsx` — customer: details, reference, Manage/Reschedule/Cancel.
- `BookingOwnerEmail.tsx` — owner: full details + contact + status.
- `BookingReminder.tsx` — 2-hours-before reminder with Manage/Cancel.

Sent from `booking-backend/src/lib/booking/server/email.ts`.

---

## 8. Reminder system

Vercel Cron (`vercel.json`) calls `/api/cron/reminders` every 15 minutes. It
finds bookings starting within the next 2 hours that haven't been reminded
(`reminder_sent_at IS NULL`), sends the reminder, and stamps the row — idempotent,
so no duplicates. Timezone handled via `BOOKING_UTC_OFFSET_MIN`.

---

## 9. Admin panel `/admin/bookings`

Intentionally minimal (owner-friendly in <2 min): four counters (Today, Upcoming,
Past Customers, Total) + one table (Date, Time, Customer, Phone, Guests, Meal,
Occasion, Status, Actions). Actions: Confirm → Mark Arrived → Mark Completed, and
Cancel. Gated by `ADMIN_ACCESS_TOKEN` (entered once, stored locally).

---

## 10. Security

- **Turnstile** verified server-side on every create.
- **Validation** runs again on the server (never trusts the client).
- **Rate limiting** on create (per-IP; swap to Vercel KV/Upstash for multi-instance).
- **Supabase RLS** on, no public policies — DB only reachable via server routes.
- **Admin** behind a shared token; **manage** links use a 64-char unguessable token.
- **Cron** authorized by `CRON_SECRET`.

---

## 11. File map

```
src/
  components/Booking/
    BookingSection.tsx          # split-screen wrapper (live)
    BookingForm.tsx             # the form (live)
    BookingSuccess.tsx          # success experience (live)
    Turnstile.tsx               # widget / placeholder (live)
    BookingAdminTable.tsx       # admin table UI
    BookingConfirmationEmail.tsx / BookingOwnerEmail.tsx / BookingReminder.tsx
    email-layout.ts             # shared email shell
    booking.css                 # namespaced styles (.gfh-booking, .bk-*)
  lib/booking/
    types.ts validation.ts reference.ts client.ts

booking-backend/                # STAGED (excluded from build) → copy into src/ on Vercel
  src/lib/booking/server/       # supabase.ts resend(email).ts turnstile.ts
  src/app/api/bookings/route.ts
  src/app/api/bookings/manage/route.ts
  src/app/api/admin/bookings/route.ts
  src/app/api/cron/reminders/route.ts
  src/app/admin/bookings/page.tsx
  src/app/manage/page.tsx
  vercel.json

supabase/schema.sql
.env.example
```
