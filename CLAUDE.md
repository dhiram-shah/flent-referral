@AGENTS.md

## Project
Flent Referral Engine — gamified referral program for Flent (Bangalore co-living). Referrers get unique codes, track friend move-ins, and unlock milestone rewards. Includes admin dashboard.

## Tech Stack
- Next.js 16.2.1 (App Router, Turbopack) · TypeScript 5 · React 19
- Prisma 7.5 (`@prisma/adapter-pg` + `PrismaPg`) · PostgreSQL via Supabase Session Pooler (IPv4)
- Resend (`after()` for async email) · Superchat (WhatsApp) · HubSpot webhooks · Typeform webhooks
- Tailwind CSS v4 · Zin Display Condensed via `next/font/local` (`--font-serif`) · Vercel

## Architecture
- **Proxy** (`src/proxy.ts`) guards `/dashboard` + `/admin` — use `window.location.href` for auth-sensitive navigation (not `router.push`) so proxy reads fresh cookies
- **Dual auth**: referrers: email OTP → JWT cookie (`flent_ref_token`, 30d); admins: password → `flent_admin_token` (8h)
- **OTP rate-limiting**: 60s cooldown enforced in `src/lib/otp.ts` (`createOtpSession` throws `COOLDOWN:N`); email fired via `after()` post-response to avoid blocking
- **Notifications** (`src/lib/notifications.ts`) fires email + WhatsApp in parallel, logs to DB
- **Milestone engine**: streak-based, resets on redemption; milestones are DB-configured with `FALLBACK_MILESTONES` in `page.tsx` for local dev

## Key Files
- `prisma/schema.prisma` — data model (Referrer, Referral, MilestoneConfig, Redemption, ReferrerProgress, OtpSession, AdminUser)
- `prisma.config.ts` — Prisma v7 config (DATABASE_URL here, NOT in schema datasource block)
- `src/lib/prisma.ts` — PrismaClient with PrismaPg adapter + `ssl: { rejectUnauthorized: false }` (DO NOT remove — required for Supabase)
- `src/lib/otp.ts` — OTP creation with 60s cooldown guard; `src/lib/resend.ts` — lazy Resend init
- `src/app/api/webhooks/hubspot/route.ts` — tenant enrollment + referral status transitions
- `src/app/globals.css` — design tokens, `.btn-pill*`, `.btn-pastel-*`, `.btn-pill-white`, `.milestone-grid`, marquee + ms-glow-pulse animations
- `src/app/fonts/ZinDisplay.otf` — local serif font (Zin Display Condensed Demo by CarnokyType)
- `src/components/ui/NavBar.tsx` — scroll-aware sticky nav (client component, backdrop blur on scroll)
- `src/components/ui/HowItWorks.tsx` — ghost number split layout, IntersectionObserver stagger reveal
- `src/components/ui/MilestoneRoadmap.tsx` — client component, scroll-triggered cascade + gold glow pulse, ghost watermark icons

## Env Vars (critical)
- `RESEND_FROM_EMAIL` = `referrals@email.flent.in`
- `DATABASE_URL` = Supabase Session Pooler with IPv4 (port 5432, NOT 6543 transaction pooler)

## Recent Changes
- **Dashboard hero** (`dashboard/page.tsx`): referral code now in neo-brutalist box with inline Copy button — `white-space: nowrap` + `clamp(18px,3vw,28px)` guarantees single line; copy flow inverted (description → code → share); added `WORKFLOW.md`
- **Dashboard milestone section**: 4-state cards (locked/eligible/eligible_blocked/pending), hover "Claim now →", any eligible tier claimable, history strip + total earned value, 3rd stat col
- **`/api/referrers/me`**: returns `redeemableMilestones[]`, `pendingRedemption`, `redeemedHistory[]`, `totalEarnedValue`; dev bypass with rich stub (no auth/DB needed locally)
- **MilestoneRoadmap** (`src/components/ui/MilestoneRoadmap.tsx`): scroll-triggered cascade, ghost watermark icons, gold glow pulse (inline `el.style.*` — Turbopack safe)

## Decisions & Patterns
- Resend lazily initialized — never instantiate at module level; always fire via `after()` in route handlers
- `window.location.href` for post-auth redirects; `router.push` bypasses proxy cookie check
- Prisma v7: no `url` in datasource block; SSL config in `src/lib/prisma.ts` via adapter options
- Streak resets only on explicit redemption; lifetime count never resets
- Typography: `--font-sans` = Plus Jakarta Sans (body/UI), `--font-serif` = Zin Display (headers only); serif used via `.serif` / `.serif-italic` CSS classes
- UI: cream `#FCFBF7` bg, brand navy `#15102E`, pastel neo-brutalist buttons (3–4px hard shadow), no emojis anywhere as structural icons
- **Scroll animations**: use `el.style.*` inline (not CSS classes) for scroll-triggered reveals in Turbopack — CSS class state races with hydration. Use double-RAF (`requestAnimationFrame(() => requestAnimationFrame(...))`) before starting transitions.
- **Auth page pattern**: pie-factory.svg overlay at opacity 0.05 (position absolute, inset 0); logo pill = `{bg: var(--bg), border: 1.5px solid var(--brand), borderRadius: 999}`; card = `{border: 1.5px solid var(--brand), boxShadow: 4px 4px 0 var(--brand)}`
- `FALLBACK_MILESTONES` in `page.tsx` — milestone section always renders locally even without DB
- **Dev bypass**: `NODE_ENV !== 'production'` in `proxy.ts` + `/api/referrers/me` returns stub data — `/dashboard` fully viewable locally without auth or DB
- **Multi-tier redemption**: any milestone where `streak >= referralsRequired` is independently claimable; `redeemableMilestones[]` empty when pending exists; streak resets on every claim

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
