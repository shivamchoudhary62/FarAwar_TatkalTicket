# Tatkal Verified Booking Ecosystem — API Testing Guide

This guide explains how to execute manual tests using the `test-tatkal.sh` script to verify anti-hoarding rules, account holder passenger list mandates, booking fire scheduling, and the ticket surrender reallocation marketplace.

---

## 1. Prerequisites

Before running the tests, ensure:
1. **Database Applied**: The Supabase migrations (`001_core_schema.sql` and `002_tatkal.sql`) are applied.
2. **Server Running**: The Express API server is running on `http://localhost:3000`.
3. **Environment Setup**: Ensure your `.env` contains the correct `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.
4. **Users Seeded**: Run `node services/api/scripts/seed-tatkal.js` to create demo data and ensure at least 2 test users exist in the database.

---

## 2. Obtaining JWT Tokens

The manual test script requires two JWT tokens (`TOKEN_A` and `TOKEN_B`) representing two different passengers.

To obtain these:
1. Authenticate **User A** via the login endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919999999991", "otp": "123456"}'
   ```
2. Copy the `token` from the JSON response and assign it to `TOKEN_A` in `services/api/scripts/test-tatkal.sh`.
3. Repeat the request with **User B's** details (e.g. `+919999999992`) and assign that token to `TOKEN_B`.

---

## 3. Running the Verification Script

Open a shell (Git Bash, WSL, or macOS Terminal) and run:
```bash
chmod +x services/api/scripts/test-tatkal.sh
./services/api/scripts/test-tatkal.sh
```

---

## 4. Interpreting Results

### TEST 1 — Anti-hoarding constraint
- **Purpose**: Verifies that a user cannot hoard multiple bookings on the same booking date.
- **Expected Outcome**:
  - The **first request** returns HTTP `201 Created` with the request data:
    ```json
    { "data": { "id": "...", "status": "PENDING" }, "message": "Pre-fill saved..." }
    ```
  - The **second request** returns HTTP `409 Conflict` containing:
    ```json
    { "error": "You already have an active Tatkal request for today.", "code": "DUPLICATE_REQUEST" }
    ```

### TEST 2 — Account holder mandate
- **Purpose**: Prevents proxy booking. The account holder's name must appear in the passenger array.
- **Expected Outcome**:
  - The request returns HTTP `400 Bad Request` containing:
    ```json
    { "error": "Account holder must be included in the passenger list.", "code": "ACCOUNT_HOLDER_MANDATE_FAILED" }
    ```

### TEST 3 — Full happy path
- **Purpose**: Validates creating, retrieving, and firing booking requests.
- **Expected Outcome**:
  - Prefill creation returns HTTP `201 Created`.
  - GET `/my-requests` returns HTTP `200 OK` listing the requests.
  - GET `/:id` returns HTTP `200 OK` showing the details.
  - POST `/fire/:id` triggers the simulation, waits 2 seconds, and returns HTTP `200 OK` with status `CONFIRMED` and a simulated PNR:
    ```json
    { "data": { "status": "CONFIRMED", "simulated_pnr": "DEMO847291" }, "message": "..." }
    ```

### TEST 4 — Scheduled fire job simulation
- **Purpose**: Validates that the background daemon automatically processes due requests.
- **Expected Outcome**:
  - Insert the request scheduled 60 seconds in the future via Supabase SQL Editor.
  - Watch the API console logs. Within 90 seconds, you should see:
    ```text
    [TATKAL_FIRE] request_id=... status=FIRING at=...
    [TATKAL_FIRE] request_id=... status=CONFIRMED pnr=DEMO... at=...
    ```

### TEST 5 — Surrender market flow
- **Purpose**: Verifies ticket surrender listings and reallocation matches.
- **Expected Outcome**:
  - **Step A**: User A lists ticket. Returns HTTP `201 Created` with status `LISTED`.
  - **Step B**: User B queries market. Returns HTTP `200 OK` showing User A's listing.
  - **Step C**: User B claims ticket. Returns HTTP `200 OK` with status `MATCHED` and `requester_user_id` set to User B.
  - **Step D**: User A attempts to claim their own ticket. Returns HTTP `400 Bad Request` with code `SELF_REQUEST`.
