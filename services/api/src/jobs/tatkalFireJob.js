const supabase = require('../db/supabase-client');
const {
  generateFakePNR,
  buildJourneyLockRows,
  resolvePassengerUserIds
} = require('../services/tatkal-service');

/**
 * Iterates over all pending requests whose scheduled fire time is due,
 * simulates the IRCTC fire sequence, and confirms them.
 */
const firePendingRequests = async () => {
  try {
    const now = new Date().toISOString();

    // 1. Fetch pending requests whose scheduled fire time is due
    const { data: pending, error } = await supabase
      .from('tatkal_requests')
      .select('*')
      .eq('status', 'PENDING')
      .lte('scheduled_fire_time', now);

    if (error) {
      console.error('[TATKAL_FIRE_JOB] Failed to fetch pending requests:', error);
      return;
    }

    if (!pending || pending.length === 0) {
      return; // Log nothing and return early if no requests
    }

    for (const req of pending) {
      try {
        // a. Re-fetch request to verify it is STILL PENDING (Idempotency Guard)
        const { data: currentReq, error: getErr } = await supabase
          .from('tatkal_requests')
          .select('status')
          .eq('id', req.id)
          .single();

        if (getErr || !currentReq) {
          console.error(`[TATKAL_FIRE_JOB] Failed to verify status for request_id=${req.id}:`, getErr);
          continue;
        }

        // b. If not PENDING: log and skip
        if (currentReq.status !== 'PENDING') {
          console.log(`[TATKAL_FIRE] request_id=${req.id} status=SKIPPED (already ${currentReq.status}) at=${new Date().toISOString()}`);
          continue;
        }

        // c. Log firing attempt
        console.log(`[TATKAL_FIRE] request_id=${req.id} status=FIRING at=${new Date().toISOString()}`);

        // d. Update status to FIRED
        const { error: fireErr } = await supabase
          .from('tatkal_requests')
          .update({ status: 'FIRED', updated_at: new Date() })
          .eq('id', req.id);

        if (fireErr) {
          console.error(`[TATKAL_FIRE_JOB] Failed to mark request_id=${req.id} as FIRED:`, fireErr);
          continue;
        }

        // e. await 2 seconds (simulate IRCTC call)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // f. Generate fake PNR
        const fakePNR = generateFakePNR();

        // g. Update status to CONFIRMED, simulated_pnr = fakePNR, updated_at = NOW()
        const { error: confirmErr } = await supabase
          .from('tatkal_requests')
          .update({
            status: 'CONFIRMED',
            simulated_pnr: fakePNR,
            updated_at: new Date()
          })
          .eq('id', req.id);

        if (confirmErr) {
          console.error(`[TATKAL_FIRE_JOB] Failed to mark request_id=${req.id} as CONFIRMED:`, confirmErr);
          continue;
        }

        // h. Log confirmation
        console.log(`[TATKAL_FIRE] request_id=${req.id} status=CONFIRMED pnr=${fakePNR} at=${new Date().toISOString()}`);

        // i. Create journey lock rows for account holder + co-passengers
        // Locks the IRCTC ID for the full train duration (departure → arrival).
        // All passengers on this PNR cannot book overlapping Tatkal tickets.
        try {
          const passengerUserIds = [req.user_id];

          // Best-effort lookup: match co-passenger names to RailSaathi accounts
          // Production would use Aadhaar/IRCTC ID linkage instead of name matching
          if (Array.isArray(req.passengers) && req.passengers.length > 0) {
            const passengerNames = req.passengers
              .filter(p => p && typeof p.name === 'string')
              .map(p => p.name.trim());

            if (passengerNames.length > 0) {
              const { data: matchedUsers } = await supabase
                .from('users')
                .select('id, name');

              if (matchedUsers) {
                matchedUsers.forEach(u => {
                  const matched = passengerNames.some(
                    pName => pName.toLowerCase() === (u.name || '').trim().toLowerCase()
                  );
                  if (matched && !passengerUserIds.includes(u.id)) {
                    passengerUserIds.push(u.id);
                  }
                });
              }
            }
          }

          const confirmedReq = { ...req, simulated_pnr: fakePNR };
          const lockRows = buildJourneyLockRows(confirmedReq, passengerUserIds);

          if (lockRows.length > 0) {
            const { error: lockInsertErr } = await supabase
              .from('tatkal_journey_locks')
              .insert(lockRows);

            if (lockInsertErr) throw lockInsertErr;
          }

          console.log(`[TATKAL_FIRE] request_id=${req.id} locks_created=${lockRows.length} users_locked=${passengerUserIds.length}`);
        } catch (lockErr) {
          // Lock creation failure is non-fatal — booking is already confirmed
          console.error(`[JOURNEY_LOCK] Failed for request_id=${req.id}:`, lockErr);
        }

      } catch (perReqErr) {
        console.error(`[TATKAL_FIRE_JOB] Unexpected error processing request_id=${req.id}:`, perReqErr);
      }
    }
  } catch (globalErr) {
    console.error('[TATKAL_FIRE_JOB] Uncaught fire job exception:', globalErr);
  }
};

/**
 * Starts the fire job polling and runs once on boot.
 */
const start = () => {
  // Run immediately on boot
  firePendingRequests().catch(err => {
    console.error('[TATKAL_FIRE_JOB] Initial boot execution failed:', err);
  });

  // Poll every 30 seconds
  setInterval(firePendingRequests, 30000);
  console.log('[TATKAL_FIRE] Job started. Polling every 30 seconds.');
};

module.exports = {
  start
};

// Integration note for Member 1:
// Add this to index.js: require('./jobs/tatkalFireJob').start()
