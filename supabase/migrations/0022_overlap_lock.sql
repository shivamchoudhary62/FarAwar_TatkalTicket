-- 0022_overlap_lock.sql
-- Run AFTER 002_tatkal.sql has been applied
-- Extends tatkal_requests table and adds tatkal_journey_locks table to prevent travel overlaps

-- 1. Add departure and arrival datetime columns to tatkal_requests
ALTER TABLE tatkal_requests
  ADD COLUMN departure_datetime TIMESTAMPTZ,
  ADD COLUMN arrival_datetime   TIMESTAMPTZ;

-- departure_datetime: the scheduled departure of the booked train
-- arrival_datetime:   the scheduled arrival of the booked train
-- Both are optional at prefill time (user may not know exact times yet)
-- Both are required before the fire job confirms a booking

-- 2. Create the tatkal_journey_locks table
-- This table tracks which users are locked for which time windows.
-- One row per (user_id, confirmed request).
CREATE TABLE tatkal_journey_locks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locked_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_request_id UUID NOT NULL REFERENCES tatkal_requests(id) ON DELETE CASCADE,
  departure_datetime TIMESTAMPTZ NOT NULL,
  arrival_datetime   TIMESTAMPTZ NOT NULL,
  pnr                VARCHAR(10),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(locked_user_id, source_request_id)
);

-- Indexing for fast query lookups on overlapping windows
CREATE INDEX idx_locks_user_id  ON tatkal_journey_locks(locked_user_id);
CREATE INDEX idx_locks_window   ON tatkal_journey_locks(departure_datetime, arrival_datetime);

-- 3. Row-Level Security (RLS) Configuration
-- Only the backend service key reads/writes this table.
-- Users never read it directly. No SELECT policy is needed for app clients.
-- Bypassed exclusively via Supabase service_role keys.
ALTER TABLE tatkal_journey_locks ENABLE ROW LEVEL SECURITY;
