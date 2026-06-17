# booking-backend (staged)

Server-only code for the Table Booking System. It is **excluded from the build**
(`tsconfig.json` → `exclude`) so the current static site keeps working.

This folder mirrors the final `src/` layout. To activate (on Vercel):

1. `npm install @supabase/supabase-js resend`
2. Copy `booking-backend/src/*` into `src/` and `vercel.json` to the project root.
3. Remove `output: "export"` from `next.config.ts`.
4. Run `supabase/schema.sql` in Supabase.
5. Set env vars (`.env.example`) locally and in Vercel.
6. Deploy.

Full details: see **../BOOKING_ARCHITECTURE.md**.
