# Biometric Verification — Architecture Hold

## Status: ON HOLD — DO NOT IMPLEMENT

---

### Why it was paused

- **Hardware failure risk at stations**: If a fingerprint scanner malfunctions, gives a false negative, or loses power at a railway platform, a legitimate passenger with a valid ticket would be denied boarding. This outcome is worse than the tout problem we are solving.
- **High fraud surface**: Spoofed fingerprint overlays (silicone casts, conductive ink), device tampering, and relay attacks make travel-time biometric verification unreliable without enterprise-grade anti-spoof hardware — which Indian railway platforms do not have.
- **Government approval dependency**: UIDAI Aadhaar eKYC API integration requires formal approval from the Unique Identification Authority of India. This is a multi-month process involving legal agreements, security audits, and compliance documentation.
- **Out of scope for a 6-day hackathon**: Even if approvals existed, integrating hardware SDKs, testing across 50+ Android/iOS device models, and handling edge cases (wet fingers, cuts, elderly passengers with worn prints) is not feasible in the build timeline.

---

### What it was intended to do

Fingerprint scan at boarding would confirm the passenger matches the Tatkal booking account holder, preventing proxy boarding where touts book tickets under one identity but send a different person to travel. The biometric check was envisioned as the final verification gate — after the ticket is confirmed but before the passenger boards.

---

### Why we are NOT using fingerprint during travel

The fundamental problem: **a false negative strands a legitimate passenger**.

If the scanner fails, reads incorrectly (common with wet, oily, or aged fingerprints), or the platform device loses connectivity, the passenger has a valid ticket but cannot board. They are now stranded at the station with no recourse. This creates a worse user experience than the tout problem we are trying to solve — touts are a systemic issue, but stranding an individual passenger is an immediate, personal crisis.

Railway platforms are high-stress, high-noise, time-pressured environments. Adding a biometric gate to this introduces a single point of failure with catastrophic consequences for the individual.

---

### What we use instead (current approach)

Our three-layer anti-tout system achieves the core objective without biometric risk:

1. **Account holder mandate**: The account holder's name (from the `users` table) must appear in the passenger list. Comparison is case-insensitive and trimmed. Enforced at the API level before any booking is accepted.

2. **Journey overlap lock**: When a booking reaches CONFIRMED status, all passengers on that PNR who have RailSaathi accounts are locked for the full travel duration (departure → arrival). They cannot book another Tatkal ticket with an overlapping time window. This prevents a single identity from being used across multiple simultaneous journeys.

3. **Anti-hoarding DB constraint**: A unique index on `(user_id, booking_date)` plus an API-level duplicate check ensures one Tatkal request per user per booking window. This stops bulk booking by touts.

Together, these three mechanisms block the primary tout strategies (identity reuse, bulk booking, proxy travel) without requiring any hardware at the platform.

---

### Production path (if biometric is revisited)

If biometric verification is revisited post-hackathon, the approved approach is:

**UIDAI eKYC at account creation time only — NOT at travel time.**

1. During RailSaathi account signup, the user completes a one-time Aadhaar eKYC verification via the UIDAI API.
2. This links their verified identity to their RailSaathi account permanently.
3. At booking time, the system checks the verified identity flag — no hardware scan needed.
4. At travel time, the existing PNR + ID check (which Indian Railways already performs) is sufficient.

This approach eliminates the platform-failure risk entirely because:
- Verification happens once, in a controlled environment (user's own phone)
- No hardware dependency at stations
- No real-time API call during boarding

**UIDAI eKYC API application**: https://resident.uidai.gov.in/eKYC

---

### Files to touch when this is unblocked

> ⚠️ **DO NOT modify these files for biometric until the hold is formally lifted.**

| File | Change |
|---|---|
| `services/api/src/services/tatkal-service.js` | Uncomment `verifyBiometric()` stub, implement UIDAI eKYC call |
| `services/api/src/routes/tatkal.js` | Add biometric verification step in prefill flow |
| `apps/mobile/src/screens/tatkal/PreFillFormScreen.js` | Add biometric verification step UI (eKYC redirect) |
| `supabase/migrations/` | Add `biometric_verified` boolean column to `users` table |

---

*Document created: 2026-06-09*
*Author: Member 2 (Tatkal module)*
*Review status: Approved for hold by team*
