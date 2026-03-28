# Flent Referral Program — Product Requirements Document

**Version:** 1.0 · **Last updated:** March 2026
**Owner:** Dhiram Shah
**Interface:** https://flent-referral.vercel.app
**Status:** Phase 1 built & deployed · Phase 2 in planning

---

## 1. Overview

The Flent Referral Engine is a standalone web application that enables anyone — tenants and non-tenants — to refer friends to Flent co-living in Bangalore and earn milestone-based rewards. It replaces the informal, untracked referral flow currently handled via sales staff.

### Goals
- Create a self-serve referral loop that requires zero sales effort to administer
- Give referrers full visibility into where their referrals stand
- Reward loyalty progressively — each completed referral builds toward a better reward
- Auto-enroll existing tenants so the program grows organically from day one

---

## 2. User Roles

| Role | Description |
|------|-------------|
| **Referrer** | Anyone with a unique code — tenant or external. Signs up in under 60 seconds. |
| **Referee** | Friend referred by a referrer. Submits interest via Typeform embed on flent.in. |
| **Admin** | Flent team member. Manages referrers, reviews redemptions, configures rewards. |

---

## 3. What's Built — Phase 1

### 3.1 Public Landing Page (`/`)

A full marketing page explaining the referral program with:

- Hero section with referral CTA
- Trust strip (no brokerage, no deposits, 200+ items, real support)
- Angled marquee banners with social copy ("Good karma, guaranteed." etc.)
- How It Works — animated scroll timeline (3 steps)
- Milestone reward roadmap — DB-driven, shows current tiers
- Why your friends will love Flent — 4 pastel feature cards
- Social proof stats (₹1Cr+ raised, 450+ tenants, 200+ items)
- FAQ accordion
- CTA banner (warm brown, ghostly pattern, white text)

> ⚠️ **Copy review needed** — All copy across the landing page, emails, dashboard, and notifications is placeholder/first-draft. The full copy set needs a review pass before public launch.

### 3.2 Referrer Signup (`/signup`)

- Name, phone, email, city form
- Email OTP verification (6-digit, 10-minute expiry, 3-attempt limit)
- 60-second resend cooldown — server-enforced (returns 429 if bypassed)
- Email fires in background via `after()` — no spinner wait
- On verify: referral code generated, account created, welcome email + WhatsApp sent
- Success screen with copy-to-clipboard referral code

### 3.3 Referrer Login (`/login`)

- Email-only entry → OTP sent
- Same 60s cooldown + text-link resend (no button)
- Redirects to `/dashboard` after verify

### 3.4 Referrer Dashboard (`/dashboard`)

- Referral code display with copy button
- Streak progress bar toward next milestone
- Milestone roadmap with unlock state
- Redemption CTA (shown when milestone unlocked, hidden if pending redemption)
- Redemption modal — supports free-text extra info (e.g. UPI ID for cash rewards)
- All referrals list with status badges (Interested / Agreement Signed / Completed)
- Sign out

### 3.5 Referral Submission (via Typeform webhook)

- Friend fills a Typeform embed on flent.in with referral code
- Webhook at `/api/webhooks/typeform` creates a `Referral` record (status: INTERESTED)
- Referrer gets email + WhatsApp notification: "Your friend just showed interest!"

### 3.6 HubSpot Integration (`/api/webhooks/hubspot`)

Listens to HubSpot deal stage changes and drives referral status:

| HubSpot Event | Action |
|--------------|--------|
| Deal → `agreement_signed` | Referral status → `AGREEMENT_SIGNED` · Referrer notified |
| Deal → `tenancy_completed` | Referral status → `COMPLETED` · Streak +1 · Milestone check · Referrer notified |
| Contact creation / lifecycle → `customer` | Auto-enroll tenant as referrer with unique code |

### 3.7 Admin Panel (`/admin`)

Four tabs, password-protected:

| Tab | Features |
|-----|----------|
| **Overview** | Total referrers, active referrers, referrals by status, pending redemptions, recent signups |
| **Referrers** | Full list with streak/lifetime counts, search, disqualify/reactivate |
| **Redemptions** | Pending redemption queue — mark fulfilled/rejected, add notes |
| **Milestones** | Create, edit, toggle active/inactive reward tiers |

### 3.8 Notifications

All notifications fire email + WhatsApp in parallel:

| Trigger | Email | WhatsApp |
|---------|-------|----------|
| Signup verified | Welcome + referral code | ✓ |
| Referee submits interest | "Friend showed interest" | ✓ |
| Agreement signed | "Friend signed agreement" | ✓ |
| Tenancy completed | "Referral complete + reward unlocked" | ✓ |
| Redemption submitted | "Reward on its way" | ✓ |

---

## 4. Technical Architecture (summary)

```
Next.js 16 (App Router) → Supabase PostgreSQL (Prisma 7)
                        → Resend (email)
                        → Superchat (WhatsApp)
                        ← HubSpot (webhooks)
                        ← Typeform (webhooks)
                        → Vercel (hosting)
```

- Auth: email OTP → JWT cookie (`flent_ref_token` 30d, `flent_admin_token` 8h)
- Route guard: `src/proxy.ts` — protects `/dashboard` and `/admin`
- Milestones: fully DB-configured, no code changes to add/edit rewards
- Streak logic: resets on redemption; lifetime count never resets

---

## 5. Open Items Before Public Launch

### Copy review (required)
All text across the product is first-draft and needs a deliberate pass:

- [ ] Landing page hero, tagline, sub-copy
- [ ] Trust strip labels and sub-labels
- [ ] Marquee banner messages
- [ ] How It Works step descriptions
- [ ] Why your friends will love Flent — card copy
- [ ] FAQ questions and answers
- [ ] CTA section headline and sub-copy
- [ ] Signup/login form labels and helper text
- [ ] OTP email subject lines and body
- [ ] Welcome email
- [ ] WhatsApp notification messages
- [ ] Dashboard labels (streak copy, milestone descriptions, redeem modal)
- [ ] Admin panel (empty states, status labels)

### UX / product gaps
- [ ] Mobile responsiveness audit across all screens
- [ ] Share referral code via WhatsApp / native share on mobile
- [ ] "How do I refer someone?" inline guide on dashboard (walkthrough)
- [ ] Password reset flow for admin users
- [ ] Referrer profile edit (phone number change)

### Ops / admin
- [ ] Admin user creation flow (currently requires direct DB seed)
- [ ] Bulk CSV export of referrers and redemptions
- [ ] Email deliverability audit — Resend domain warm-up for `email.flent.in`

---

## 6. Phase 2 — Planned

| Feature | Description |
|---------|-------------|
| **Shareable referral cards** | Auto-generated OG image / story card with referrer's code, shareable on Instagram / WhatsApp |
| **Leaderboard** | Optional public/private ranking of top referrers by streak or lifetime count |
| **Referrer tiers** | Bronze / Silver / Gold status based on lifetime completions — unlocks perks |
| **Referee tracking link** | Unique URL per referral (not just code) for better attribution |
| **Referrer app (PWA)** | Installable on mobile home screen — push notifications for status changes |
| **Multi-city** | Support Hyderabad, Mumbai — city-scoped referral codes and milestones |

---

## 7. Phase 3 — Future

| Feature | Description |
|---------|-------------|
| **Two-sided rewards** | Referee also gets a move-in benefit (first week free, gift voucher) |
| **Ambassador program** | Top referrers get a dedicated account manager, custom perks |
| **API for partners** | Allow real estate channels / influencers to embed and track referrals |
| **Analytics dashboard** | Conversion funnel from interest → signed → completed, by referrer cohort |

---

## 8. Testing the Interface

### For the internal team

1. Open the live link: **https://flent-referral.vercel.app**
2. Go through the **Sign up** flow with your real email — you'll receive an OTP
3. After verifying, you'll land on the **dashboard** with your referral code
4. To explore the **admin panel**: visit `/admin/login` — ask Dhiram for credentials

### For local development

Follow the README setup, then visit **http://localhost:3000/dev** for one-click access to every screen without OTP.
