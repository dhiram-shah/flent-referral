@AGENTS.md

## Project
Flent Referral Engine — gamified referral program for Flent (Bangalore co-living). Referrers get unique codes, track friend move-ins, unlock milestone rewards, earn ambassador tiers, and compete on a quarterly leaderboard. Includes admin dashboard.

## Tech Stack
- Next.js 16.2.1 (App Router, Turbopack) · TypeScript 5 · React 19
- Prisma 7.5 (`@prisma/adapter-pg` + `PrismaPg`) · PostgreSQL via Supabase Session Pooler (IPv4)
- Resend (`after()` for async email) · Superchat (WhatsApp) · HubSpot webhooks · Typeform webhooks
- Tailwind CSS v4 · Zin Display Condensed via `next/font/local` (`--font-serif`) · Vercel
- Framer Motion · Lenis (smooth scroll) · Matter.js · canvas-confetti (home page animations)
- `zod` for input validation · `bcryptjs` for admin password · `jsonwebtoken` for JWT

## Architecture
- **Proxy** (`src/proxy.ts`) guards `/dashboard` + `/admin` — use `window.location.href` for auth-sensitive navigation (not `router.push`) so proxy reads fresh cookies
- **Dual auth**: referrers: email OTP → JWT cookie (`flent_ref_token`, 30d); admins: password → `flent_admin_token` (8h)
- **OTP rate-limiting**: 60s cooldown enforced in `src/lib/otp.ts` (`createOtpSession` throws `COOLDOWN:N`); email + WhatsApp fired via `notifyOtp()` in `after()` post-response
- **Notifications** (`src/lib/notifications.ts`) fires email + WhatsApp in parallel, logs to DB
- **Comms templates** (`src/lib/comms.ts`): all email/WA/UI copy stored in `CommTemplate` table, editable via Admin → Comms tab. 15 keys across 3 channels. Auto-seeds defaults. Uses `{{variable}}` placeholders. **`getTemplate()` falls back to in-memory defaults if DB table missing** — never throws.
- **Milestone engine**: streak-based, resets on redemption; milestones are DB-configured with `FALLBACK_MILESTONES` in `page.tsx` for local dev
- **Ambassador tiers** (`src/lib/ambassadorTiers.ts`): computed from `lifetimeCompletedCount` against `AmbassadorTier` table; auto-seeds Scout/Connector/Ambassador defaults; fully admin-configurable
- **Leaderboard**: quarterly (calendar Q), live-computed from `Referral.completedAt`; opt-in first-name display; rank data returned in `/api/referrers/me`; public list from `/api/leaderboard`
- **Community stat** (`ReferralStatBand`): server component fetches `ui_community_stat` CommTemplate; scroll-triggered counter animation in `ReferralStatCounter` client component
- **Tenant auto-enrollment**: HubSpot `customer_type=Tenant` webhook creates referrer with `isTenant=true`; upgrades existing referrer if already signed up

## Key Files
- `prisma/schema.prisma` — data model (Referrer, Referral, MilestoneConfig, Redemption, ReferrerProgress, OtpSession, AdminUser, NotificationLog, CommTemplate, AmbassadorTier)
- `prisma.config.ts` — Prisma v7 config (DATABASE_URL here, NOT in schema datasource block)
- `src/lib/prisma.ts` — PrismaClient with PrismaPg adapter + `ssl: { rejectUnauthorized: false }` (DO NOT remove — required for Supabase); `pg.Pool max: 1`
- `src/lib/otp.ts` — OTP creation with 60s cooldown guard
- `src/lib/resend.ts` — email sending; reads subject+body from `CommTemplate` via `src/lib/comms.ts`
- `src/lib/superchat.ts` — WhatsApp via Superchat API; `sendOtpMetaDirect()` for Meta Cloud API direct (auth templates); reads template names from `CommTemplate`
- `src/lib/comms.ts` — **CommTemplate store**: `getTemplate(key)`, `getAllTemplates()`, `renderTemplate(str, vars)`. 15 default keys. Both never throw — fall back to in-memory defaults if table missing.
- `src/lib/ambassadorTiers.ts` — `getAllTiers()` (fetches + seeds defaults), `computeTier(lifetimeCount, tiers)`, `getCurrentQuarter()`, `TIER_COLORS` map
- `src/lib/notifications.ts` — fires email + WhatsApp in parallel, logs to DB
- `src/app/api/admin/comms/route.ts` — GET lists + seeds all comms templates
- `src/app/api/admin/comms/[key]/route.ts` — PATCH updates a template; records `updatedBy`
- `src/app/api/admin/ambassador-tiers/route.ts` — GET all tiers, POST create
- `src/app/api/admin/ambassador-tiers/[id]/route.ts` — PATCH update, DELETE
- `src/app/api/admin/referrals/route.ts` — GET all referrals (admin-auth, up to 500, optional `?status=` filter)
- `src/app/api/admin/referrers/[id]/route.ts` — PATCH referrer (isActive, isDisqualified, isTenant)
- `src/app/api/leaderboard/route.ts` — GET quarterly top 20; public endpoint; opted-in names only
- `src/app/api/referrers/me/route.ts` — GET profile + milestones + leaderboard data + ambassador tier + share texts; PATCH updates `leaderboardOptIn`
- `src/app/admin/components/CommsTab.tsx` — admin UI for editing all comms templates
- `src/app/admin/components/TiersTab.tsx` — admin UI for ambassador tier CRUD
- `src/app/admin/page.tsx` — 7-tab admin dashboard (Overview, Referrers, Referrals, Redemptions, Milestones, Tiers, Comms); Referrals tab lazy-loads on first visit
- `src/components/PageLoader.tsx` — shared dog loader (DogThinking SVG + rotating messages); used by both dashboard and admin via `<PageLoader messages={string[]} />`
- `src/app/dashboard/page.tsx` — referrer dashboard (circle avatar badge, tier popover, code box, WhatsApp + Instagram share, quarterly standing, milestone journey, referrals list)
- `src/components/ReferralStatBand.tsx` — server component; fetches `ui_community_stat`; wraps `ReferralStatCounter`
- `src/components/ReferralStatCounter.tsx` — client component; IntersectionObserver scroll-triggered count-up animation (double-RAF, inline `el.style.*`)
- `src/app/api/webhooks/hubspot/route.ts` — contact-based tenant enrollment + referral status transitions; also handles `customer_type=Tenant` for auto-enrollment
- `src/app/api/cron/check-moveins/route.ts` — daily cron (01:00 UTC); sweeps AGREEMENT_SIGNED referrals, checks HubSpot for payments + move-in date passed
- `vercel.json` — Vercel Cron schedule for check-moveins (`0 1 * * *`)
- `src/app/globals.css` — design tokens, `.btn-base`, `.btn-pill*`, `.btn-pastel-*`, `.btn-pill-white`, marquee + ms-glow-pulse + dog-bounce + dot-flash animations
- `src/app/fonts/ZinDisplay.otf` — local serif font
- `docs/leaderboard-backfill.md` — SQL guide for backfilling historical referral data into leaderboard + ambassador tiers
- `docs/TEAM_HANDOFF.md` — handoff notes for team context on integration decisions

## CommTemplate Keys (15 total)
| Key | Channel | Variables |
|-----|---------|-----------|
| `email_otp` | EMAIL | name, otp |
| `email_welcome` | EMAIL | firstName, referralCode, dashboardUrl |
| `email_referral_interested` | EMAIL | firstName, refereeName, dashboardUrl |
| `email_referral_signed` | EMAIL | firstName, refereeName, dashboardUrl |
| `email_referral_completed` | EMAIL | firstName, refereeName, rewardLine, dashboardUrl |
| `email_redemption_confirmed` | EMAIL | firstName, rewardName, dashboardUrl |
| `wa_template_otp` | WHATSAPP | var1=otp — Meta auth template `referral_otp_verification` (approved) |
| `wa_template_welcome` | WHATSAPP | var1=firstName, var2=referralCode, var3=dashboardUrl |
| `wa_template_interested` | WHATSAPP | var1=referrerFirstName, var2=refereeName |
| `wa_template_signed` | WHATSAPP | var1=referrerFirstName, var2=refereeName |
| `wa_template_completed` | WHATSAPP | var1=referrerFirstName, var2=rewardName, var3=dashboardUrl |
| `wa_template_redeemed` | WHATSAPP | var1=referrerFirstName, var2=rewardName |
| `ui_wa_share_text` | UI | referralCode, lifetimeCount, tierBrag |
| `ui_instagram_share_text` | UI | referralCode, lifetimeCount, tierBrag |
| `ui_community_stat` | UI | (none — plain text like "500+") |

## Env Vars (critical)
**Required — system breaks without these:**
- `DATABASE_URL` — Supabase Session Pooler URI, port **5432** (NOT 6543 transaction pooler)
- `JWT_SECRET` — signs referrer JWT cookies (`flent_ref_token`)
- `ADMIN_JWT_SECRET` — signs admin JWT cookies (`flent_admin_token`)
- `RESEND_API_KEY` — Resend dashboard → API Keys
- `RESEND_FROM_EMAIL` — default `referrals@email.flent.in`

**Required for WhatsApp (missing = WA silently skipped):**
- `SUPERCHAT_API_KEY` — Superchat dashboard → Settings → API
- `SUPERCHAT_WORKSPACE_ID` — same page

**Required for HubSpot integration:**
- `HUBSPOT_WEBHOOK_SECRET` — Private App → Webhooks tab → "Secret" field; used to verify incoming webhook signatures
- `HUBSPOT_ACCESS_TOKEN` — Private App → Auth tab → Access Token; used to fetch contact details after webhook events
- `CRON_SECRET` — any random secret (e.g. `openssl rand -hex 32`); secures the `/api/cron/check-moveins` endpoint

**Optional (safe defaults exist):**
- `NEXT_PUBLIC_APP_URL` — default `https://flent.in/referral-program`
- `SUPERCHAT_TEMPLATE_OTP` — default `referral_otp_verification`
- `TYPEFORM_WEBHOOK_SECRET`, `TYPEFORM_REFERRAL_CODE_FIELD_ID`
- `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` — Meta Cloud API direct for OTP (parked; needs Business-type Meta app)

## Recent Changes
- **Admin table nowrap fix** (current): `whiteSpace: 'nowrap'` on Source badge + Code cell in referrers table — was wrapping "Auto-enrolled"/"Self sign-up" and long referral codes
- **Dead code removal** (current): removed duplicate `DashboardLoader`, `DotFlash`, `DogThinking` functions from `dashboard/page.tsx` (~130 lines); `LOADING_MESSAGES` moved to module level; `PageLoader` from shared component already in use
- **Home page force-dynamic** (`6944730`): `export const dynamic = 'force-dynamic'` on `src/app/page.tsx` so `ui_community_stat` always fetches live from DB
- **TENANT badge + admin columns** (`f5899d8`, `3944d8c`): TENANT badge next to name in admin referrers table; Joined + Source columns added; auto-enroll flow on `customer_type=Tenant` HubSpot event; upgrades existing referrers to `isTenant=true`
- **Admin referrals tab + shared loader** (`bcfe620`): new Referrals tab (lazy-loads, status filter pills); `PageLoader` extracted to `src/components/PageLoader.tsx`; `getAllTemplates()` catches P2021 and falls back to in-memory defaults
- **Pool exhaustion + dashboard resilience** (`26de88f`, `635407e`): `pg.Pool max: 1`; dashboard `fetchData` guards `!meRes.ok`; error + retry UI; Typeform `verifySignature` length check
- **Contact-based HubSpot webhook + daily cron** (`a7a993f`): no deals, match by `refereeEmail`; `token_payment_status=Paid` → AGREEMENT_SIGNED; both payments + `move_in_date` passed → COMPLETED; daily cron at 01:00 UTC
- **Production DB**: `CommTemplate` table created manually via SQL in Supabase (migration `20260331101716` was not auto-applied). All env vars set in Vercel. HubSpot Private App configured with 5 webhook subscriptions (added `customer_type`).

## What's Built
- **HubSpot integration**: Private App developer webhooks (NOT Workflows). Subscriptions: `contact.propertyChange` for `token_payment_status`, `first_month_rent`, `tenant_security_deposit`, `customer_type` + `contact.creation`. Daily cron catches any move-ins missed by webhooks. HubSpot is read-only — our DB is source of truth.
- **OTP auth**: email OTP + WhatsApp OTP for referrers (parallel via `notifyOtp()`), password for admins. `after()` built-in in Next.js 16 — no `experimental.after` flag.
- **Button pattern**: all buttons need `btn-base` + variant (e.g. `btn-base btn-pastel-violet`). `btn-base` provides cursor, flex, hover/active. Variant alone has no interactivity.
- **Comms system**: 15 CommTemplate keys across EMAIL/WHATSAPP/UI; auto-seeded; admin-editable without deploy.
- **Admin panel**: 7 tabs (Overview, Referrers, Referrals, Redemptions, Milestones, Tiers, Comms). Neo-brutalist design. Referrals tab lazy-loads on first click with status filter pills.
- **Dashboard hero**: circle 72px avatar (initial letter, tier-colored ring) → click opens inline tier ladder popover. "Hey, {Name}" serif greeting. Code box. WhatsApp + Instagram share side-by-side (2-col grid). No description text — clean.
- **Dashboard quarterly standing**: rank widget, top-5 leaderboard list (opted-in names, anonymous otherwise), opt-in toggle with pill switch.
- **Share text**: rendered server-side with `referralCode`, `lifetimeCount`, `tierBrag`. WA opens `wa.me/?text=...`. Instagram uses Web Share API on mobile; falls back to clipboard copy + opens instagram.com.
- **Ambassador tiers**: Scout (1+), Connector (3+), Ambassador (6+) — defaults, fully admin-configurable. Badge shown on dashboard hero. TIER_COLOR_MAP at module level in dashboard (not inline).
- **Leaderboard**: quarterly, live-computed, public endpoint. Opted-in first names only. `leaderboardOptIn` field on Referrer, toggled via PATCH `/api/referrers/me`.
- **Home page stat band**: `ReferralStatBand` (server, fetches from DB) + `ReferralStatCounter` (client, scroll animation). Placed between HowItWorks and RewardsSection.
- **Backfill**: `docs/leaderboard-backfill.md` — SQL queries for Supabase to populate historical referrals, ReferrerProgress counts, community stat.

## Decisions & Patterns
- **`after()` is built-in in Next.js 16** — do NOT add `experimental.after: true` to `next.config.ts`; it causes a TS error.
- **All buttons need `btn-base` + variant** — never use a variant class alone. `btn-base` provides all interactive behaviour.
- **Comms templates**: use `getTemplate(key)` from `src/lib/comms.ts`. Keys listed above. Variables use `{{name}}` syntax.
- **TIER_COLOR_MAP** — define at module level in client components that use it; never import from `src/lib/ambassadorTiers.ts` in client components (it imports Prisma → build error). Keep it as a local constant.
- **Server components can call Prisma directly** — `ReferralStatBand` is a server component that calls `getTemplate()`. No client fetch needed for server-rendered static-ish data.
- **Scroll animations in Turbopack** — use `el.style.*` inline (not CSS classes) for scroll-triggered animations. Use double-RAF before transitions. See `ReferralStatCounter` for the count-up pattern.
- **`/api/referrers/me` returns leaderboard data** — ambassador tier, allTiers list, quarterly rank/total, opt-in status. Dashboard fetches leaderboard entries separately from `/api/leaderboard`.
- **Instagram share** — Web Share API first (`navigator.share`), fallback to clipboard copy + `window.open('https://www.instagram.com/')`. Show "Caption copied!" feedback for 3s.
- **tierBrag render variable** — `""` if no tier, `"\n\nAs a Flent {Name}, I've personally vouched for these homes."` if tier exists. Rendered server-side into both WA and Instagram share text.
- **Ambassador tiers are derived, not stored** — no `currentTier` column on `Referrer`. Always computed from `lifetimeCompletedCount` vs tier thresholds at read time.
- **Quarterly leaderboard** — uses calendar quarters (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec). Computed from `Referral.completedAt`. Public endpoint, no auth required.
- **OTP delivery**: always use `notifyOtp()` from `notifications.ts` — fires email + WA in parallel, logs to `NotificationLog`. Never call `sendOtpEmail` directly from route handlers.
- **Auth form handlers**: use `try/catch/finally` not `try/finally`. Also use `res.json().catch(() => ({}))` — when API returns a non-JSON 500, bare `res.json()` throws, `finally` silently resets the button, user sees nothing. The catch block must call `setError()`.
- **`getTemplate()` and `getAllTemplates()` never throw** — both fall back to in-memory `DEFAULT_TEMPLATES` if DB unavailable (table missing or connection error). Safe to call anywhere without try/catch.
- **`pg.Pool max: 1`** — always set in `prisma.ts` for serverless. Default is 10; with concurrent Lambda instances this exhausts Supabase Session Pooler's connection limit (`MaxClientsInSessionMode`).
- **Dashboard `fetchData`** — must check `!meRes.ok` before `setData(json)`. A 500 response sets data to `{error: "..."}` which is not `DashboardData` — accessing `data.referrer` crashes the render.
- **`PageLoader`** — shared component at `src/components/PageLoader.tsx`. Pass a `messages: string[]` prop. Both dashboard and admin use it. `LOADING_MESSAGES` array lives at module level in each page file.
- **WhatsApp OTP template**: Meta auth template `referral_otp_verification`, 1 variable (`{{1}}` = OTP). Approved 2026-04-03. Superchat UI doesn't support auth templates — configured directly via Meta dashboard. `sendOtpMetaDirect` is parked (403 — needs Business-type Meta app, not Facebook Login for Business). WA OTP failures are `console.log`, not `console.error`.
- **HubSpot webhook setup**: must use Private App → Webhooks tab (NOT Automation → Workflows). Workflow builder doesn't expose `contact.propertyChange` as a trigger. Webhook URL: `https://flent-referral.vercel.app/api/webhooks/hubspot`.
- **`findReferralByEmail`** — always orders by `createdAt: 'desc'`, excludes COMPLETED. If same referee email appears in multiple referrals (different referrers), most recent wins.
- Resend lazily initialized — never instantiate at module level; fire via `after()` in route handlers
- `window.location.href` for post-auth redirects; `router.push` bypasses proxy cookie check
- Prisma v7: no `url` in datasource block; SSL config in `src/lib/prisma.ts` via adapter options
- Streak resets only on explicit redemption; lifetime count never resets
- Typography: `--font-sans` = Plus Jakarta Sans (body/UI), `--font-serif` = Zin Display (headers only); serif used via `.serif` / `.serif-italic` CSS classes
- UI: cream `#FCFBF7` bg, brand navy `#15102E`, pastel neo-brutalist buttons (3–4px hard shadow), no emojis as structural icons
- **Auth page pattern**: pie-factory.svg overlay at opacity 0.05; logo pill = `{bg: var(--bg), border: 1.5px solid var(--brand), borderRadius: 999}`; card = `{border: 1.5px solid var(--brand), boxShadow: 4px 4px 0 var(--brand)}`
- **Dev bypass**: `NODE_ENV !== 'production'` in `proxy.ts` + `/api/referrers/me` returns stub data including mock leaderboard/tier/share data — `/dashboard` fully viewable locally without auth or DB
- **Multi-tier redemption**: any milestone where `streak >= referralsRequired` is independently claimable; `redeemableMilestones[]` empty when pending exists; streak resets on every claim
- **Admin table cells with badges or codes**: always add `whiteSpace: 'nowrap'` to the `<td>` or `<span>` — text like "Auto-enrolled" and long referral codes wrap at narrow viewport widths

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
