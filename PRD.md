# Flent Referral Program — Product Requirements Document

**Version:** 2.0 · **Last updated:** April 2026
**Owner:** Dhiram Shah
**Interface:** https://flent-referral.vercel.app
**Status:** Phase 1 + Phase 2 (leaderboard & ambassador tiers) built & deployed

---

## 1. Overview

The Flent Referral Engine is a standalone web application that enables anyone — tenants and non-tenants — to refer friends to Flent co-living in Bangalore and earn milestone-based rewards. It replaces the informal, untracked referral flow previously handled via sales staff.

### Goals
- Self-serve referral loop requiring zero sales effort to administer
- Full visibility into referral pipeline for each referrer
- Progressive loyalty rewards — each completed referral builds toward a better reward
- Social gamification via ambassador tiers and quarterly leaderboard
- Marketing-controlled comms — all copy editable without a code deploy

---

## 2. User Roles

| Role | Description |
|------|-------------|
| **Referrer** | Anyone with a unique code — tenant or external. Signs up in under 60 seconds. |
| **Referee** | Friend referred by a referrer. Submits interest via Typeform embed on flent.in. |
| **Admin** | Flent ops team. Manages referrers, reviews redemptions, configures rewards and tiers. |
| **Marketing** | Uses Admin → Comms + Tiers tabs to edit all outbound copy and tier structure without engineering. |

---

## 3. What's Built

### 3.1 Public Landing Page (`/`)

A full marketing page explaining the referral program:

- Hero with referral CTA
- Stats bar (₹0 to join, unlimited referrals, X rewards)
- Animated marquee bands
- How It Works (3-step, IntersectionObserver stagger reveal)
- **Community Stat Band** — scroll-triggered counter animation showing total community referrals; number editable via Admin → Comms (`ui_community_stat`)
- Reward milestone roadmap (DB-driven, live tiers)
- Why your friends will love Flent — feature cards
- Social proof board (₹1Cr+ raised, 450+ tenants, 200+ items)
- FAQ accordion

### 3.2 Referrer Signup (`/signup`)

- Name, phone, email, city form
- Email OTP (6-digit, 10-minute expiry, 3-attempt limit)
- 60-second resend cooldown (server-enforced)
- Email fires async via `after()` — no blocking
- On verify: referral code generated, account created, welcome email + WhatsApp sent

### 3.3 Referrer Login (`/login`)

- Email-only entry → OTP
- 60s cooldown enforced
- Redirects to `/dashboard` after verify

### 3.4 Referrer Dashboard (`/dashboard`)

**Hero section (top):**
- Circle avatar badge (72px, tier-color ring + initial letter) — clickable to open tier ladder popover showing all tiers and user's current position
- "Hey, {Name}" serif greeting
- Referral code in neo-brutalist box with inline Copy button
- **WhatsApp** + **Instagram** share buttons side by side
  - WhatsApp: opens `wa.me/` with rendered share text (includes referral count + tier brag line)
  - Instagram: Web Share API on mobile; clipboard copy + opens Instagram on desktop; shows "Caption copied!" feedback
  - Both share texts editable by marketing via Admin → Comms (`ui_wa_share_text`, `ui_instagram_share_text`)

**Stats strip:**
- Current streak / Lifetime referrals / Rewards claimed

**Quarterly Standing card:**
- Quarterly rank ("You're #N of X referrers") + quarterly count
- Top-5 leaderboard list — opted-in users show first name + ambassador tier badge; others show "Anonymous"
- Opt-in toggle (pill switch) — "Show my name on the leaderboard" — consent-first, toggleable anytime

**Reward Journey:**
- Milestone cards in 4 states: locked / eligible (claimable) / eligible_blocked (another pending) / pending
- Hover state reveals "Claim now →"
- Redemption modal with streak-reset warning
- Rewards history strip + total earned value

**Referrals list:**
- All referrals with status (Interested / Agreement Signed / Completed)

### 3.5 Referral Submission (via Typeform webhook)

- Friend fills Typeform with referral code at flent.in
- `/api/webhooks/typeform` creates `Referral` (status: INTERESTED)
- Referrer notified via email + WhatsApp

### 3.6 HubSpot Integration

| HubSpot Event | Action |
|--------------|--------|
| Deal → `agreement_signed` | Referral → AGREEMENT_SIGNED · Referrer notified |
| Deal → `tenancy_completed` | Referral → COMPLETED · Streak +1 · Lifetime +1 · Referrer notified |
| Contact creation / lifecycle → `customer` | Auto-enroll tenant as referrer |

### 3.7 Ambassador Tier System

Recognition layer built on top of `lifetimeCompletedCount`:

| Tier | Default threshold | Badge color |
|------|-----------------|-------------|
| Scout | 1+ lifetime referrals | Blue |
| Connector | 3+ lifetime referrals | Green |
| Ambassador | 6+ lifetime referrals | Navy |

- Tier computed dynamically at read time — no stored column
- Badge shown on dashboard hero circle and quarterly leaderboard
- Tier brag line auto-appended to WA + Instagram share text ("As a Flent Ambassador...")
- All tier names, thresholds, and colors configurable in Admin → Tiers without deploy
- Leaderboard opt-in defaults to off — referrer must consent to show their name

### 3.8 Quarterly Leaderboard

- Resets each calendar quarter (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec)
- Ranked by completed referrals within the current quarter
- Top 20 displayed on each referrer's dashboard
- Opted-in users: first name + ambassador tier badge shown
- Non-opted-in: "Anonymous" placeholder
- Public endpoint (`/api/leaderboard`) — no auth required for reading
- #1 quarterly referrer earns a tangible additional gift (to be configured per quarter)
- Backfill guide at `docs/leaderboard-backfill.md` for historical data

### 3.9 Communications Dashboard (Admin → Comms)

All 14 outbound copy templates editable by marketing in real time — no deploy needed:

| Channel | Templates |
|---------|-----------|
| Email (6) | OTP, Welcome, Referral Interested, Agreement Signed, Referral Completed, Redemption Confirmed |
| WhatsApp (5) | Welcome, Interested, Signed, Completed, Redeemed |
| UI (3) | WhatsApp Share Sheet, Instagram Share Caption, Community Stat (home page number) |

Templates use `{{variable}}` placeholders rendered at send time. Share text templates support `{{referralCode}}`, `{{lifetimeCount}}`, `{{tierBrag}}` variables.

### 3.10 Admin Panel (`/admin`)

Six tabs, password-protected:

| Tab | Features |
|-----|----------|
| **Overview** | Total referrers, active, referrals by status, pending redemptions, recent signups |
| **Referrers** | Full list with streak/lifetime counts, search, disqualify/reactivate |
| **Redemptions** | Pending queue — mark fulfilled/rejected, add notes |
| **Milestones** | Create, edit, toggle active/inactive reward tiers |
| **Tiers** | Create/edit/delete ambassador tiers — name, referral threshold, color |
| **Comms** | Edit all 14 email/WA/UI templates with variable hints and last-edited metadata |

Admin credentials seeded via `npm run db:seed`:
- `demand@flent.in` — ADMIN role
- `marketing@flent.in` — VIEWER role
- Default password: `ChangeMe123!`

---

## 4. Technical Architecture

```
Next.js 16 (App Router) → Supabase PostgreSQL (Prisma 7)
                        → Resend (email, async via after())
                        → Superchat (WhatsApp)
                        ← HubSpot (webhooks — deal stages + tenant enrollment)
                        ← Typeform (webhooks — referee inquiries)
                        → Vercel (hosting)
```

**Data model (key tables):**
- `Referrer` — referral code, opt-in flag, tier (derived)
- `Referral` — status machine (INTERESTED → AGREEMENT_SIGNED → COMPLETED), completedAt for leaderboard
- `ReferrerProgress` — currentStreakCount, lifetimeCompletedCount
- `MilestoneConfig` — reward tiers, referralsRequired
- `Redemption` — PENDING → FULFILLED / REJECTED
- `AmbassadorTier` — name, minReferrals, colorToken, sortOrder (admin-configurable)
- `CommTemplate` — 14 editable copy keys across 3 channels
- `NotificationLog` — audit trail for all sent notifications

**Auth:**
- Referrers: email OTP → JWT cookie (`flent_ref_token`, 30d)
- Admins: password → JWT cookie (`flent_admin_token`, 8h)
- Route guard: `src/proxy.ts` protects `/dashboard` and `/admin`

---

## 5. Open Items Before Full Public Launch

### Copy review (required)
All copy is first-draft. Admin → Comms tab allows updates without deploy:

- [ ] Landing page hero tagline and sub-copy
- [ ] Marquee banner messages
- [ ] How It Works step descriptions
- [ ] FAQ questions and answers
- [ ] Email template bodies (editable via Admin → Comms)
- [ ] WhatsApp share text — update body in Admin → Comms to include `{{lifetimeCount}}` and `{{tierBrag}}`
- [ ] Instagram share text — auto-seeds on first admin visit; review body in Admin → Comms
- [ ] Community stat number — update `ui_community_stat` in Admin → Comms to the actual backfilled count (see `docs/leaderboard-backfill.md`)
- [ ] Ambassador tier brag line — update the `tierBrag` text in the API if the default phrasing needs adjustment

### UX / product gaps
- [ ] Mobile responsiveness audit
- [ ] "How do I refer someone?" inline guide on dashboard
- [ ] Password reset flow for admin users
- [ ] Referrer profile edit (phone number change)
- [ ] Shareable referral card image (story-format, auto-generated OG image for Instagram)

### Ops / admin
- [ ] Leaderboard backfill — run SQL from `docs/leaderboard-backfill.md` against production Supabase to load historical form-based referrals
- [ ] Update `ui_community_stat` CommTemplate to reflect real historical referral count
- [ ] Opt-in outreach — contact known power referrers to get consent for leaderboard display
- [ ] Bulk CSV export of referrers and redemptions
- [ ] Email deliverability audit — Resend domain warm-up for `email.flent.in`
- [ ] Quarterly leaderboard #1 reward — define the tangible gift and configure fulfillment process

---

## 6. Phase 2 — Remaining (Shareable Cards + PWA)

| Feature | Description |
|---------|-------------|
| **Shareable referral cards** | Auto-generated story card with referrer's code + tier badge; shareable directly to Instagram/WhatsApp without copy-paste |
| **Referee tracking link** | Unique URL per referral (not just code) for better attribution |
| **Referrer app (PWA)** | Installable on mobile home screen — push notifications for status changes |
| **Multi-city** | Support Hyderabad, Mumbai — city-scoped codes and milestones |

---

## 7. Phase 3 — Future

| Feature | Description |
|---------|-------------|
| **Two-sided rewards** | Referee also gets a move-in benefit (first week free, gift voucher) |
| **API for partners** | Allow real estate channels / influencers to embed and track referrals |
| **Analytics dashboard** | Conversion funnel from interest → signed → completed, by referrer cohort |
| **Automated #1 leaderboard reward** | System auto-detects quarter end, fires reward to top referrer |

---

## 8. Testing the Interface

### For the internal team

1. Visit **https://flent-referral.vercel.app**
2. Go through **Sign up** with your real email to receive an OTP
3. After verifying, explore the **dashboard** — code box, tier badge, quarterly standing, share buttons
4. **Admin panel**: visit `/admin/login` — credentials from `npm run db:seed` (ask Dhiram)
5. In Admin → **Tiers**: view/edit ambassador tier configuration
6. In Admin → **Comms**: edit all 14 copy templates including new Instagram share text and community stat number

### For local development

Follow the README setup, then visit **http://localhost:3000/dev** for one-click access to every screen without OTP or DB. The dev bypass returns mock data including ambassador tier (Connector), quarterly rank (#4 of 12), leaderboard entries, and pre-rendered share texts.
