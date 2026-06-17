-- ============================================================================
-- GUJJU FOOD HUB — Table Booking schema (Supabase / Postgres)
-- Run in Supabase → SQL Editor. Safe to re-run (idempotent where practical).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type booking_status as enum
    ('pending', 'confirmed', 'arrived', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meal_type as enum ('breakfast', 'lunch', 'dinner');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- bookings
-- ----------------------------------------------------------------------------
create table if not exists public.bookings (
  id                uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  name              text not null,
  email             text not null,
  phone             text not null,
  guests            text not null,                 -- "1-2" | "3-4" | "5-6" | "7+"
  booking_date      date not null,
  booking_time      text not null,                 -- "HH:mm" (24h)
  meal_type         meal_type not null,
  occasion          text,                          -- nullable
  special_request   text,                          -- nullable
  status            booking_status not null default 'pending',
  manage_token      text not null unique,          -- no-login manage link secret
  reminder_sent_at  timestamptz,                   -- set when the 2h reminder goes out
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists bookings_date_time_idx on public.bookings (booking_date, booking_time);
create index if not exists bookings_status_idx     on public.bookings (status);
create index if not exists bookings_manage_idx     on public.bookings (manage_token);

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- past_customers — populated when a booking is marked "completed".
-- Used later for retention/marketing. Upsert by phone.
-- ----------------------------------------------------------------------------
create table if not exists public.past_customers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  phone        text not null unique,
  email        text,
  visit_count  integer not null default 1,
  last_visit   date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists past_customers_touch on public.past_customers;
create trigger past_customers_touch before update on public.past_customers
  for each row execute function public.touch_updated_at();

-- Promote a completed booking into past_customers (call from the API on "completed").
create or replace function public.record_past_customer(
  p_name text, p_phone text, p_email text, p_visit date
) returns void as $$
begin
  insert into public.past_customers (name, phone, email, last_visit)
  values (p_name, p_phone, p_email, p_visit)
  on conflict (phone) do update
    set visit_count = public.past_customers.visit_count + 1,
        last_visit  = greatest(public.past_customers.last_visit, excluded.last_visit),
        name        = excluded.name,
        email       = coalesce(excluded.email, public.past_customers.email);
end; $$ language plpgsql;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- All writes/reads go through the API using the SERVICE ROLE key (bypasses RLS).
-- We enable RLS and add NO public policies, so the anon/public key can do
-- nothing directly — the table is only reachable via our server routes.
-- ----------------------------------------------------------------------------
alter table public.bookings        enable row level security;
alter table public.past_customers  enable row level security;

-- (Intentionally no policies for anon/authenticated. Service role bypasses RLS.)
