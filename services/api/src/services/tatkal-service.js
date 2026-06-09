/**
 * JSDoc: Scoring Logic
 * calculateUrgencyScore calculates the urgency score (1.0 to 10.0) based on:
 * - base scores by reason: medical = 9, bereavement = 8, official = 7, personal = 5, default = 5
 * - supports document upload bonus (+1.0 if hasDocument is true)
 * - supports account age bonus (+0.5 if accountAgeMonths > 6)
 * - the score is capped at a maximum of 10.0 using Math.min
 *
 * @param {string} reason - Category of urgency ('medical', 'bereavement', etc.)
 * @param {boolean} hasDocument - Whether supporting document is uploaded
 * @param {number} accountAgeMonths - Age of user account in months
 * @returns {number} Score between 1.0 and 10.0
 */
function calculateUrgencyScore(reason, hasDocument, accountAgeMonths) {
  const baseScores = {
    medical: 9.0,
    bereavement: 8.0,
    official: 7.0,
    personal: 5.0
  };

  let score = baseScores[reason] !== undefined ? baseScores[reason] : 5.0;

  if (hasDocument) {
    score += 1.0;
  }

  if (accountAgeMonths > 6) {
    score += 0.5;
  }

  return Math.min(score, 10.0);
}

/**
 * Calculates the fire time for booking.
 * - AC classes (1A, 2A, 3A) fire at 10:00:00 AM local time the day before travel date.
 * - Non-AC classes (SL, GEN) fire at 11:00:00 AM local time the day before travel date.
 *
 * @param {string} travelDate - Travel date string ("YYYY-MM-DD")
 * @param {string} trainClass - Class of travel (e.g. '3A', 'SL')
 * @returns {Date} JavaScript Date object representing the fire time
 */
function calculateFireTime(travelDate, trainClass) {
  const isAC = ['2A', '3A', 'CC', 'EC', '3E'].includes(trainClass);
  const fireHour = isAC ? 10 : 11;

  // Split travelDate manually to prevent timezone/parsing differences
  const parts = travelDate.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  // Set fire time to the day before travel date at the calculated hour
  return new Date(year, month - 1, day - 1, fireHour, 0, 0, 0);
}

/**
 * Validates that the account holder's name is present in the passenger list (case-insensitive and trimmed).
 *
 * @param {Array<object>} passengers - List of passengers
 * @param {string} accountHolderName - Name of the account holder from the users table
 * @returns {object} Validation result { valid: boolean, message?: string }
 */
function validatePassengerList(passengers, accountHolderName) {
  if (!accountHolderName || typeof accountHolderName !== 'string') {
    return { valid: false, message: "Account holder must be included in the passenger list." };
  }

  if (!Array.isArray(passengers)) {
    return { valid: false, message: "Account holder must be included in the passenger list." };
  }

  const normalizedHolder = accountHolderName.trim().toLowerCase();

  const found = passengers.some(p => {
    if (p && typeof p.name === 'string') {
      return p.name.trim().toLowerCase() === normalizedHolder;
    }
    return false;
  });

  if (found) {
    return { valid: true };
  }

  return { valid: false, message: "Account holder must be included in the passenger list." };
}

/**
 * Generates a mock PNR for the simulated booking.
 *
 * @returns {string} E.g. "DEMO481023"
 */
function generateFakePNR() {
  const min = 100000;
  const max = 999999;
  const randomDigits = Math.floor(Math.random() * (max - min + 1)) + min;
  return `DEMO${randomDigits}`;
}

/**
 * Formats a success message for the API response.
 *
 * @param {Date} fireTime - The Date object when it is scheduled to fire
 * @param {string} trainClass - Travel class
 * @returns {string} Message string
 */
function formatFireTimeMessage(fireTime, trainClass) {
  const isAC = ['1A', '2A', '3A'].includes(trainClass);
  const timeStr = isAC ? "10:00 AM" : "11:00 AM";
  return `Pre-fill saved. Will fire at ${timeStr} tomorrow.`;
}

/**
 * Pure function — no DB calls.
 * Checks if a requested journey window overlaps with any existing lock.
 *
 * Overlap condition (standard interval intersection):
 *   existing.departure < requestedArrival
 *   AND existing.arrival > requestedDeparture
 *
 * @param {Date|string} requestedDeparture - Start of the requested journey
 * @param {Date|string} requestedArrival   - End of the requested journey
 * @param {Array} existingLocks - Array of { departure_datetime, arrival_datetime, pnr }
 * @returns {{ overlaps: false } | { overlaps: true, conflictingPNR: string, conflictWindow: string }}
 */
function checkJourneyOverlap(requestedDeparture, requestedArrival, existingLocks) {
  const reqDep = new Date(requestedDeparture);
  const reqArr = new Date(requestedArrival);

  for (const lock of existingLocks) {
    const lockDep = new Date(lock.departure_datetime);
    const lockArr = new Date(lock.arrival_datetime);

    if (lockDep < reqArr && lockArr > reqDep) {
      return {
        overlaps: true,
        conflictingPNR: lock.pnr || 'UNKNOWN',
        conflictWindow: `${formatLockWindow(lockDep, lockArr)}`
      };
    }
  }
  return { overlaps: false };
}

/**
 * Pure helper. Returns human-readable lock window for error messages.
 * Example: "11 Jul 15:35 → 14 Jul 09:15"
 *
 * Uses en-IN locale to keep it readable for Indian users.
 * No external date library required.
 *
 * @param {Date} departure - Journey departure Date
 * @param {Date} arrival   - Journey arrival Date
 * @returns {string} Formatted window string
 */
function formatLockWindow(departure, arrival) {
  const opts = { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false };
  const depStr = departure.toLocaleString('en-IN', opts);
  const arrStr = arrival.toLocaleString('en-IN', opts);
  return `${depStr} → ${arrStr}`;
}

/**
 * Pure function.
 * Given a confirmed tatkal_request and a list of user IDs for
 * all passengers who have RailSaathi accounts, returns an array
 * of rows ready to INSERT into tatkal_journey_locks.
 *
 * @param {Object} confirmedRequest - The confirmed tatkal_request row
 * @param {string[]} passengerUserIds - Array of user UUIDs (account holder + matched co-passengers)
 * @returns {Array} Array of objects matching tatkal_journey_locks schema
 */
function buildJourneyLockRows(confirmedRequest, passengerUserIds) {
  return passengerUserIds.map(userId => ({
    locked_user_id:     userId,
    source_request_id:  confirmedRequest.id,
    departure_datetime: confirmedRequest.departure_datetime,
    arrival_datetime:   confirmedRequest.arrival_datetime,
    pnr:                confirmedRequest.simulated_pnr
  }));
}

/**
 * Converts a local IST date+time string into a UTC ISO 8601 string
 * suitable for storage in Supabase TIMESTAMPTZ columns.
 *
 * IST is UTC+05:30 (fixed offset, India does not observe DST).
 *
 * @param {string} istDateStr - Date string in "YYYY-MM-DD" format
 * @param {string} istTimeStr - Time string in "HH:MM" 24-hour format
 * @returns {string} ISO 8601 UTC string (e.g. "2026-07-11T10:05:00.000Z")
 */
function istToUtc(istDateStr, istTimeStr) {
  // Build an ISO string with the IST offset appended
  const istIso = `${istDateStr}T${istTimeStr}:00+05:30`;
  const utcDate = new Date(istIso);
  return utcDate.toISOString();
}

/**
 * Resolves passenger names to RailSaathi user IDs via case-insensitive lookup.
 * Returns an array of matched user UUIDs. Passengers without accounts are skipped.
 *
 * NOTE: This is the one non-pure function in this file — it requires a DB call
 * to match passenger names against the users table. It lives here because
 * the route handler should not contain business logic.
 *
 * @param {Array<{name: string}>} passengers - Passenger list from the request
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<string[]>} Array of user UUIDs
 */
async function resolvePassengerUserIds(passengers, supabase) {
  if (!Array.isArray(passengers) || passengers.length === 0) {
    return [];
  }

  const ids = passengers
    .filter(p => p && typeof p.irctc_id === 'string')
    .map(p => p.irctc_id.trim());

  if (ids.length === 0) return [];

  const { data: users, error } = await supabase
    .from('users')
    .select('id')
    .in('irctc_id', ids);

  if (error) {
    console.error('[RESOLVE_PASSENGERS] Query failed:', error);
    throw new Error('Passenger user resolution failed');
  }

  return (users || []).map(u => u.id);
}

module.exports = {
  calculateUrgencyScore,
  calculateFireTime,
  validatePassengerList,
  generateFakePNR,
  formatFireTimeMessage,
  checkJourneyOverlap,
  formatLockWindow,
  buildJourneyLockRows,
  istToUtc,
  resolvePassengerUserIds
};

/**
 * BIOMETRIC VERIFICATION STUB
 * Status: ON HOLD — see docs/BIOMETRIC_HOLD.md before uncommenting.
 *
 * In production: calls UIDAI eKYC API to verify user identity at account
 * creation time only (NOT at travel time — travel-time verification risks
 * stranding legitimate passengers if the scanner fails).
 *
 * @param {string} userId
 * @param {string} biometricToken - from device fingerprint reader
 * @returns {Promise<{ verified: boolean, reason?: string }>}
 */
// async function verifyBiometric(userId, biometricToken) {
//   // TODO: integrate UIDAI eKYC API here
//   // Approval required: https://resident.uidai.gov.in/eKYC
//   throw new Error('Biometric verification is not implemented. See docs/BIOMETRIC_HOLD.md')
// }
// exports.verifyBiometric = verifyBiometric
