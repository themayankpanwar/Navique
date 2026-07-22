/*
# Create trips table (single-tenant, no auth)

## Summary
Adds the `trips` table that stores AI-generated travel itineraries for the
AI Travel Planner app. The app has no sign-in screen, so this is single-tenant:
the anon-key frontend can read, create, update and delete its own trips.

## New Tables
- `trips`
  - `id` (uuid, primary key, auto-generated)
  - `destination` (text, not null) — the place the user is traveling to
  - `starting_location` (text) — where the trip begins
  - `days` (integer) — number of days for the trip
  - `budget` (text) — Budget / Standard / Luxury
  - `travel_type` (text) — Solo / Couple / Family / Friends
  - `transportation` (text) — Flight / Train / Car
  - `accommodation` (text) — Hotel / Hostel / Resort / Airbnb
  - `interests` (text) — comma-separated interest tags
  - `special_requests` (text) — free-text extra requests
  - `itinerary` (text, not null) — the full AI-generated markdown itinerary
  - `created_at` (timestamptz, defaults to now())

## Security
- Row Level Security ENABLED on `trips`.
- Four policies (select/insert/update/delete) scoped to `anon, authenticated`
  because the data is intentionally shared/public in this no-auth single-tenant
  app. `USING (true)` is acceptable here per the documented single-tenant rule.

## Notes
1. No `user_id` column — there is no sign-in screen.
2. Policies are dropped before recreate to keep the migration idempotent.
*/

CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination text NOT NULL,
  starting_location text,
  days integer,
  budget text,
  travel_type text,
  transportation text,
  accommodation text,
  interests text,
  special_requests text,
  itinerary text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_trips" ON trips;
CREATE POLICY "anon_select_trips"
ON trips FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_trips" ON trips;
CREATE POLICY "anon_insert_trips"
ON trips FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_trips" ON trips;
CREATE POLICY "anon_update_trips"
ON trips FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_trips" ON trips;
CREATE POLICY "anon_delete_trips"
ON trips FOR DELETE
TO anon, authenticated USING (true);
