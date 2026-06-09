# RailSaathi

RailSaathi is India's unified railway passenger platform, designed to provide passengers with a seamless, comprehensive travel experience. This repository contains the mobile application (React Native Expo), the government admin web dashboard (React + Vite), and the unified API backend (Node.js + Express).

## Deployment Links (Placeholders)
- **Production API (Render)**: [https://railsaathi-api.onrender.com](https://railsaathi-api.onrender.com)
- **Admin Dashboard (Vercel)**: [https://railsaathi-admin.vercel.app](https://railsaathi-admin.vercel.app)

## Repository Structure

The project is structured as a monorepo:
```text
railsaathi/
├── apps/
│   ├── mobile/              # React Native (Expo) - Mobile App
│   └── dashboard/           # React + Vite - Government Web Dashboard
├── services/
│   └── api/                 # Node.js + Express - Backend API Service
├── supabase/
│   └── migrations/          # Supabase SQL Migrations
├── scripts/                 # Utility and Seeding Scripts
└── docs/                    # Architecture and Design System documentation
```

## Getting Started

This section explains how to set up and run each part of the monorepo locally.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher recommended)

### Setup & Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/railsaathi.git
   cd RailSaathi
   ```

2. **Unified API Backend Setup:**
   ```bash
   cd services/api
   npm install
   cp .env.example .env
   # Update the values in .env (if connecting to real databases, or leave default for mock)
   npm run dev
   ```
   The backend API will run at `http://localhost:3000/api`. You can test it by requesting the health check:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Admin Dashboard Setup:**
   ```bash
   cd apps/dashboard
   npm install
   npm run dev
   ```
   The dashboard website will run locally at `http://localhost:5173`.

4. **Mobile App Setup:**
   ```bash
   cd apps/mobile
   npm install
   npx expo start --tunnel
   ```
   Scan the generated QR code using the Expo Go app on a real phone to load the mobile interface.

---

## Seeding Demo Data

We provide seeding scripts to populate Supabase with synthetic data for realistic charts, maps, and active states during development/demos.

1. **General Data Seeding:**
   This script inserts users, journeys, complaints, safety incidents, tatkal requests, and travel intents.
   ```bash
   # From the root directory:
   NODE_PATH=services/api/node_modules node scripts/seed.js
   ```

2. **Demo User Seeding:**
   This script inserts the specific demo user (Arjun Sharma) along with an active trip, complaints history, and travel forecasts.
   ```bash
   # From the root directory:
   NODE_PATH=services/api/node_modules node scripts/seed-demo-user.js
   ```

---

## Documentation

For full details on development workflows, constraints, and UI designs, refer to the documentation files:
- [AGENTS.md](docs/AGENTS.md) / [AGENTS.md (Root)](AGENTS.md) — Coding Rules
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) / [ARCHITECTURE.md (Root)](ARCHITECTURE.md) — Repo Structure and API Contracts
- [PRD.md](docs/PRD.md) / [PRD.md (Root)](PRD.md) — Product Requirements Document
- [DESIGN.md](docs/DESIGN.md) — Color Palette, Typography & Visual Specifications
- [plan.md](docs/plan.md) / [plan.md (Root)](plan.md) — Phased Implementation Plan
- [PROGRESS.md](docs/PROGRESS.md) / [PROGRESS.md (Root)](PROGRESS.md) — Context Tracking & Milestone Progress
- [WORKFLOW.md](docs/WORKFLOW.md) — Tatkal User and System Workflows
- [BIOMETRIC_HOLD.md](docs/BIOMETRIC_HOLD.md) — Biometric & Fingerprint Verification holds and details

---

## 🚀 Tatkal Assist Module (Member 2)

This repository includes the complete Tatkal Ticket Verified Booking Module implemented by Member 2. 

### Key Features Added:
- **Official IRCTC Registration & Linking**: Set up your official IRCTC profile details (User ID, Email, DOB, Gender, Marital Status, Occupation, Address, PIN Code).
- **Verified Co-Passenger Profile Auto-Fetch**: Enter a co-passenger's `irctc_id` to automatically fetch and verify their name, age, and gender. Identity parameters are read-only to prevent fake name manipulations.
- **Seat & Meal Preferences**: Select seat berth preferences and meal options (VEG, NON-VEG, NONE) per passenger.
- **Autofill Pre-Fill Booking Request**: Prefill passenger names and urgency score metrics to bypass manual form entry.
- **Urgency Score Engine**: Automatic pure mathematical scoring (1-10) based on reason, supporting document status, and account age.
- **Idempotent Scheduled Fire Job**: Simulates instant auto-booking submissions precisely on the Tatkal opening time window (10:00 AM for AC: 2A/3A/CC/EC/3E, 11:00 AM for Sleeper/Non-AC: SL/FC/2S).
- **Active Journey Overlap Locking**: Prevent multiple/duplicate bookings overlapping with an active passenger journey list (enforced on unique `irctc_id`s).
- **Ticket Surrender Marketplace**: Allows passengers to list their tickets for cancellation and match them to other users in real-time.
- **Handoff Documentation**: Comprehensive instructions for database, api routers, daemon scheduler, and mobile integration.

### Quick Setup:
1. Apply the database schemas in [002_tatkal.sql](supabase/migrations/002_tatkal.sql) and [0022_overlap_lock.sql](supabase/migrations/0022_overlap_lock.sql).
2. Install mobile datetimepicker: `npx expo install @react-native-community/datetimepicker` inside `apps/mobile/`.
3. Add backend `.env` variables (`SUPABASE_URL` and `SUPABASE_SERVICE_KEY`).
4. Read [INTEGRATION_HANDOFF.md](INTEGRATION_HANDOFF.md) for full files list and integration codes.

---

## Demo Day Setup

Render.com free tier services spin down after 15 minutes of inactivity. To prevent API cold starts during the demo:
1. Go to [https://cron-job.org](https://cron-job.org)
2. Create a free account.
3. Add a new cron job:
   - **URL**: `https://railsaathi-api.onrender.com/api/health`
   - **Interval**: Every 10 minutes
   - **Method**: GET
   - **Status**: Enabled

---

## Demo Credentials

Use these credentials to log in and demo the application:
- **Demo Phone**: `9999999999`
- **Demo OTP** (if using mock auth): `123456`
- **Admin Dashboard URL**: [https://railsaathi-admin.vercel.app](https://railsaathi-admin.vercel.app)
- **API URL**: [https://railsaathi-api.onrender.com](https://railsaathi-api.onrender.com)

---

## Team Structure & Ownership

RailSaathi is built by a team of 5 members with the following ownership split:
- **Member 1 (Spine / Platform Admin)**: Owns the repository shell, global authentication flow (Firebase + local custom JWT), user profiles, PNR journey aggregations, unified React Native shell, admin dashboard overview, real-time safety/SOS table and map views, station details table, and travel demand charts.
- **Member 2 (Tatkal Assist)**: Owns the automated passenger details autofill, countdown alerts, and speed-booking optimizations.
- **Member 3 (Complaints)**: Owns the multi-category complaint logging, image uploading, and passenger-facing grievance history screens.
- **Member 4 (Safety & SOS)**: Owns the zero-latency SOS panic button, live location sharing, and security status dashboard.
- **Member 5 (Station Guide)**: Owns the station status checks, platform layout views, and real-time station amenity details.
