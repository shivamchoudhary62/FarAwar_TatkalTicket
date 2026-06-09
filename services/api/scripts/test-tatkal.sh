#!/bin/bash

# ==============================================================================
# RailSaathi — Tatkal Module Manual API Verification Script
# File: services/api/scripts/test-tatkal.sh
# ==============================================================================
# Instructions for getting JWT tokens:
# 1. Start Member 1's API server.
# 2. Authenticate User A and User B using the Auth endpoints:
#    curl -X POST http://localhost:3000/api/auth/login \
#      -H "Content-Type: application/json" \
#      -d '{"phone": "+919999999991", "otp": "123456"}'
# 3. Copy the returned "token" value and assign it to the variables below.
# ==============================================================================

TOKEN_A="REPLACE_WITH_USER_A_JWT_TOKEN"
TOKEN_B="REPLACE_WITH_USER_B_JWT_TOKEN"
API_URL="http://localhost:3000/api"

# Get current date in YYYY-MM-DD format
TRAVEL_DATE=$(date -d "+2 days" +%Y-%m-%d 2>/dev/null || date -v+2d +%Y-%m-%d 2>/dev/null || echo "2026-06-20")

echo "=== TEST 1: Anti-hoarding constraint ==="
echo "Submitting first pre-fill request for Train 12951 (should return 201)..."
curl -X POST "$API_URL/tatkal/prefill" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{
    \"from_station\": \"NDLS\",
    \"to_station\": \"MMCT\",
    \"train_number\": \"12951\",
    \"travel_date\": \"$TRAVEL_DATE\",
    \"class\": \"3A\",
    \"is_urgent\": false,
    \"passengers\": [
      {\"name\": \"Raj Kumar\", \"age\": 28, \"gender\": \"M\"}
    ]
  }"
echo -e "\n"

echo "Submitting duplicate pre-fill request for the SAME train 12951 today (should fail with 409 DUPLICATE_REQUEST)..."
curl -X POST "$API_URL/tatkal/prefill" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{
    \"from_station\": \"NDLS\",
    \"to_station\": \"MMCT\",
    \"train_number\": \"12951\",
    \"travel_date\": \"$TRAVEL_DATE\",
    \"class\": \"3A\",
    \"is_urgent\": false,
    \"passengers\": [
      {\"name\": \"Raj Kumar\", \"age\": 28, \"gender\": \"M\"}
    ]
  }"
echo -e "\n"

echo "Submitting second pre-fill request for a DIFFERENT train 12953 today (should succeed with 201)..."
curl -X POST "$API_URL/tatkal/prefill" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{
    \"from_station\": \"NDLS\",
    \"to_station\": \"MMCT\",
    \"train_number\": \"12953\",
    \"travel_date\": \"$TRAVEL_DATE\",
    \"class\": \"3A\",
    \"is_urgent\": false,
    \"passengers\": [
      {\"name\": \"Raj Kumar\", \"age\": 28, \"gender\": \"M\"}
    ]
  }"
echo -e "\n"

echo "=== TEST 2: Account holder mandate ==="
echo "Submitting pre-fill request without the account holder's name in passenger list (should fail with 400)..."
curl -X POST "$API_URL/tatkal/prefill" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{
    \"from_station\": \"NDLS\",
    \"to_station\": \"MMCT\",
    \"train_number\": \"12951\",
    \"travel_date\": \"$TRAVEL_DATE\",
    \"class\": \"3A\",
    \"is_urgent\": false,
    \"passengers\": [
      {\"name\": \"Suresh Kumar\", \"age\": 35, \"gender\": \"M\"}
    ]
  }"
echo -e "\n"

echo "=== TEST 3: Full happy path ==="
echo "Submit a valid pre-fill request..."
PREFILL_RES=$(curl -s -X POST "$API_URL/tatkal/prefill" \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d "{
    \"from_station\": \"BLR\",
    \"to_station\": \"HYD\",
    \"train_number\": \"12785\",
    \"travel_date\": \"$TRAVEL_DATE\",
    \"class\": \"3A\",
    \"is_urgent\": true,
    \"urgency_reason\": \"medical\",
    \"urgency_document_url\": \"https://supabase.co/doc.pdf\",
    \"passengers\": [
      {\"name\": \"Suresh Kumar\", \"age\": 45, \"gender\": \"M\"}
    ]
  }")
echo "$PREFILL_RES"
REQ_ID=$(echo "$PREFILL_RES" | grep -oP '"id":"\K[^"]+' || echo "INSERT_REQUEST_UUID_HERE")
echo -e "\nDetected Request ID: $REQ_ID\n"

echo "GET /my-requests (should list User B's requests)..."
curl -X GET "$API_URL/tatkal/my-requests" \
  -H "Authorization: Bearer $TOKEN_B"
echo -e "\n"

echo "GET /:id (should display specific request detail)..."
curl -X GET "$API_URL/tatkal/$REQ_ID" \
  -H "Authorization: Bearer $TOKEN_B"
echo -e "\n"

echo "POST /fire/:id (demo endpoint to simulate firing booking request, should return 200 with CONFIRMED and PNR)..."
curl -X POST "$API_URL/tatkal/fire/$REQ_ID" \
  -H "Authorization: Bearer $TOKEN_B"
echo -e "\n"

echo "=== TEST 4: Fire job simulation ==="
echo "To test the background scheduler, execute this SQL command directly inside Supabase SQL Editor:"
echo "----------------------------------------------------------------------------------"
echo "INSERT INTO tatkal_requests ("
# Note: train_number is required NOT NULL
echo "  user_id, from_station, to_station, train_number, travel_date, class, passengers,"
echo "  scheduled_fire_time, status, booking_date"
echo ") VALUES ("
echo "  'USER_UUID_FROM_DB_HERE', 'HWH', 'NDLS', '12301', '$TRAVEL_DATE', 'SL',"
echo "  '[{\"name\": \"Raj Kumar\", \"age\": 28, \"gender\": \"M\"}]'::jsonb,"
echo "  NOW() + INTERVAL '60 seconds', 'PENDING', CURRENT_DATE"
echo ");"
echo "----------------------------------------------------------------------------------"
echo "Wait 90 seconds, then check the record status using the query:"
echo "SELECT status, simulated_pnr FROM tatkal_requests WHERE from_station = 'HWH';"
echo -e "\n"

echo "=== TEST 5: Surrender market flow ==="
echo "Step A: User A lists a confirmed ticket (returns 201 LISTED)..."
SURR_RES=$(curl -s -X POST "$API_URL/tatkal/surrender" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{
    \"pnr\": \"8372910392\",
    \"from_station\": \"NDLS\",
    \"to_station\": \"MMCT\",
    \"train_number\": \"12951\",
    \"travel_date\": \"$TRAVEL_DATE\",
    \"class\": \"3A\"
  }")
echo "$SURR_RES"
SURR_ID=$(echo "$SURR_RES" | grep -oP '"id":"\K[^"]+' || echo "INSERT_SURRENDER_UUID_HERE")
echo -e "\nCreated Surrender ID: $SURR_ID\n"

echo "Step B: Fetching marketplace listings (GET /surrenders)..."
curl -X GET "$API_URL/tatkal/surrenders?from=NDLS&to=MMCT" \
  -H "Authorization: Bearer $TOKEN_B"
echo -e "\n"

echo "Step C: User B requests the ticket listed by User A (should return 200 MATCHED)..."
curl -X POST "$API_URL/tatkal/surrenders/$SURR_ID/request" \
  -H "Authorization: Bearer $TOKEN_B"
echo -e "\n"

echo "Step D: User A attempts to request their own listed ticket (should return 400 SELF_REQUEST)..."
curl -X POST "$API_URL/tatkal/surrenders/$SURR_ID/request" \
  -H "Authorization: Bearer $TOKEN_A"
echo -e "\n"
