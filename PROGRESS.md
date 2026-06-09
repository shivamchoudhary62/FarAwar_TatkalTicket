# PROGRESS.md — Context Tracker
# Member 2 — Tatkal Verified Booking Ecosystem
# Update this file after every completed slice.
# If you switch Antigravity sessions, paste this file's content at the start.

---

## Module Summary
I am building the Tatkal module of RailSaathi. This includes:
- Backend: Express routes in services/api/src/routes/tatkal.js
- Scheduled job: services/api/src/jobs/tatkalFireJob.js
- Mobile screens: apps/mobile/src/screens/tatkal/
- DB migration: supabase/migrations/002_tatkal.sql

## Stack
- Backend: Node.js + Express (Member 1's server, I add one route file)
- Database: Supabase (Member 1's project, I add 002_tatkal.sql migration)
- Mobile: React Native (Expo) — I add screens inside the tatkal/ folder

## Dependencies on Member 1
- verifyToken middleware (at services/api/src/middleware/auth.js)
- supabaseClient (at services/api/src/db/supabaseClient.js)
- apiClient (at apps/mobile/src/services/apiClient.js)
- RailSaathiContext — exposes currentUser.name, currentUser.preferred_class

## Completed Slices
- [x] 2.1 — Environment setup
- [x] 2.2 — DB migration (002_tatkal.sql)
- [x] 2.3 — POST /api/tatkal/prefill
- [x] 2.4 — Read endpoints (my-requests, :id, cancel)
- [x] 2.5 — POST /api/tatkal/fire/:id (demo)
- [x] 2.6 — tatkalFireJob.js (scheduled job)
- [x] 2.7 — Surrender endpoints
- [x] 2.8 — tatkalService.js (mobile)
- [x] 2.9 — TatkalHomeScreen
- [x] 2.10 — PreFillFormScreen
- [x] 2.11 — CountdownScreen
- [x] 2.12 — ConfirmationScreen
- [x] 2.13 — SurrenderMarketScreen
- [x] 2.14 — Seed data
- [x] 2.15 — Integration handoff
- [x] 2.17 — Manual test verification scripts & integration guide (test-tatkal.sh, TESTING.md, INTEGRATION_HANDOFF.md)
- [x] 2.18 — Database extension for journey overlap locking (0022_overlap_lock.sql)
- [x] 2.19 — Pure function refactor: checkJourneyOverlap, formatLockWindow, buildJourneyLockRows, istToUtc in tatkal-service.js
- [x] 2.20 — Wired overlap lock into prefill (departure_datetime & arrival_datetime now required). Overlap check runs every request, returns 409 JOURNEY_OVERLAP_LOCK on conflict
- [x] 2.21 — Fire job creates journey locks for account holder + co-passengers after CONFIRMED status
- [x] 2.22 — Split tatkal.js: moved my-requests, cancel, get-by-id to tatkal-requests.js sub-router (300-line compliance)
- [x] 2.23 — PreFillFormScreen: dedicated overlap error card (orange, 🔒 icon, PNR + window details, "Got it" button returns to Step 1)
- [x] 2.24 — TatkalHomeScreen: collapsible "Active Journey Locks" section with route, window, PNR badge per lock
- [x] 2.25 — Backend GET /api/tatkal/my-locks endpoint (joins locks with requests for route info)
- [x] 2.26 — tatkalService.js: added getMyLocks() export
- [x] 2.27 — Biometric verification formally deferred — see docs/BIOMETRIC_HOLD.md. Stub added to tatkal-service.js, hold note added to AGENTS.md
- [x] 2.28 — INTEGRATION_HANDOFF.md updated with clear role assignment (Member 2's pre-handoff responsibilities vs Member 1's integration tasks)
- [x] 2.29 — Fixed validation flaw: departure_datetime & arrival_datetime made optional on API level, with automatic UTC derivation using istToUtc when omitted.
- [x] 2.30 — Created docs/WORKFLOW.md containing detailed User (Passenger) and System (Admin/Job) workflows with Mermaid flow diagrams.
- [x] 2.31 — Aligned anti-hoarding rules with official IRCTC guidelines: unique index `idx_tatkal_one_per_day` and API checking updated to check `(user_id, booking_date, train_number)`. Allows booking different trains on the same booking date.
- [x] 2.32 — Enforced NOT NULL constraints on train_number and class in tatkal_surrenders table definition and validated them on the API post handler.
- [x] 2.33 — Enforced Tatkal booking rules: capped passengers to 4 per PNR, excluded First AC (1A) and mapped classes to appropriate opening times (10 AM for AC: 2A/3A/CC/EC/3E; 11 AM for Non-AC: SL/FC/2S) on backend and frontend.
- [x] 2.34 — Implemented Terms & Conditions checkbox and a beautiful detailed rules modal inside UrgencyDetailsForm.js with charges table and cancellation/refund rules.
- [x] 2.35 — Added official IRCTC sign-up and registration linking columns to users table and tatkal database schema in 002_tatkal.sql.
- [x] 2.36 — Created tatkal-profiles.js sub-router with link-irctc profile verification and passenger-by-irctc lookup endpoints.
- [x] 2.37 — Enforced strict backend profile integrity checks on PREFILL bookings (assert passenger name/age/gender match registered details).
- [x] 2.38 — Implemented IrctcSignupModal.js with credentials, personal details, contact details, address, and simulated OTP verification.
- [x] 2.39 — Integrated TatkalHomeScreen.js profile checking banner and PassengerCard.js verified auto-fetch display panels.





## Key Decisions Made
- Excluded node_modules and .git files during reference syncs to keep TatkalTicket workspace clean.
- Modularized PassengerListEditor to fit under strict component line limits.
- Overlap logic uses pure functions (no DB calls) for testability; DB fetches happen in route/job layer.
- departure_datetime and arrival_datetime are optional in the prefill API (derived if omitted) to prevent validation failures with clients that only supply travel_date.

- Routes split into 3 sub-router files: tatkal.js (prefill, fire), tatkal-requests.js (my-requests, cancel, get-by-id), tatkal-surrenders.js (surrender market).

## What Member 1 Needs From Me (Integration Checklist)
- Line to add in index.js: app.use('/api/tatkal', require('./routes/tatkal'))
- Line to start job: require('./jobs/tatkalFireJob').start()
- Confirm 002_tatkal.sql is applied in Supabase
- Confirm all screens use useRailSaathi() not mock data

## Blockers / Questions
(Fill in if waiting on anything from Member 1 or team)
