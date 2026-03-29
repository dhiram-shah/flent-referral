# Flent Referral Engine — System Workflow

> Companion to PRD.md. Describes every data flow end-to-end: who triggers what, what the system does, what state changes and what notifications fire.

---

## Actors & Systems

| Actor | Role |
|-------|------|
| **Referrer** | Existing/prospective Flent tenant who shares their code |
| **Referee** | Friend who fills the Typeform inquiry using a referral code |
| **Admin** | Flent ops team — manages fulfillment, reviews, disqualifications |
| **Typeform** | Inquiry form where referees enter the referral code |
| **HubSpot** | CRM where sales manages deals and tenant lifecycle |

---

## Flow 1 — Referrer Sign Up

```
Referrer → /signup form → POST /api/auth/signup
         → OTP email sent (Resend, async via after())
         → Referrer enters OTP → POST /api/auth/verify-otp
         → Referrer record created + ReferrerProgress(streak=0, lifetime=0)
         → Unique referral code generated (name-based slug + collision retry)
         → JWT cookie set (flent_ref_token, 30 days)
         → Welcome notification fired (email + WhatsApp, parallel, async)
         → window.location.href = /dashboard
```

**Edge cases handled:**
- Email or phone already registered → OTP sent for re-login (no duplicate account)
- Account disqualified → 403, directed to sales@flent.in
- OTP cooldown: 60s between requests (`createOtpSession` throws `COOLDOWN:N`)
- Referral code collision → retry up to 10 times, then error

---

## Flow 2 — Referrer Login (Returning User)

```
Referrer → /login → enters email → POST /api/auth/login
         → validates email exists in DB
         → OTP sent via Resend
         → enters OTP → POST /api/auth/verify-login
         → JWT cookie refreshed
         → window.location.href = /dashboard
```

**Note:** Login and signup share the same OTP cooldown system. Proxy (`src/proxy.ts`) guards `/dashboard` — must have valid `flent_ref_token` cookie.

---

## Flow 3 — Tenant Auto-Enrollment (HubSpot → Referrer)

Existing tenants are automatically enrolled as referrers when HubSpot marks them as customers.

```
HubSpot: contact.creation  OR  lifecyclestage → "customer"
         → POST /api/webhooks/hubspot (HMAC-SHA256 verified, 5-min timestamp window)
         → Fetch contact from HubSpot API (firstname, lastname, email, phone)
         → Check: already a referrer? → skip
         → Create Referrer (isTenant: true) + ReferrerProgress + unique referral code
         → Welcome notification (email + WhatsApp)
```

Tenants never need to sign up manually — they receive their code and can log in via `/login`.

---

## Flow 4 — Code Sharing

```
Referrer dashboard → copies code to clipboard  OR  clicks "Share on WhatsApp"
WhatsApp message: "...use my referral code *{CODE}* when you enquire..."
```

The code is a short alphanumeric slug (e.g. `RAHUL7F`). It is entered by the referee directly in the Typeform inquiry form.

---

## Flow 5 — Friend Inquiry (Referral Created)

When a friend submits the Typeform inquiry form with a referral code:

```
Referee → fills Typeform (name, phone, email, referral code field)
        → Typeform fires webhook → POST /api/webhooks/typeform
        → Signature verified (HMAC-SHA256, TYPEFORM_WEBHOOK_SECRET)
        → Extract referral code from answers (TYPEFORM_REFERRAL_CODE_FIELD_ID)
```

**Validations (in order):**
1. No referral code entered → silently skip (not a referred lead, that's OK)
2. Code not found / referrer inactive / disqualified → skip
3. Self-referral (referee phone or email matches referrer) → create Referral with `isDisqualified: true`, note: "Self-referral detected"
4. Duplicate phone (same phone already has a referral) → skip

**On success:**
```
→ Referral created (status: INTERESTED, referrerId linked)
→ Notification: referrer notified via email + WhatsApp ("Someone interested!")
→ Dashboard: referral appears as "Interested"
```

---

## Flow 6 — Deal Progression via HubSpot

All referral status transitions are driven by deal stage changes in HubSpot CRM. The sales team never touches the referral engine — it updates automatically.

### 6a — Agreement Signed

```
HubSpot: deal stage → "agreement_signed"  (HUBSPOT_STAGE_AGREEMENT_SIGNED env var)
       → POST /api/webhooks/hubspot
       → Lookup: Referral by hubspotId (deal ID)
       → Guard: status must be INTERESTED, not disqualified
       → Update: Referral status → AGREEMENT_SIGNED, signedAt = now
       → Notification: referrer notified via email + WhatsApp
       → Dashboard: referral shows "Agreement Signed"
```

### 6b — Tenancy Completed (Move-In)

This is the key earning event — when a referred friend actually moves in.

```
HubSpot: deal stage → "tenancy_completed"  (HUBSPOT_STAGE_COMPLETED env var)
       → POST /api/webhooks/hubspot
       → Lookup: Referral by hubspotId
       → Guard: not already COMPLETED, not disqualified
       → Transaction (atomic):
           Referral status → COMPLETED, completedAt = now
           ReferrerProgress: currentStreakCount += 1, lifetimeCompletedCount += 1
       → Check: does new streakCount exactly match any MilestoneConfig.referralsRequired?
       → Notification: referrer notified via email + WhatsApp
           — if milestone unlocked: message includes reward name
           — if not: celebrates the move-in without mentioning a specific reward
       → Dashboard: referral shows "Completed", eligible milestone cards become claimable
```

**Streak logic:**
- `currentStreakCount` = referrals completed since last redemption (resets on claim)
- `lifetimeCompletedCount` = all-time completed count (never resets)

---

## Flow 7 — Reward Redemption

Once a referrer's streak meets or exceeds a milestone's `referralsRequired`, that milestone is claimable.

```
Dashboard: milestone card shows "Unlocked" (eligible state)
         → Referrer hovers → "Claim now →" appears
         → Referrer clicks → modal opens for that specific milestone
         → Modal shows: tier, reward name, value, streak-reset warning
         → Referrer clicks "Claim this reward" → POST /api/redemptions
```

**API validations:**
1. Auth check (JWT cookie)
2. Milestone exists
3. No existing PENDING redemption (only one in-flight at a time)
4. streak >= milestone.referralsRequired
5. If `requiresExtraInfo: true` → extraInfo must be provided

**On success (atomic transaction):**
```
→ Redemption created (status: PENDING, milestoneId, referrerId)
→ ReferrerProgress: currentStreakCount = 0, lastResetAt = now
→ Notification: redemption confirmation via email + WhatsApp
→ Dashboard: milestone shows "Pending", other eligible cards show "Unlocked · blocked"
```

### 7a — Admin Fulfilment

```
Admin → /admin dashboard → views pending redemptions
      → Fulfils reward (physical/digital delivery)
      → Marks redemption status → FULFILLED via PATCH /api/admin/redemptions/[id]
      → Dashboard history strip: shows fulfilled reward with date + value
      → Stats: "Rewards claimed" counter increments
```

---

## Notification Matrix

| Event | Trigger | Email | WhatsApp |
|-------|---------|-------|----------|
| Welcome | Signup or auto-enroll | ✓ | ✓ |
| Referral interested | Typeform submission | ✓ | ✓ |
| Agreement signed | HubSpot deal stage | ✓ | ✓ |
| Tenancy completed | HubSpot deal stage | ✓ | ✓ (includes reward name if unlocked) |
| Redemption confirmed | Claim submitted | ✓ | ✓ |

All notifications fire via `src/lib/notifications.ts` — email (Resend) + WhatsApp (Superchat) in parallel using `Promise.allSettled`. Results logged to `NotificationLog` table. Failures are logged but never throw — they do not block the main flow.

---

## Data State Machines

### Referral Status

```
INTERESTED → AGREEMENT_SIGNED → COMPLETED
     ↓               ↓               ↓
(isDisqualified = true at any stage — set by admin or self-referral detection)
```

### Redemption Status

```
PENDING → FULFILLED
        → REJECTED  (admin can reject with notes)
```

### Referrer Progress

```
currentStreakCount: 0 → +1 per COMPLETED referral → reset to 0 on redemption
lifetimeCompletedCount: 0 → +1 per COMPLETED referral → never resets
```

---

## Fraud & Guard Rails

| Check | Where | Behaviour |
|-------|-------|-----------|
| Self-referral (phone or email match) | Typeform webhook | Creates disqualified referral — logged but no notification |
| Duplicate referee phone | Typeform webhook | Silent skip — first referrer keeps the credit |
| Invalid/inactive referral code | Typeform webhook | Silent skip — never blocks form submission |
| OTP cooldown (60s) | Signup + Login API | 429 with `cooldown: N` seconds remaining |
| OTP max attempts | `verifyOtp` | Returns `expired` error after N failures |
| Pending redemption exists | Redemptions API | 409 — cannot claim while one is in-flight |
| Disqualified referrer | Signup, Typeform, HubSpot | Blocked at each entry point |
| Expired HubSpot webhook | HubSpot webhook | Rejected if timestamp > 5 minutes old |

---

## Environment Variables — Flow Dependencies

| Var | Used In |
|-----|---------|
| `TYPEFORM_WEBHOOK_SECRET` | Typeform signature verification |
| `TYPEFORM_REFERRAL_CODE_FIELD_ID` | Extracting code from form answers |
| `HUBSPOT_WEBHOOK_SECRET` | HubSpot signature verification |
| `HUBSPOT_ACCESS_TOKEN` | Fetching contact details for auto-enroll |
| `HUBSPOT_STAGE_AGREEMENT_SIGNED` | Deal stage string match |
| `HUBSPOT_STAGE_COMPLETED` | Deal stage string match |
| `RESEND_FROM_EMAIL` | Email sender (`referrals@email.flent.in`) |
| `DATABASE_URL` | Supabase Session Pooler, IPv4, port 5432 |
| `JWT_SECRET` | Signing referrer + admin JWT tokens |
