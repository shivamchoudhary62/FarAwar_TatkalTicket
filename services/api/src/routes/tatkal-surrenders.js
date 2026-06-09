const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const supabase = require('../db/supabase-client');

const router = express.Router();

// Helper to handle and send errors cleanly without exposing raw DB details
const sendError = (res, err, code, msg = "An unexpected error occurred.", status = 500, logCtx = "") => {
  if (logCtx) console.error(`[${logCtx}]`, err);
  return res.status(status).json({ error: msg, code });
};

const surrenderValidators = [
  body('pnr').notEmpty().isLength({ max: 10 }).trim(),
  body('from_station').notEmpty().isLength({ max: 7 }).trim().toUpperCase(),
  body('to_station').notEmpty().isLength({ max: 7 }).trim().toUpperCase(),
  body('train_number').notEmpty().isLength({ max: 10 }).trim().withMessage('train_number is required'),
  body('travel_date').isISO8601(),
  body('class').isIn(['SL', '3A', '2A', '1A', 'GEN'])
];

// POST /api/tatkal/surrender
router.post('/surrender', verifyToken, surrenderValidators, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: `Validation failed: ${errors.array().map(e => e.msg || e.path).join(', ')}`,
        code: 'VALIDATION_ERROR'
      });
    }

    const userId = req.user.user_id;

    const { data: newSurrender, error } = await supabase
      .from('tatkal_surrenders')
      .insert([{
        owner_user_id: userId,
        pnr: req.body.pnr,
        from_station: req.body.from_station,
        to_station: req.body.to_station,
        travel_date: req.body.travel_date,
        train_number: req.body.train_number,
        class: req.body.class,
        status: 'LISTED',
        listed_at: new Date()
      }])
      .select()
      .single();

    if (error) {
      return sendError(res, error, 'DATABASE_ERROR', 'Failed to list ticket for surrender.', 500, 'SURRENDER_INSERT');
    }

    return res.status(201).json({
      data: newSurrender,
      message: "Ticket listed for surrender."
    });

  } catch (err) {
    return sendError(res, err, 'SERVER_ERROR', 'An unexpected error occurred.', 500, 'SURRENDER_UNCAUGHT');
  }
});

// GET /api/tatkal/surrenders
router.get('/surrenders', verifyToken, async (req, res) => {
  try {
    let query = supabase
      .from('tatkal_surrenders')
      .select('*')
      .eq('status', 'LISTED');

    if (req.query.from) query = query.eq('from_station', req.query.from.trim().toUpperCase());
    if (req.query.to) query = query.eq('to_station', req.query.to.trim().toUpperCase());
    if (req.query.date) query = query.eq('travel_date', req.query.date.trim());
    if (req.query.class) query = query.eq('class', req.query.class.trim().toUpperCase());

    const { data, error } = await query.order('listed_at', { ascending: false });

    if (error) {
      return sendError(res, error, 'DATABASE_ERROR', 'Failed to fetch surrender listings.', 500, 'SURRENDERS_GET');
    }

    return res.status(200).json({
      data: data || [],
      message: "ok"
    });

  } catch (err) {
    return sendError(res, err, 'SERVER_ERROR', 'An unexpected error occurred.', 500, 'SURRENDERS_GET_UNCAUGHT');
  }
});

// POST /api/tatkal/surrenders/:id/request
router.post('/surrenders/:id/request', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const surrenderId = req.params.id;

    // Fetch surrender listing to verify existence and check status
    const { data: surrender, error: getErr } = await supabase
      .from('tatkal_surrenders')
      .select('*')
      .eq('id', surrenderId)
      .maybeSingle();

    if (getErr) return sendError(res, getErr, 'DATABASE_ERROR', 'Failed to verify surrender details.', 500, 'SURRENDER_REQ_GET');
    if (!surrender) return res.status(404).json({ error: "Surrender listing not found", code: 'NOT_FOUND' });

    if (surrender.status !== 'LISTED') {
      return res.status(400).json({ error: "This ticket is no longer available.", code: 'INVALID_STATUS' });
    }

    if (surrender.owner_user_id === userId) {
      return res.status(400).json({
        error: "Cannot request your own surrender listing.",
        code: 'SELF_REQUEST'
      });
    }

    // Update to MATCHED
    const { data: updated, error: updErr } = await supabase
      .from('tatkal_surrenders')
      .update({
        status: 'MATCHED',
        requester_user_id: userId,
        matched_at: new Date(),
        updated_at: new Date()
      })
      .eq('id', surrenderId)
      .select()
      .single();

    if (updErr) return sendError(res, updErr, 'DATABASE_ERROR', 'Failed to match ticket.', 500, 'SURRENDER_REQ_UPDATE');

    return res.status(200).json({
      data: updated,
      message: "Match confirmed! Contact details will follow."
    });

  } catch (err) {
    return sendError(res, err, 'SERVER_ERROR', 'An unexpected error occurred.', 500, 'SURRENDER_REQ_UNCAUGHT');
  }
});

module.exports = router;

/*
================================================================================
TEST SCENARIO: TICKET SURRENDER AND REALLOCATION MARKET
================================================================================
Flow:
1. User A lists a ticket for surrender (creates a listing in status 'LISTED').
2. User B queries the market for listed tickets and finds User A's listing.
3. User B requests User A's surrendered ticket (status updates to 'MATCHED').

CURL COMMANDS TO TEST:

# Step 1: User A lists a confirmed ticket
# (Replace USER_A_JWT_TOKEN with User A's JWT token)
curl -X POST http://localhost:3000/api/tatkal/surrender \
  -H "Authorization: Bearer USER_A_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '\''{
    "pnr": "4810239481",
    "from_station": "NDLS",
    "to_station": "MMCT",
    "travel_date": "2026-06-20",
    "train_number": "12951",
    "class": "3A"
  }'\''

# Step 2: User B queries the marketplace
# (Replace USER_B_JWT_TOKEN with User B's JWT token)
curl -X GET "http://localhost:3000/api/tatkal/surrenders?from=NDLS&to=MMCT&class=3A" \
  -H "Authorization: Bearer USER_B_JWT_TOKEN"

# Step 3: User B requests the ticket (by ID received from Step 2)
# (Replace LISTING_UUID with the "id" value from the Step 2 response)
curl -X POST http://localhost:3000/api/tatkal/surrenders/LISTING_UUID/request \
  -H "Authorization: Bearer USER_B_JWT_TOKEN"
================================================================================
*/
