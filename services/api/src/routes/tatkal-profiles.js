const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const supabase = require('../db/supabase-client');

const router = express.Router();

const sendError = (res, err, code, msg = "An unexpected error occurred.", status = 500, logCtx = "") => {
  if (logCtx) console.error(`[${logCtx}]`, err);
  return res.status(status).json({ error: msg, code });
};

// POST /api/tatkal/link-irctc
router.post('/link-irctc', verifyToken, [
  body('irctc_id').notEmpty().isLength({ min: 3, max: 35 }).isAlphanumeric().trim(),
  body('email').isEmail().normalizeEmail(),
  body('dob').isISO8601(),
  body('gender').isIn(['M', 'F', 'T']),
  body('marital_status').notEmpty().trim(),
  body('occupation').notEmpty().trim(),
  body('address').notEmpty().trim(),
  body('pin_code').notEmpty().trim(),
  body('state').notEmpty().trim(),
  body('city').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: `Validation failed: ${errors.array().map(e => e.msg || e.path).join(', ')}`,
        code: 'VALIDATION_ERROR'
      });
    }

    const userId = req.user.user_id;
    const {
      irctc_id, email, dob, gender, marital_status,
      occupation, address, pin_code, state, city
    } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({
        irctc_id: irctc_id.trim(),
        email: email.trim(),
        dob,
        gender,
        marital_status,
        occupation,
        address,
        pin_code,
        state,
        city,
        updated_at: new Date()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: "IRCTC ID or Email is already registered.", code: 'CONFLICT' });
      }
      return sendError(res, error, 'DATABASE_ERROR', 'Failed to link IRCTC profile.', 500, 'LINK_IRCTC');
    }

    return res.status(200).json({ data, message: "IRCTC account successfully linked." });
  } catch (err) {
    return sendError(res, err, 'SERVER_ERROR', 'An unexpected error occurred.', 500, 'LINK_IRCTC_UNCAUGHT');
  }
});

// GET /api/tatkal/passenger-by-irctc/:irctc_id
router.get('/passenger-by-irctc/:irctc_id', verifyToken, async (req, res) => {
  try {
    const { irctc_id } = req.params;
    if (!irctc_id) {
      return res.status(400).json({ error: "IRCTC ID is required", code: 'BAD_REQUEST' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('name, dob, gender, irctc_id')
      .eq('irctc_id', irctc_id.trim())
      .maybeSingle();

    if (error) {
      return sendError(res, error, 'DATABASE_ERROR', 'Failed to query passenger profile.', 500, 'PASSENGER_BY_IRCTC');
    }

    if (!user) {
      return res.status(404).json({ error: "Passenger profile not registered on RailSaathi.", code: 'NOT_FOUND' });
    }

    let age = '';
    if (user.dob) {
      const birthDate = new Date(user.dob);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    return res.status(200).json({
      data: {
        name: user.name,
        age: age || null,
        gender: user.gender,
        irctc_id: user.irctc_id
      },
      message: "ok"
    });
  } catch (err) {
    return sendError(res, err, 'SERVER_ERROR', 'An unexpected error occurred.', 500, 'PASSENGER_BY_IRCTC_UNCAUGHT');
  }
});

module.exports = router;
