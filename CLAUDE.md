@AGENTS.md

## Project
Flent Referral Engine — gamified referral program for Flent (Bangalore co-living). Referrers get unique codes, track friend move-ins, unlock milestone rewards, earn ambassador tiers, and compete on a quarterly leaderboard. Includes admin dashboard.

## Tech Stack
- Next.js 16.2.1 (App Router, Turbopack) · TypeScript 5 · React 19
- Prisma 7.5 (`@prisma/adapter-pg` + `PrismaPg`) · PostgreSQL via Supabase Session Pooler (IPv4)
- Resend (`after()` for async email) · Superchat (WhatsApp) · HubSpot webhooks · Typeform webhooks
- Tailwind CSS v4 · Zin Display Condensed via `next/font/local` (`--font-serif`) · Vercel

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

## Key Files
- `prisma/schema.prisma` — data model (Referrer, Referral, MilestoneConfig, Redemption, ReferrerProgress, OtpSession, AdminUser, NotificationLog, CommTemplate, **AmbassadorTier**)
- `prisma.config.ts` — Prisma v7 config (DATABASE_URL here, NOT in schema datasource block)
- `src/lib/prisma.ts` — PrismaClient with PrismaPg adapter + `ssl: { rejectUnauthorized: false }` (DO NOT remove — required for Supabase)
- `src/lib/otp.ts` — OTP creation with 60s cooldown guard
- `src/lib/resend.ts` — email sending; reads subject+body from `CommTemplate` via `src/lib/comms.ts`
- `src/lib/superchat.ts` — WhatsApp via Superchat API; reads template names from `CommTemplate`
- `src/lib/comms.ts` — **CommTemplate store**: `getTemplate(key)`, `getAllTemplates()`, `renderTemplate(str, vars)`. 14 default keys.
- `src/lib/ambassadorTiers.ts` — `getAllTiers()` (fetches + seeds defaults), `computeTier(lifetimeCount, tiers)`, `getCurrentQuarter()`, `TIER_COLORS` map
- `src/lib/notifications.ts` — fires email + WhatsApp in parallel, logs to DB
- `src/app/api/admin/comms/route.ts` — GET lists + seeds all comms templates
- `src/app/api/admin/comms/[key]/route.ts` — PATCH updates a template; records `updatedBy`
- `src/app/api/admin/ambassador-tiers/route.ts` — GET all tiers, POST create
- `src/app/api/admin/ambassador-tiers/[id]/route.ts` — PATCH update, DELETE
- `src/app/api/leaderboard/route.ts` — GET quarterly top 20; public endpoint; opted-in names only
- `src/app/api/referrers/me/route.ts` — GET profile + milestones + leaderboard data + ambassador tier + share texts; PATCH updates `leaderboardOptIn`
- `src/app/admin/components/CommsTab.tsx` — admin UI for editing all comms templates
- `src/app/admin/components/TiersTab.tsx` — admin UI for ambassador tier CRUD
- `src/app/admin/page.tsx` — 6-tab admin dashboard (Overview, Referrers, Redemptions, Milestones, Tiers, Comms)
- `src/app/dashboard/page.tsx` — referrer dashboard (circle avatar badge, tier popover, code box, WhatsApp + Instagram share, quarterly standing, milestone journey, referrals list)
- `src/components/ReferralStatBand.tsx` — server component; fetches `ui_community_stat`; wraps `ReferralStatCounter`
- `src/components/ReferralStatCounter.tsx` — client component; IntersectionObserver scroll-triggered count-up animation (double-RAF, inline `el.style.*`)
- `src/app/api/webhooks/hubspot/route.ts` — tenant enrollment + referral status transitions
- `src/app/globals.css` — design tokens, `.btn-base`, `.btn-pill*`, `.btn-pastel-*`, `.btn-pill-white`, marquee + ms-glow-pulse animations
- `src/app/fonts/ZinDisplay.otf` — local serif font
- `docs/leaderboard-backfill.md` — SQL guide for backfilling historical referral data into leaderboard + ambassador tiers

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
- `RESEND_FROM_EMAIL` = `referrals@email.flent.in`
- `DATABASE_URL` = Supabase Session Pooler with IPv4 (port 5432, NOT 6543 transaction pooler)
- `SUPERCHAT_API_KEY` + `SUPERCHAT_WORKSPACE_ID` — required for WhatsApp; missing = WA silently skipped
- `SUPERCHAT_TEMPLATE_OTP` — override for OTP WA template name (default: `referral_otp_verification`)

## Recent Changes
- **CommTemplate DB fallback + WA OTP UI** (`b664702`): `getTemplate()` in `comms.ts` now catches all DB errors and returns in-memory defaults — fixes dashboard 500 and WA OTP failure when `CommTemplate` table is missing in prod; `getTemplateName` in `superchat.ts` same guard; login + signup OTP step updated with dual icon (mail + WA) and copy mentioning both channels
- **Robust OTP + WhatsApp channel** (`c650374`): `resend.ts` now checks `{ error }` from `emails.send()` and throws (was silently swallowed); `sendOtpWhatsApp` added to `superchat.ts` using approved Meta auth template `referral_otp_verification` (1 var: OTP); `notifyOtp()` added to `notifications.ts` fires email + WA in parallel; auth routes use `notifyOtp` via `after()`
- **DB fallback fix** (`c31d2c1`): `ReferralStatBand` wraps Prisma call in try/catch — build succeeds when DB unreachable at Vercel build time; falls back to `'500+'`
- **Stat counter + hero redesign** (`7efd7f0`): scroll-triggered count-up animation in `ReferralStatCounter`; dashboard hero → circle avatar badge + tier popover; Instagram share added alongside WhatsApp
- **Leaderboard + ambassador tiers** (`99145c6`): `AmbassadorTier` model, quarterly leaderboard, `leaderboardOptIn` on `Referrer`, admin Tiers tab, `ui_instagram_share_text` CommTemplate key
- **Production DB**: migration `20260401025526_add_ambassador_leaderboard` was baselined + applied to Supabase on 2026-04-03. `CommTemplate` table may not exist in prod yet — `getTemplate()` falls back to in-memory defaults gracefully.

## What's Built
- **OTP auth**: email OTP + WhatsApp OTP for referrers (parallel via `notifyOtp()`), password for admins. `after()` built-in in Next.js 16 — no `experimental.after` flag.
- **Button pattern**: all buttons need `btn-base` + variant (e.g. `btn-base btn-pastel-violet`). `btn-base` provides cursor, flex, hover/active. Variant alone has no interactivity.
- **Comms system**: 14 CommTemplate keys across EMAIL/WHATSAPP/UI; auto-seeded; admin-editable without deploy.
- **Admin panel**: 6 tabs. Neo-brutalist design — logo pill + "Admin" badge in nav; pill-shaped tab bar; `1.5px solid var(--brand)` + `2px 2px 0 var(--brand)` hard shadow on all cards.
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
- **`getTemplate()` never throws** — falls back to in-memory `DEFAULT_TEMPLATES` if DB unavailable. Safe to call from server components and route handlers without try/catch.
- **WhatsApp OTP template**: Meta auth template `referral_otp_verification`, 1 variable (`{{1}}` = OTP). Approved 2026-04-03. Superchat UI doesn't support auth templates — configured directly via Meta dashboard.
- Resend lazily initialized — never instantiate at module level; fire via `after()` in route handlers
- `window.location.href` for post-auth redirects; `router.push` bypasses proxy cookie check
- Prisma v7: no `url` in datasource block; SSL config in `src/lib/prisma.ts` via adapter options
- Streak resets only on explicit redemption; lifetime count never resets
- Typography: `--font-sans` = Plus Jakarta Sans (body/UI), `--font-serif` = Zin Display (headers only); serif used via `.serif` / `.serif-italic` CSS classes
- UI: cream `#FCFBF7` bg, brand navy `#15102E`, pastel neo-brutalist buttons (3–4px hard shadow), no emojis as structural icons
- **Auth page pattern**: pie-factory.svg overlay at opacity 0.05; logo pill = `{bg: var(--bg), border: 1.5px solid var(--brand), borderRadius: 999}`; card = `{border: 1.5px solid var(--brand), boxShadow: 4px 4px 0 var(--brand)}`
- **Dev bypass**: `NODE_ENV !== 'production'` in `proxy.ts` + `/api/referrers/me` returns stub data including mock leaderboard/tier/share data — `/dashboard` fully viewable locally without auth or DB
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
