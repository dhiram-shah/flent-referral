# Flent Referral Engine

Gamified referral program for Flent co-living. Referrers share a unique code, friends move in, rewards unlock at milestones.

**Live:** https://flent-referral.vercel.app
**Dev shortcuts:** http://localhost:3000/dev

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Get .env.local from Dhiram / 1Password and place it in the project root

# 3. Push DB schema (first time only)
npm run db:push

# 4. Seed milestone data (optional)
npm run db:seed

# 5. Start dev server
npm run dev
```

Open http://localhost:3000

---

## Dev bypass — skip real auth

Go to **http://localhost:3000/dev** to jump to any screen without OTP:

| Link | What it does |
|------|-------------|
| Landing page | Public home — no auth needed |
| Sign up / Login | The forms themselves (no OTP will actually fire locally unless Resend is configured) |
| Dashboard (as referrer) | Signs in as the first DB referrer; creates `dev@flent.in` if none exists |
| Admin panel (as admin) | Signs in as the first active AdminUser |

> These dev routes return **404 in production**. Safe to leave in the codebase.

---

## Environment variables

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Supabase session pooler — port **5432** (not 6543 transaction pooler) |
| `JWT_SECRET` | Referrer JWT signing key |
| `ADMIN_JWT_SECRET` | Admin JWT signing key |
| `RESEND_API_KEY` | Resend email API key |
| `RESEND_FROM_EMAIL` | Must be `referrals@email.flent.in` |
| `SUPERCHAT_API_KEY` | WhatsApp notifications via Superchat |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot CRM read access |
| `HUBSPOT_WEBHOOK_SECRET` | Verify incoming HubSpot webhook signatures |
| `HUBSPOT_STAGE_AGREEMENT_SIGNED` | Deal stage ID — defaults to `agreement_signed` |
| `HUBSPOT_STAGE_COMPLETED` | Deal stage ID — defaults to `tenancy_completed` |
| `NEXT_PUBLIC_APP_URL` | e.g. `https://flent-referral.vercel.app` |

---

## Key commands

```bash
npm run dev          # Local dev server (Turbopack, fast HMR)
npm run build        # Production build
npm run lint         # ESLint
npm run db:push      # Push schema changes to DB (no migration file generated)
npm run db:seed      # Seed milestones + create a test admin user
npm run db:studio    # Open Prisma Studio — visual DB browser at localhost:5555
```

---

## Project structure

```
src/
  app/
    page.tsx              # Public landing page
    signup/               # Referrer signup + OTP verification
    login/                # Returning referrer login
    dashboard/            # Referrer dashboard (proxy-gated)
    admin/                # Admin panel (proxy-gated)
    dev/                  # Dev-only screen switcher (404 in prod)
    api/
      auth/               # OTP send/verify, JWT session, logout
      admin/              # Stats, referrers, redemptions, milestones (CRUD)
      redemptions/        # Referrer reward redemption
      webhooks/
        hubspot/          # Deal stage changes → referral status transitions
        typeform/         # New referral submission from Typeform embed
  lib/
    prisma.ts             # DB client (Supabase + SSL — do not touch SSL config)
    auth.ts               # JWT sign/verify, cookie options
    otp.ts                # OTP generation + 60s resend cooldown
    notifications.ts      # Email + WhatsApp fired in parallel
    resend.ts             # Transactional email templates
    superchat.ts          # WhatsApp via Superchat API
  proxy.ts                # Route guard for /dashboard and /admin
  components/ui/
    HowItWorks.tsx        # Animated scroll timeline (client component)
    FaqAccordion.tsx      # Collapsible FAQ section
prisma/
  schema.prisma           # Full data model
prisma.config.ts          # Prisma v7 config — DATABASE_URL lives here, not in schema
```

---

## Architecture notes

- **OTP emails** fire via Next.js `after()` — the API responds immediately and email sends in background. This prevents the user staring at a spinner while Resend processes.
- **OTP rate limit** — 60s cooldown enforced server-side in `otp.ts`. Client shows a live countdown; server returns 429 if bypassed.
- **Route guard** (`proxy.ts`) reads cookies directly — always use `window.location.href` for post-auth redirects, not `router.push`, or the fresh cookie won't be read.
- **Prisma v7** — `DATABASE_URL` goes in `prisma.config.ts`, not the datasource block. SSL `rejectUnauthorized: false` in `src/lib/prisma.ts` is required for Supabase — do not remove.
- **Milestones are DB-configured** — create/edit/toggle them in the admin panel or Prisma Studio with no code changes.
- **Streak** resets only when a referrer explicitly redeems a reward. Lifetime count never resets.
