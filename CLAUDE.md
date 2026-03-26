@AGENTS.md

## Project
Flent Referral Engine — a gamified referral program for Flent (Bangalore co-living company). Referrers get unique codes, track friend move-ins, and unlock milestone rewards. Includes a full admin dashboard.

## Tech Stack
- Next.js 16.2.1 (App Router, Turbopack) · TypeScript 5 · React 19
- Prisma 7.5 (adapter pattern via `@prisma/adapter-pg`) · PostgreSQL (Supabase)
- Resend (email) · Superchat API (WhatsApp) · HubSpot webhooks · Typeform webhooks
- Tailwind CSS v4 · Vercel deployment
- JWT (jsonwebtoken) + bcryptjs for auth · Zod v4 for validation

## Architecture
- **Route handlers** via Next.js App Router (`src/app/api/`) — standard Web API pattern
- **Proxy** (`src/proxy.ts`) guards `/dashboard` and `/admin` routes — replaces deprecated `middleware.ts`
- **Dual auth**: referrers use email OTP → JWT cookie (`flent_ref_token`, 30d); admins use email/password → JWT cookie (`flent_admin_token`, 8h)
- **Unified notifications** (`src/lib/notifications.ts`) fires email + WhatsApp in parallel, logs to DB
- **Milestone engine**: streak-based counter resets on redemption; milestones are DB-configured, not hardcoded

## Key Files
- `prisma/schema.prisma` — full data model (Referrer, Referral, MilestoneConfig, Redemption, ReferrerProgress, OtpSession)
- `prisma.config.ts` — Prisma v7 config (DATABASE_URL goes here, NOT in schema)
- `src/lib/prisma.ts` — PrismaClient with `PrismaPg` adapter (required in v7)
- `src/generated/prisma/client.ts` — generated client (import from here, not `@/generated/prisma`)
- `src/app/api/webhooks/hubspot/route.ts` — handles tenant enrollment + referral status transitions
- `src/app/api/webhooks/typeform/route.ts` — captures referral code from inquiry form
- `scripts/seed-admin.ts` — creates initial admin users and milestone tiers (`npm run db:seed`)
- `.env.example` — all required env vars documented

## Decisions & Patterns
- Resend must be lazily initialized (not at module level) to avoid build-time errors
- `z.record()` in Zod v4 requires two args: `z.record(z.string(), z.string())`
- Prisma v7: no `url` field in `datasource db {}` block; use `prisma.config.ts` instead
- `scripts/` excluded from tsconfig to prevent type-checking seed scripts during build
- Self-referral detection: compare referee phone/email against referrer record at webhook time
- Streak resets only on explicit redemption (not automatically); lifetime count never resets
