# Flent Referral Engine — System Workflow

> Companion to PRD.md. Describes every data flow end-to-end: who triggers what, what the system does, what state changes and what notifications fire.

---

## Actors & Systems

| Actor | Role |
|-------|------|
| **Referrer** | Existing/prospective Flent tenant who shares their code |
| **Referee** | Friend who fills the Typeform inquiry using a referral code |
| **Admin / Marketing** | Flent ops team — manages fulfillment, reviews, configures rewards, tiers, and comms copy |
| **Typeform** | Inquiry form where referees enter the referral code |
| **HubSpot** | CRM where sales manages tenant lifecycle — contact properties drive referral status (no deals) |

---

## Flow 1 — Referrer Sign Up

```
Referrer → /signup form → POST /api/auth/signup
         → OTP email sent (Resend, async via after())
         → Referrer enters OTP → POST /api/auth/verify-otp
         → Referrer record created + ReferrerProgress(streak=0, lifetime=0)
         → leaderboardOptIn defaults to false
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
         → OTP sent via Resend (async after())
         → enters OTP → POST /api/auth/verify-login
         → JWT cookie refreshed
         → window.location.href = /dashboard
```

Proxy (`src/proxy.ts`) guards `/dashboard` — must have valid `flent_ref_token` cookie. In `NODE_ENV !== 'production'`, proxy is bypassed and stub data is returned.

---

## Flow 3 — Tenant Auto-Enrollment (HubSpot → Referrer)

```
HubSpot: contact.propertyChange  →  customer_type = "Tenant"
         → POST /api/webhooks/hubspot (HMAC-SHA256 verified, 5-min timestamp window)
         → Fetch contact from HubSpot API (firstname, lastname, email, phone)
         → Check: email or phone already a referrer?
             YES, isTenant already true → skip (no-op)
             YES, isTenant false → UPDATE isTenant = true (self sign-up upgraded to tenant)
             NO → Create Referrer (isTenant: true, leaderboardOptIn: false)
                  + ReferrerProgress + unique code
                  → Welcome notification (email + WhatsApp)
```

**Why `customer_type` not `contact.creation`:**
- `contact.creation` fires for every new lead — prospects, vendors, anyone
- `lifecyclestage = customer` is set too early in some sales flows
- `customer_type = Tenant` is set only when ops confirms tenancy — the definitive signal

Tenants never need to sign up manually — they receive their code by notification and log in via `/login`.
Referrers who self-signed up and later become tenants are upgraded in-place; no duplicate account is created.

---

## Flow 4 — Code Sharing (WhatsApp + Instagram)

```
Referrer dashboard → opens in two ways:

WhatsApp:
  → clicks "WhatsApp" button
  → window.open(`https://wa.me/?text=${encodeURIComponent(data.waShareText)}`)
  → waShareText rendered server-side in /api/referrers/me with:
      referralCode, lifetimeCount, tierBrag
  → template: ui_wa_share_text (editable in Admin → Comms)
  → includes: referral count, code, tier brag line (if tier earned)

Instagram:
  → clicks "Instagram" button
  → tries navigator.share({ text: igShareText }) [mobile Web Share API]
  → if unavailable/cancelled: copies igShareText to clipboard + opens instagram.com
  → shows "Caption copied!" for 3s
  → igShareText rendered server-side same as WA but uses ui_instagram_share_text template
  → includes: referral count, code, @flentliving mention, tier brag
```

**Share text includes dynamically:**
- `{{referralCode}}` — user's unique code (e.g. `PRIYA7`)
- `{{lifetimeCount}}` — total completed referrals ever (e.g. `5`)
- `{{tierBrag}}` — `""` if no tier; `"\n\nAs a Flent Ambassador, I've personally vouched for these homes."` if tier earned

---

## Flow 5 — Friend Inquiry (Referral Created)

```
Referee → fills Typeform (name, phone, email, referral code field)
        → Typeform fires webhook → POST /api/webhooks/typeform
        → Signature verified (HMAC-SHA256, TYPEFORM_WEBHOOK_SECRET)
        → Extract referral code from answers (TYPEFORM_REFERRAL_CODE_FIELD_ID)
```

**Validations (in order):**
1. No referral code entered → silently skip
2. Code not found / referrer inactive / disqualified → skip
3. Self-referral (referee phone or email matches referrer) → create Referral with `isDisqualified: true`
4. Duplicate phone (same phone already has a referral) → skip

**On success:**
```
→ Referral created (status: INTERESTED, referrerId linked)
→ Notification: referrer notified via email + WhatsApp
→ Dashboard: referral appears as "Interested"
```

---

## Flow 6 — Referral Progression via HubSpot

Match key: `refereeEmail` (captured in Typeform) = HubSpot contact email.
Set up via Private App → Webhooks tab. Subscribes to `contact.propertyChange` for 3 properties.

### 6a — Token Paid → Agreement Signed

```
HubSpot: sales marks token_payment_status = "Paid" on contact
       → POST /api/webhooks/hubspot (HMAC-SHA256 verified)
       → fetchContact(contactId) → get email
       → findReferralByEmail(email)
           orderBy: createdAt desc, exclude COMPLETED/disqualified
       → Guard: status must be INTERESTED
       → Update: Referral → AGREEMENT_SIGNED, signedAt = now
       → Notification: referrer notified via email + WhatsApp
```

### 6b — Both Payments Settled + Move-In Date Passed → Completed

```
HubSpot: sales marks first_month_rent = "Paid" OR tenant_security_deposit = "Paid"
       → POST /api/webhooks/hubspot
       → fetchContact(contactId) → check both payment fields + move_in_date
       → Guard: both must be "Paid" AND move_in_date ≤ today
       → Guard: referral status must be AGREEMENT_SIGNED
       → markReferralCompleted(referral):
           Atomic transaction:
             Referral → COMPLETED, completedAt = now
             ReferrerProgress: currentStreakCount += 1, lifetimeCompletedCount += 1 (upsert)
           Check: does new streakCount match any MilestoneConfig.referralsRequired?
           Notification: referrer notified (includes reward name if milestone unlocked)
       → Dashboard: referral shows "Completed"
       → Ambassador tier re-evaluated on next dashboard load (from lifetimeCompletedCount)
       → Quarterly leaderboard position updated (live from completedAt)
```

### 6c — Daily Cron Safety Net (01:00 UTC)

```
Vercel Cron → GET /api/cron/check-moveins (Bearer CRON_SECRET)
           → DB: all AGREEMENT_SIGNED referrals where isDisqualified=false
           → For each: searchContactByEmail(refereeEmail) → HubSpot Search API
           → Check: both payments Paid + move_in_date ≤ today
           → If yes: markReferralCompleted(referral)
           → Returns: { processed, completed, errors }
```

Catches referrals where the payment webhook fired before move_in_date arrived, or where HubSpot webhooks were missed.

**Streak vs lifetime:**
- `currentStreakCount` = referrals completed since last redemption (resets on claim)
- `lifetimeCompletedCount` = all-time total (never resets) — powers ambassador tier

---

## Flow 7 — Reward Redemption

```
Dashboard: milestone card shows "Unlocked"
         → hover → "Claim now →" appears
         → click → modal (tier info, reward name, streak-reset warning)
         → "Claim this reward" → POST /api/redemptions
         → Validations: auth, milestone exists, no pending redemption, streak >= required
         → Atomic transaction:
             Redemption created (status: PENDING)
             ReferrerProgress: currentStreakCount = 0, lastResetAt = now
         → Notification: redemption confirmation (email + WhatsApp)
         → Dashboard: milestone shows "Pending"; other eligible cards show "Unlocked · blocked"
```

### 7a — Admin Fulfillment

```
Admin → /admin → Redemptions tab → views pending queue
      → Fulfils reward (physical/digital delivery)
      → PATCH /api/admin/redemptions/[id] → status → FULFILLED
      → Dashboard history strip: fulfilled reward with date + value
```

---

## Flow 8 — Ambassador Tier Assignment

Tiers are **never stored on the Referrer record** — always computed at read time.

```
GET /api/referrers/me (or /api/leaderboard)
   → getAllTiers() → fetches AmbassadorTier table, seeds defaults if empty
     Defaults: Scout (1+), Connector (3+), Ambassador (6+)
   → computeTier(lifetimeCompletedCount, tiers)
     → sorts tiers descending by minReferrals
     → returns first tier where lifetimeCount >= minReferrals
     → returns null if below Scout threshold
   → returned in response as: { name, colorToken }
   → also returns allTiers list (for tier ladder popover in dashboard)
   → tierBrag computed: "" or "\n\nAs a Flent {tier.name}..."
```

Admin changes to tier thresholds (via Admin → Tiers tab) take effect immediately on the next API call — no migration or cache invalidation needed.

---

## Flow 9 — Leaderboard Opt-In / Opt-Out

```
Dashboard: Quarterly Standing card → "Show my name on the leaderboard" toggle
         → user clicks toggle
         → PATCH /api/referrers/me { leaderboardOptIn: true/false }
         → Referrer.leaderboardOptIn updated in DB
         → GET /api/leaderboard refetched → name appears/disappears in list
         → Other referrers see first name (if opted-in) or "Anonymous"
```

Default is `false` — consent required. Admins can also bulk opt-in known power referrers via SQL (see `docs/leaderboard-backfill.md`).

---

## Flow 10 — Quarterly Leaderboard Computation

```
GET /api/leaderboard
   → getCurrentQuarter() → { start, end, label, resetsOn }
     Calendar quarters: Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec
   → prisma.referral.groupBy(['referrerId'])
     WHERE status=COMPLETED, completedAt in [start, end), isDisqualified=false
     ORDER BY _count DESC
   → top 20 referrerIds
   → fetch Referrer (leaderboardOptIn, name) for those 20
   → fetch ReferrerProgress (lifetimeCount) for tier badge computation
   → build entries: rank, displayName (first name if opted-in, else null), quarterlyCount, tierName
   → Response: { quarter, resetsOn, totalParticipants, entries[] }

GET /api/referrers/me (auth-required)
   → also computes: userQuarterlyEntry position in sorted groups
   → returns: { rank, total, quarterlyCount, quarter, resetsOn }
   → dashboard shows "You're #N of X referrers this quarter"
```

---

## Flow 11 — Marketing Updates Comms Copy

All copy changes require zero engineering involvement:

```
Marketing → Admin → Comms tab
          → edit any of 14 templates (email body, WA template name, UI text)
          → PATCH /api/admin/comms/[key] { subject, body }
          → CommTemplate updated in DB, updatedBy/updatedAt recorded
          → next send uses new template (no cache — getTemplate() fetches fresh from DB)

Marketing → Admin → Comms → "Community Stat (Home Page)"
          → edit body to "1,200+" or whatever the current count is
          → ReferralStatBand server component picks up on next page render
          → home page shows updated count (no deploy needed)
```

---

## Notification Matrix

| Event | Trigger | Email template | WhatsApp template |
|-------|---------|----------------|-------------------|
| Welcome | Signup or auto-enroll | `email_welcome` | `wa_template_welcome` |
| Referral interested | Typeform submission | `email_referral_interested` | `wa_template_interested` |
| Agreement signed | HubSpot deal stage | `email_referral_signed` | `wa_template_signed` |
| Tenancy completed | HubSpot deal stage | `email_referral_completed` | `wa_template_completed` |
| Redemption confirmed | Claim submitted | `email_redemption_confirmed` | `wa_template_redeemed` |

All notifications fire via `src/lib/notifications.ts` — email (Resend) + WhatsApp (Superchat) in parallel via `Promise.allSettled`. Failures are logged to `NotificationLog` but never throw.

---

## Data State Machines

### Referral Status

```
INTERESTED → AGREEMENT_SIGNED → COMPLETED
     ↓               ↓               ↓
(isDisqualified = true at any stage — admin or self-referral detection)
```

### Redemption Status

```
PENDING → FULFILLED
        → REJECTED  (admin can reject with notes)
```

### Referrer Progress

```
currentStreakCount:      0 → +1 per COMPLETED referral → reset to 0 on redemption
lifetimeCompletedCount: 0 → +1 per COMPLETED referral → never resets
```

### Ambassador Tier (derived, not stored)

```
null (< 1 lifetime) → Scout (1+) → Connector (3+) → Ambassador (6+)
Thresholds configurable in Admin → Tiers. Computed fresh on every /api/referrers/me call.
```

### Leaderboard Opt-In

```
false (default) → true (user consents via dashboard toggle or admin SQL bulk update)
                → false (user opts out anytime)
```

---

## Fraud & Guard Rails

| Check | Where | Behaviour |
|-------|-------|-----------|
| Self-referral (phone or email match) | Typeform webhook | Creates disqualified referral — logged, no notification |
| Duplicate referee phone | Typeform webhook | Silent skip — first referrer keeps credit |
| Invalid/inactive referral code | Typeform webhook | Silent skip — never blocks form submission |
| OTP cooldown (60s) | Signup + Login API | 429 with `cooldown: N` seconds remaining |
| OTP max attempts | `verifyOtp` | Returns `expired` error after N failures |
| Pending redemption exists | Redemptions API | 409 — cannot claim while one is in-flight |
| Disqualified referrer | Signup, Typeform, HubSpot | Blocked at each entry point |
| Expired HubSpot webhook | HubSpot webhook | Rejected if timestamp > 5 minutes old |
| Admin auth on tier/comms APIs | All `/api/admin/*` routes | 401 if no valid `flent_admin_token` cookie |

---

## Environment Variables — Flow Dependencies

| Var | Used In |
|-----|---------|
| `DATABASE_URL` | Supabase Session Pooler, IPv4, port **5432** (not 6543) |
| `JWT_SECRET` | Signing `flent_ref_token` (referrer JWT, 30d) |
| `ADMIN_JWT_SECRET` | Signing `flent_admin_token` (admin JWT, 8h) |
| `RESEND_API_KEY` | Email delivery via Resend |
| `RESEND_FROM_EMAIL` | Sender address (`referrals@email.flent.in`) |
| `SUPERCHAT_API_KEY` | WhatsApp delivery via Superchat |
| `SUPERCHAT_WORKSPACE_ID` | Superchat workspace identifier |
| `HUBSPOT_WEBHOOK_SECRET` | HMAC-SHA256 signature verification on incoming HubSpot webhooks |
| `HUBSPOT_ACCESS_TOKEN` | Fetching contact properties after webhook events |
| `CRON_SECRET` | Bearer token securing `/api/cron/check-moveins` |
| `TYPEFORM_WEBHOOK_SECRET` | Typeform signature verification |
| `TYPEFORM_REFERRAL_CODE_FIELD_ID` | Field ID for referral code answer in Typeform |
| `NEXT_PUBLIC_APP_URL` | Dashboard URL in email links (default: `https://flent.in/referral-program`) |
