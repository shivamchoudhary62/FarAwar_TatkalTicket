const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const supabase = require('../db/supabase-client');
const {
  calculateUrgencyScore,
  calculateFireTime,
  validatePassengerList,
  generateFakePNR,
  formatFireTimeMessage,
  checkJourneyOverlap,
  buildJourneyLockRows,
  resolvePassengerUserIds,
  istToUtc
} = require('../services/tatkal-service');

const router = express.Router();

// Helper to handle and send errors cleanly without exposing raw DB details
const sendError = (res, err, code, msg = "An unexpected error occurred.", status = 500, logCtx = "") => {
  if (logCtx) console.error(`[${logCtx}]`, err);
  return res.status(status).json({ error: msg, code });
};

// Validators
const prefillValidators = [
  body('from_station').notEmpty().isLength({ max: 7 }).trim().toUpperCase(),
  body('to_station').notEmpty().isLength({ max: 7 }).trim().toUpperCase(),
  body('train_number').notEmpty().isLength({ max: 10 }).trim().withMessage('train_number is required'),
  body('travel_date').isISO8601().custom(val => {
    const inputDate = new Date(val); inputDate.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    if (inputDate < today) throw new Error('Date cannot be in the past');
    return true;
  }),
  body('departure_datetime').optional().isISO8601().withMessage('departure_datetime must be a valid ISO 8601 string'),
  body('arrival_datetime').optional().isISO8601().withMessage('arrival_datetime must be a valid ISO 8601 string').custom((val, { req }) => {
    if (req.body.departure_datetime && new Date(val) <= new Date(req.body.departure_datetime)) {
      throw new Error('arrival_datetime must be after departure_datetime');
    }
    return true;
  }),
  body('class').isIn(['SL', '3A', '2A', '3E', 'CC', '2S', 'FC', 'EC', 'GEN']),
  body('passengers').isArray({ min: 1, max: 4 }).withMessage('A maximum of 4 passengers are allowed for Tatkal bookings')
];

// POST /api/tatkal/prefill
router.post('/prefill', verifyToken, prefillValidators, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: `Validation failed: ${errors.array().map(e => e.msg || e.path).join(', ')}`,
        code: 'VALIDATION_ERROR'
      });
    }

    const userId = req.user.user_id;

    // Fetch user details
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('name, created_at, irctc_id, dob, gender')
      .eq('id', userId)
      .single();

    if (userErr || !user) {
      return sendError(res, userErr, 'USER_NOT_FOUND', 'User not found', 404, 'PREFILL_USER');
    }

    if (!user.irctc_id) {
      return res.status(400).json({
        error: "You must complete your official IRCTC profile setup before booking.",
        code: 'PROFILE_REQUIRED'
      });
    }

    // Ensure the first passenger matches the booker's verified details
    const firstPassenger = req.body.passengers[0];
    if (!firstPassenger || firstPassenger.irctc_id !== user.irctc_id) {
      return res.status(400).json({
        error: "Account holder must be the primary passenger in the booking list.",
        code: 'ACCOUNT_HOLDER_MANDATE_FAILED'
      });
    }

    // Verify all passenger details against database profiles
    for (const passenger of req.body.passengers) {
      if (!passenger.irctc_id) {
        return res.status(400).json({
          error: "All passengers must have a valid registered IRCTC ID.",
          code: 'PASSENGER_ID_REQUIRED'
        });
      }
      
      const { data: profile, error: profErr } = await supabase
        .from('users')
        .select('name, dob, gender')
        .eq('irctc_id', passenger.irctc_id.trim())
        .maybeSingle();

      if (profErr || !profile) {
        return res.status(400).json({
          error: `Passenger with IRCTC ID '${passenger.irctc_id}' is not registered on RailSaathi.`,
          code: 'PASSENGER_NOT_FOUND'
        });
      }

      // Calculate age
      let expectedAge = '';
      if (profile.dob) {
        const birthDate = new Date(profile.dob);
        const today = new Date();
        expectedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          expectedAge--;
        }
      }

      const nameMatches = profile.name && passenger.name && (profile.name.trim().toLowerCase() === passenger.name.trim().toLowerCase());
      const ageMatches = passenger.age && (Math.abs(parseInt(passenger.age) - expectedAge) <= 1);
      const genderMatches = profile.gender && passenger.gender && (profile.gender.toLowerCase() === passenger.gender.toLowerCase());

      if (!nameMatches || !ageMatches || !genderMatches) {
        return res.status(400).json({
          error: `Profile details mismatch for IRCTC ID '${passenger.irctc_id}'. Please re-fetch passenger details and try again.`,
          code: 'PROFILE_MISMATCH'
        });
      }
    }

    // Format local booking_date as YYYY-MM-DD
    const today = new Date();
    const bookingDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Duplicate request check (anti-hoarding for same train)
    const { data: existing, error: existErr } = await supabase
      .from('tatkal_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('booking_date', bookingDate)
      .eq('train_number', req.body.train_number)
      .not('status', 'in', '("CANCELLED","FAILED")')
      .maybeSingle();

    if (existErr) {
      return sendError(res, existErr, 'DATABASE_ERROR', 'Database validation failed.', 500, 'PREFILL_DUP_CHECK');
    }
    if (existing) {
      return res.status(409).json({ error: "You already have an active Tatkal request for this train today.", code: 'DUPLICATE_REQUEST' });
    }

    // Derive departure_datetime and arrival_datetime if not provided
    let departureDt = req.body.departure_datetime;
    let arrivalDt = req.body.arrival_datetime;

    if (!departureDt) {
      // travel_date at 10:00:00 IST (converted to UTC)
      departureDt = istToUtc(req.body.travel_date, '10:00');
    }
    if (!arrivalDt) {
      // travel_date + 3 days at 09:00:00 IST (converted to UTC)
      const travelDateObj = new Date(req.body.travel_date);
      const arrivalDateObj = new Date(travelDateObj.setDate(travelDateObj.getDate() + 3));
      const arrivalDateStr = arrivalDateObj.toISOString().split('T')[0];
      arrivalDt = istToUtc(arrivalDateStr, '09:00');
    }

    // Journey overlap check — locks the IRCTC ID for the full train duration
    // All passengers on a confirmed PNR are locked from departure to arrival.
    // They cannot book another Tatkal ticket whose travel window overlaps.
    try {
      // Resolve which passengers have RailSaathi accounts
      const passengerUserIds = await resolvePassengerUserIds(req.body.passengers, supabase);
      // Always include the account holder
      if (!passengerUserIds.includes(userId)) passengerUserIds.push(userId);

      // Fetch existing locks for all resolved passengers
      const { data: existingLocks, error: lockErr } = await supabase
        .from('tatkal_journey_locks')
        .select('departure_datetime, arrival_datetime, pnr')
        .in('locked_user_id', passengerUserIds);

      if (lockErr) throw lockErr;

      // Pure overlap check — no DB call inside
      const overlap = checkJourneyOverlap(departureDt, arrivalDt, existingLocks || []);
      if (overlap.overlaps) {
        return res.status(409).json({
          error: `You already have a confirmed Tatkal journey during this time window (PNR: ${overlap.conflictingPNR}, ${overlap.conflictWindow}). You cannot book another Tatkal ticket for an overlapping journey.`,
          code: 'JOURNEY_OVERLAP_LOCK'
        });
      }
    } catch (overlapErr) {
      return sendError(res, overlapErr, 'OVERLAP_CHECK_ERROR', 'Failed to validate journey overlap.', 500, 'PREFILL_OVERLAP');
    }

    // Urgency Score and Fire Time calculations
    const userCreatedAt = new Date(user.created_at);
    const diffYears = today.getFullYear() - userCreatedAt.getFullYear();
    const diffMonths = today.getMonth() - userCreatedAt.getMonth();
    const accountAgeMonths = Math.max(0, diffYears * 12 + diffMonths);

    const urgencyScore = req.body.is_urgent
      ? calculateUrgencyScore(req.body.urgency_reason, !!req.body.urgency_document_url, accountAgeMonths)
      : 0;

    const fireTime = calculateFireTime(req.body.travel_date, req.body.class);

    // Database insertion
    const { data: request, error: insErr } = await supabase
      .from('tatkal_requests')
      .insert([{
        user_id: userId,
        from_station: req.body.from_station,
        to_station: req.body.to_station,
        travel_date: req.body.travel_date,
        train_number: req.body.train_number || null,
        class: req.body.class,
        passengers: req.body.passengers,
        is_urgent: !!req.body.is_urgent,
        urgency_reason: req.body.is_urgent ? req.body.urgency_reason : null,
        urgency_document_url: req.body.is_urgent ? req.body.urgency_document_url : null,
        urgency_score: urgencyScore,
        scheduled_fire_time: fireTime,
        status: 'PENDING',
        booking_date: bookingDate,
        departure_datetime: departureDt,
        arrival_datetime: arrivalDt
      }])
      .select()
      .single();

    if (insErr) {
      if (insErr.code === '23505') {
        return res.status(409).json({ error: "You already have an active Tatkal request for today.", code: 'DUPLICATE_REQUEST' });
      }
      return sendError(res, insErr, 'DATABASE_ERROR', 'Failed to record pre-fill request.', 500, 'PREFILL_INSERT');
    }

    return res.status(201).json({
      data: {
        id: request.id,
        status: request.status,
        scheduled_fire_time: request.scheduled_fire_time,
        urgency_score: parseFloat(request.urgency_score),
        from_station: request.from_station,
        to_station: request.to_station,
        travel_date: request.travel_date,
        class: request.class,
        passengers: request.passengers,
        is_urgent: request.is_urgent
      },
      message: formatFireTimeMessage(fireTime, req.body.class)
    });

  } catch (err) {
    return sendError(res, err, 'SERVER_ERROR', 'An unexpected error occurred.', 500, 'PREFILL_UNCAUGHT');
  }
});

// Mount sub-routers (split for 300-line compliance)
// Requests sub-router: my-requests, cancel, get-by-id, fire-endpoint
const requestsRouter = require('./tatkal-requests');
router.use('/', requestsRouter);

// Surrender sub-router: surrender market endpoints
const surrenderRouter = require('./tatkal-surrenders');
router.use('/', surrenderRouter);

// Profiles sub-router: link profiles and search profiles
const profilesRouter = require('./tatkal-profiles');
router.use('/', profilesRouter);

// TODO (Day 5): Tell Member 1 to add this line to index.js:
// app.use('/api/tatkal', require('./routes/tatkal'))

module.exports = router;

