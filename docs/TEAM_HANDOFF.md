# Flent Referral Engine — Team Handoff

**Last updated:** April 2026  
**Built by:** Dhiram Shah  
**Live at:** https://flent-referral.vercel.app  
**Admin panel:** https://flent-referral.vercel.app/admin

---

## What This Is

A standalone referral program for Flent co-living. Anyone — tenants and non-tenants alike — can sign up, get a unique referral code, share it with friends, and earn rewards when those friends move in.

The system is **fully self-serve**: referrers track their own pipeline on a personal dashboard, rewards unlock automatically when milestones are hit, and all outbound copy (emails, WhatsApp messages, share text) is editable by marketing without a code deploy.

---

## How It Works — End to End

### 1. Referrer signs up
- Visits the landing page → clicks "Get my referral code"
- Fills name, phone, email → receives a 6-digit OTP by email
- Verifies OTP → unique referral code created (e.g. `PRIYA7`)
- Lands on their personal dashboard

### 2. Referrer shares their code
- Dashboard shows a WhatsApp button (pre-drafted share text) and Instagram button
- Friends are directed to the inquiry form at **flent.in** where they enter the referral code

### 3. Friend fills the Typeform
- Typeform fires a webhook to our system
- Referral created as `INTERESTED`
- Referrer receives an email + WhatsApp notification instantly

### 4. Sales processes the move-in (via HubSpot)
- Sales marks `token_payment_status = Paid` on the contact → referral moves to `AGREEMENT_SIGNED`
- Once `first_month_rent = Paid`, `tenant_security_deposit = Paid`, and the move-in date has passed → referral moves to `COMPLETED`
- Each COMPLETED referral adds +1 to the referrer's streak and lifetime count
- Referrer is notified at every stage

### 5. Referrer claims a reward
- Dashboard shows a milestone journey (e.g. "Refer 3 friends → ₹3,000 voucher")
- When streak reaches a milestone, an "Unlock" state appears → referrer clicks to claim
- Admin sees the claim in the Redemptions tab → fulfils manually → marks as Fulfilled
- Streak resets to 0 on every claim; lifetime count never resets

### 6. Tenant auto-enrollment
- When ops sets `customer_type = Tenant` on a HubSpot contact, the system automatically creates a referrer account (or upgrades an existing one) and sends a welcome notification
- Tenants don't need to sign up — they just log in with their email OTP

---

## Who Does What

| Role | Responsibility |
|------|---------------|
| **Referrer** | Signs up, shares code, claims rewards — fully self-serve |
| **Referee (friend)** | Fills Typeform — no account needed |
| **Sales (HubSpot)** | Marks payment fields on contacts — triggers status progression |
| **Ops** | Sets `customer_type = Tenant` on HubSpot contacts — triggers auto-enrollment |
| **Admin (demand@flent.in)** | Manages referrers, fulfils rewards, configures milestones and tiers |
| **Marketing (marketing@flent.in)** | Edits all email/WA/UI copy via Admin → Comms — no deploy needed |

---

## Admin Panel — Tab by Tab

Visit `/admin` → log in with credentials from Dhiram.

| Tab | What you can do |
|-----|----------------|
| **Overview** | Live stats: total referrers, referrals by status, pending redemptions, recent sign-ups |
| **Referrers** | Full list — search by name/email/code, see streak/lifetime, Source (Auto-enrolled vs Self sign-up), Tenant badge, join date. Can disable or disqualify referrers. |
| **Referrals** | All referrals — filter by status (Interested / Agreement Signed / Completed). Shows referee details + which referrer brought them. |
| **Redemptions** | Pending reward claims — mark as Fulfilled (once you've sent the reward) or Rejected with a note |
| **Milestones** | Configure reward tiers — how many referrals unlock what reward, the reward value, whether extra info is required at claim time |
| **Tiers** | Ambassador tier config — names, referral thresholds, badge colors (Scout / Connector / Ambassador by default) |
| **Comms** | Edit all 15 email, WhatsApp, and UI copy templates — live preview of variables, last-edited metadata |

### Fulfilling a reward (step-by-step)
1. Go to Admin → Redemptions
2. Find the PENDING entry — shows referrer name, reward name, tier
3. Fulfil the reward externally (bank transfer, voucher email, etc.)
4. Click **Mark Fulfilled** → add a note if needed
5. Done — the referrer's dashboard history strip updates

---

## Marketing — Editing Copy Without a Deploy

Everything in Admin → Comms tab. Changes take effect on the **next send** — no restart needed.

**Key templates to review before launch:**

| Template key | What it controls |
|---|---|
| `ui_wa_share_text` | The pre-drafted WhatsApp message referrers share. Use `{{referralCode}}`, `{{lifetimeCount}}`, `{{tierBrag}}` |
| `ui_instagram_share_text` | The caption copied to clipboard for Instagram |
| `ui_community_stat` | The number shown in the "X+ referrals made" band on the home page (e.g. `500+`) |
| `email_welcome` | Welcome email sent when someone signs up |
| `email_referral_completed` | Sent to referrer when their friend completes move-in — include reward info |

All templates support `{{variable}}` placeholders. The variable list is shown in the Comms tab next to each template.

---

## HubSpot Setup — What Must Be Configured

This is configured via **HubSpot → Settings → Integrations → Private Apps → [your app] → Webhooks tab** (NOT via Automation → Workflows).

**Active subscriptions (contact.propertyChange):**
- `token_payment_status` — triggers AGREEMENT_SIGNED
- `first_month_rent` — triggers COMPLETED check
- `tenant_security_deposit` — triggers COMPLETED check
- `customer_type` — triggers tenant auto-enrollment when value = `Tenant`

**Webhook URL:** `https://flent-referral.vercel.app/api/webhooks/hubspot`

**Important:** Do NOT use `contact.creation` — it fires for every new lead (prospects, vendors, anyone) and would create spurious referrer accounts.

---

## Things That Are Not Automated (Manual Steps)

| What | When | How |
|------|------|-----|
| Fulfil reward claims | When a redemption appears in Admin → Redemptions | Admin marks Fulfilled after sending reward |
| Set quarterly #1 gift | Start of each quarter | Decide offline; update milestone or add a note in Comms |
| Leaderboard backfill | One-time setup | Run SQL from `docs/leaderboard-backfill.md` in Supabase |
| Community stat update | When backfill is done | Update `ui_community_stat` in Admin → Comms |
| Opt-in outreach | Before launch | Contact known referrers and ask them to toggle the leaderboard opt-in on their dashboard |
| Bulk CSV export | Ad hoc | Not built yet — needs direct Supabase query for now |

---

## Known Gaps / Not In This Scope

These are documented and tracked but not built in Phase 1:

- **Shareable referral card image** — story-format card auto-generated for Instagram (Phase 2)
- **Referee tracking link** — unique URL per referral for better attribution (Phase 2)
- **PWA / push notifications** — installable on mobile with push alerts for status changes (Phase 2)
- **Two-sided rewards** — referee also gets a move-in benefit (Phase 3)
- **Password reset for admin users** — currently needs manual DB update
- **Referrer profile edit** — phone number change not self-serve
- **Mobile responsiveness audit** — desktop-first, needs QA on small screens
- **Bulk CSV export** — referrers and redemptions export not built
- **WhatsApp OTP** — parked; needs a Business-type Meta app (currently only email OTP for sign-up; WA OTP is attempted but fails silently and falls back to email)
- **Multi-city** — currently Bangalore only; no city-scoping built

---

## Tech Integrations at a Glance

| Service | What it does | Credentials |
|---------|-------------|-------------|
| **Supabase** | PostgreSQL database | `DATABASE_URL` in Vercel env vars |
| **Resend** | Transactional email | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| **Superchat** | WhatsApp notifications | `SUPERCHAT_API_KEY`, `SUPERCHAT_WORKSPACE_ID` |
| **HubSpot** | Referral status triggers + tenant enrollment | `HUBSPOT_WEBHOOK_SECRET`, `HUBSPOT_ACCESS_TOKEN` |
| **Typeform** | Referee inquiry form | `TYPEFORM_WEBHOOK_SECRET`, `TYPEFORM_REFERRAL_CODE_FIELD_ID` |
| **Vercel** | Hosting + daily cron job (01:00 UTC) | `CRON_SECRET` |

All credentials are stored as environment variables in Vercel — ask Dhiram for access.

---

## Things to Watch Out For

- **OTP expiry**: OTPs expire in 10 minutes, 3 attempts max. Referrers who fail OTP 3 times need to wait for a new one (60-second resend cooldown).
- **HubSpot timing**: The `COMPLETED` webhook fires when `first_month_rent` or `tenant_security_deposit` is marked Paid. If both payments are in but `move_in_date` hasn't passed yet, completion is deferred. The daily cron at 01:00 UTC catches these.
- **Self-referral detection**: If a referrer tries to use their own code via Typeform, the referral is created as disqualified (no reward, no notification) — they can't game the system.
- **Streak vs lifetime**: Streak resets to 0 every time a reward is claimed. Lifetime count never resets — it's the basis for ambassador tier. Referrers should understand this before claiming.
- **Leaderboard is opt-in**: By default, referrers appear as "Anonymous" on the leaderboard. They must toggle the opt-in switch on their dashboard to show their name.
- **Pending redemption blocks new claims**: A referrer can only have one active redemption at a time. Other unlocked milestones show "Blocked" until the pending one is fulfilled or rejected.
- **CommTemplate table**: Must exist in the database before the Comms tab works. It's created via the schema migration. If it's missing, the system falls back to hardcoded defaults (nothing breaks, but edits won't persist).

---

## Quick Reference — Key URLs

| URL | What |
|-----|------|
| `https://flent-referral.vercel.app` | Public landing page |
| `https://flent-referral.vercel.app/signup` | Referrer sign-up |
| `https://flent-referral.vercel.app/login` | Referrer login |
| `https://flent-referral.vercel.app/dashboard` | Referrer dashboard (auth required) |
| `https://flent-referral.vercel.app/admin` | Admin panel (admin auth required) |
| `https://flent-referral.vercel.app/admin/login` | Admin login |
| `https://flent-referral.vercel.app/api/webhooks/hubspot` | HubSpot webhook endpoint |
| `https://flent-referral.vercel.app/api/webhooks/typeform` | Typeform webhook endpoint |
| `https://flent-referral.vercel.app/api/leaderboard` | Public leaderboard API |

---

## Pre-Launch Checklist

- [ ] Review and update all copy in Admin → Comms (especially welcome email and share texts)
- [ ] Update `ui_community_stat` to actual historical referral count
- [ ] Run leaderboard backfill SQL (`docs/leaderboard-backfill.md`)
- [ ] Confirm HubSpot webhook subscriptions are active (4 property change subscriptions)
- [ ] Confirm Typeform has the referral code field wired to the webhook
- [ ] Reach out to known power referrers to opt in to leaderboard
- [ ] Decide and configure the quarterly #1 leaderboard reward
- [ ] Test full flow: sign up → share → Typeform fill → HubSpot payment marks → reward claim → admin fulfil
- [ ] Mobile responsiveness check on dashboard and landing page
- [ ] Email deliverability: confirm `email.flent.in` domain is warmed up in Resend
