const express = require('express');
const { verifyToken } = require('../middleware/auth');
const supabase = require('../db/supabase-client');
const {
  generateFakePNR,
  resolvePassengerUserIds,
  buildJourneyLockRows
} = require('../services/tatkal-service');

const router = express.Router();

const sendError = (res, err, code, msg = "An unexpected error occurred.", status = 500, logCtx = "") => {
  if (logCtx) console.error(`[${logCtx}]`, err);
  return res.status(status).json({ error: msg, code });
};

// GET /api/tatkal/my-requests
router.get('/my-requests', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tatkal_requests')
      .select('*')
      .eq('user_id', req.user.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(res, error, 'DATABASE_ERROR', 'Failed to fetch Tatkal requests.', 500, 'MY_REQUESTS');
    }
    return res.status(200).json({ data: data || [], message: "ok" });
  } catch (err) {
    return sendError(res, err, 'SERVER_ERROR', 'An unexpected error occurred.', 500, 'MY_REQUESTS_UNCAUGHT');
  }
});

// GET /api/tatkal/my-locks — Active journey locks for the authenticated user
router.get('/my-locks', verifyToken, async (req, res) => {
  try {
    const { data: locks, error: lockErr } = await supabase
      .from('tatkal_journey_locks')
      .select('id, departure_datetime, arrival_datetime, pnr, source_request_id, created_at')
      .eq('locked_user_id', req.user.user_id)
      .order('departure_datetime', { ascending: true });

    if (lockErr) {
      return sendError(res, lockErr, 'DATABASE_ERROR', 'Failed to fetch journey locks.', 500, 'MY_LOCKS');
    }

    // Enrich with route info from tatkal_requests
    const enriched = [];
    for (const lock of (locks || [])) {
      const { data: reqData } = await supabase
        .from('tatkal_requests')
        .select('from_station, to_station')
        .eq('id', lock.source_request_id)
        .maybeSingle();

      enriched.push({
        ...lock,
        from_station: reqData?.from_station || '—',
        to_station: reqData?.to_station || '—'
      });
    }

    return res.status(200).json({ data: enriched, message: "ok" });
  } catch (err) {
    return sendError(res, err, 'SERVER_ERROR', 'An unexpected error occurred.', 500, 'MY_LOCKS_UNCAUGHT');
  }
});

// POST /api/tatkal/cancel/:id
router.post('/cancel/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { data: request, error: getErr } = await supabase
      .from('tatkal_requests')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (getErr) return sendError(res, getErr, 'DATABASE_ERROR', 'Failed to verify request details.', 500, 'CANCEL_GET');
    if (!request) return res.status(404).json({ error: "Request not found", code: 'NOT_FOUND' });
    if (request.user_id !== userId) return res.status(403).json({ error: "Not authorized", code: 'FORBIDDEN' });
    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: "Only pending requests can be cancelled.", code: 'INVALID_STATUS' });
    }

    const { data: updated, error: updErr } = await supabase
      .from('tatkal_requests')
      .update({ status: 'CANCELLED', updated_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updErr) return sendError(res, updErr, 'DATABASE_ERROR', 'Failed to cancel request.', 500, 'CANCEL_UPDATE');
    return res.status(200).json({ data: updated, message: "Request cancelled." });
  } catch (err) {
    return sendError(res, err, 'SERVER_ERROR', 'An unexpected error occurred.', 500, 'CANCEL_UNCAUGHT');
  }
});

// GET /api/tatkal/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { data: request, error } = await supabase
      .from('tatkal_requests')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) return sendError(res, error, 'DATABASE_ERROR', 'Failed to retrieve request details.', 500, 'GET_BY_ID');
    if (!request) return res.status(404).json({ error: "Request not found", code: 'NOT_FOUND' });
    if (request.user_id !== req.user.user_id) return res.status(403).json({ error: "Not authorized", code: 'FORBIDDEN' });

    return res.status(200).json({ data: request, message: "ok" });
  } catch (err) {
    return sendError(res, err, 'SERVER_ERROR', 'An unexpected error occurred.', 500, 'GET_BY_ID_UNCAUGHT');
  }
});

// POST /api/tatkal/fire/:id (demo fire simulation endpoint)
router.post('/fire/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const requestId = req.params.id;

    // 1. Fetch tatkal_request by id
    const { data: request, error: getErr } = await supabase
      .from('tatkal_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (getErr) return sendError(res, getErr, 'DATABASE_ERROR', 'Failed to retrieve request details.', 500, 'FIRE_GET');
    if (!request) return res.status(404).json({ error: "Request not found", code: 'NOT_FOUND' });

    // 2. Verify ownership
    if (request.user_id !== userId) return res.status(403).json({ error: "Not authorized", code: 'FORBIDDEN' });

    // 3. If status is not PENDING
    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: "Request is not in PENDING status.", code: 'INVALID_STATUS' });
    }

    // 4. Update status to FIRED
    const { error: fireErr } = await supabase
      .from('tatkal_requests')
      .update({ status: 'FIRED', updated_at: new Date() })
      .eq('id', requestId);

    if (fireErr) return sendError(res, fireErr, 'DATABASE_ERROR', 'Failed to update request state to FIRING.', 500, 'FIRE_UPDATE_FIRING');

    // 5. Simulate IRCTC network delay
    await new Promise(r => setTimeout(r, 2000));

    // 6. Generate fake PNR using generateFakePNR()
    const fakePNR = generateFakePNR();

    // 7. Update status to CONFIRMED, simulated_pnr = fakePNR, updated_at = NOW()
    const { data: confirmed, error: confErr } = await supabase
      .from('tatkal_requests')
      .update({
        status: 'CONFIRMED',
        simulated_pnr: fakePNR,
        updated_at: new Date()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (confErr) return sendError(res, confErr, 'DATABASE_ERROR', 'Failed to confirm request booking.', 500, 'FIRE_UPDATE_CONFIRMED');

    // 8. Create journey locks for all passengers with RailSaathi accounts
    if (confirmed.departure_datetime && confirmed.arrival_datetime) {
      try {
        const passengerUserIds = await resolvePassengerUserIds(confirmed.passengers, supabase);
        const lockRows = buildJourneyLockRows(confirmed, passengerUserIds);

        if (lockRows.length > 0) {
          const { error: lockInsertErr } = await supabase
            .from('tatkal_journey_locks')
            .insert(lockRows);

          if (lockInsertErr) throw lockInsertErr;
        }
        console.log(`[JOURNEY_LOCK] Created ${lockRows.length} locks for request_id=${confirmed.id}`);
      } catch (lockErr) {
        // Lock creation failure is non-fatal — booking is already confirmed
        console.error(`[JOURNEY_LOCK] Failed for request_id=${confirmed.id}:`, lockErr);
      }
    }

    // 9. Return 200 payload
    return res.status(200).json({
      data: {
        id: confirmed.id,
        status: "CONFIRMED",
        simulated_pnr: fakePNR,
        from_station: confirmed.from_station,
        to_station: confirmed.to_station,
        travel_date: confirmed.travel_date,
        class: confirmed.class
      },
      message: "Booking request fired and confirmed."
    });

  } catch (err) {
    return sendError(res, err, 'SERVER_ERROR', 'An unexpected error occurred during execution.', 500, 'FIRE_UNCAUGHT');
  }
});

module.exports = router;
