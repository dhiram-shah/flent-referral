# Leaderboard & Ambassador Tier Backfill Guide

Use this guide to populate historical data from your Typeform-based referral program
into the new leaderboard and ambassador tier system. Run these queries in the
Supabase SQL editor (Dashboard → SQL Editor → New query).

---

## 1. Understand the data model

| Table | What it powers |
|---|---|
| `Referral` | Quarterly leaderboard (filtered by `completedAt` in the current quarter) |
| `ReferrerProgress` | Ambassador tier (uses `lifetimeCompletedCount`) |
| `CommTemplate` (key: `ui_community_stat`) | Home page referral stat number |
| `Referrer.leaderboardOptIn` | Whether a referrer's name shows on the leaderboard |

---

## 2. Backfill historical completed referrals

Each row in `Referral` with `status = 'COMPLETED'` and a `completedAt` date counts
toward both the quarterly leaderboard and the referrer's ambassador tier.

**Step 1 — Find or create the Referrer record**

If your historical referrers are already in the `Referrer` table (they signed up via
the new system), skip this step. If they are not, insert them first:

```sql
INSERT INTO "Referrer" (
  id, name, phone, email, "referralCode",
  "isTenant", "isActive", "isDisqualified",
  "leaderboardOptIn", "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'Priya Sharma',          -- name
  '9876543210',            -- phone (must be unique)
  'priya@example.com',     -- email (must be unique)
  'PRIYA10',               -- referralCode (must be unique)
  true,                    -- isTenant
  true,                    -- isActive
  false,                   -- isDisqualified
  false,                   -- leaderboardOptIn (update to true after consent)
  '2024-01-15',            -- createdAt (when they originally joined)
  now()
)
ON CONFLICT DO NOTHING;
```

Repeat for each historical referrer.

**Step 2 — Insert completed referrals**

```sql
INSERT INTO "Referral" (
  id, "referrerId", "refereeName", "refereePhone",
  status, "interestedAt", "completedAt",
  "isDisqualified", "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(),
  '<referrerId>',          -- copy from Referrer.id
  'Arjun Mehta',           -- referred person's name
  '9123456789',            -- referred person's phone
  'COMPLETED',
  '2024-03-01',            -- when they showed interest
  '2024-04-15',            -- when they completed (move-in + 1 month) ← THIS DETERMINES QUARTER
  false,
  '2024-03-01',
  now()
)
ON CONFLICT DO NOTHING;
```

> **Important:** `completedAt` determines which quarter the referral counts in.
> Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec.
> To count toward the **current quarter's leaderboard**, set `completedAt` to a date
> in the current quarter.

**Step 3 — Bulk insert from a CSV / spreadsheet**

If you have a spreadsheet of historical data, export it as CSV and use Supabase's
Table Editor → Import, or generate INSERT statements:

```sql
-- Template for bulk insert (repeat VALUES rows)
INSERT INTO "Referral" (
  id, "referrerId", "refereeName", "refereePhone",
  status, "interestedAt", "completedAt",
  "isDisqualified", "createdAt", "updatedAt"
)
VALUES
  (gen_random_uuid(), '<id1>', 'Name 1', '9000000001', 'COMPLETED', '2024-01-10', '2025-01-20', false, '2024-01-10', now()),
  (gen_random_uuid(), '<id2>', 'Name 2', '9000000002', 'COMPLETED', '2024-02-05', '2025-02-18', false, '2024-02-05', now()),
  -- add more rows...
ON CONFLICT DO NOTHING;
```

---

## 3. Sync ReferrerProgress (ambassador tier + streak)

After inserting referrals, recalculate `lifetimeCompletedCount` for all affected referrers.
This is what the ambassador tier system reads.

```sql
-- Recalculate lifetimeCompletedCount for ALL referrers
UPDATE "ReferrerProgress" rp
SET
  "lifetimeCompletedCount" = sub.total,
  "updatedAt" = now()
FROM (
  SELECT
    "referrerId",
    COUNT(*) AS total
  FROM "Referral"
  WHERE status = 'COMPLETED'
    AND "isDisqualified" = false
  GROUP BY "referrerId"
) sub
WHERE rp."referrerId" = sub."referrerId";
```

If a referrer has no `ReferrerProgress` row yet:

```sql
-- Insert missing ReferrerProgress rows
INSERT INTO "ReferrerProgress" ("referrerId", "currentStreakCount", "lifetimeCompletedCount", "updatedAt")
SELECT
  r.id,
  0,  -- streak starts at 0; update manually if needed
  COUNT(rf.id),
  now()
FROM "Referrer" r
LEFT JOIN "Referral" rf
  ON rf."referrerId" = r.id
  AND rf.status = 'COMPLETED'
  AND rf."isDisqualified" = false
GROUP BY r.id
ON CONFLICT ("referrerId") DO UPDATE
  SET "lifetimeCompletedCount" = EXCLUDED."lifetimeCompletedCount",
      "updatedAt" = now();
```

---

## 4. Update the home page community stat

The home page shows a referral count fetched from the `CommTemplate` table.
Update it to reflect your real historical total:

```sql
-- Update the community stat number shown on the home page
UPDATE "CommTemplate"
SET body = '500+', "updatedAt" = now()
WHERE key = 'ui_community_stat';
```

Replace `'500+'` with your actual count (e.g., `'1,200+'`). The admin panel
Comms tab also lets you update this without SQL (Admin → Comms → "Community Stat").

If the row doesn't exist yet (it auto-seeds on first admin visit, but you can force it):

```sql
INSERT INTO "CommTemplate" (key, label, channel, subject, body, variables, "updatedAt")
VALUES (
  'ui_community_stat',
  'Community Stat (Home Page)',
  'UI',
  NULL,
  '500+',
  '[]',
  now()
)
ON CONFLICT (key) DO UPDATE SET body = EXCLUDED.body, "updatedAt" = now();
```

---

## 5. Opt-in existing power users (with their consent)

The leaderboard shows first names only for users who have `leaderboardOptIn = true`.
After confirming consent with your top referrers (WhatsApp/email), opt them in:

```sql
-- Opt in specific referrers by email
UPDATE "Referrer"
SET "leaderboardOptIn" = true, "updatedAt" = now()
WHERE email IN (
  'priya@example.com',
  'karan@example.com',
  'ananya@example.com'
);
```

Users can also toggle this themselves from their dashboard.

---

## 6. Verify

After backfilling, run these queries to confirm:

```sql
-- Check top 10 by lifetime count
SELECT r.name, r.email, rp."lifetimeCompletedCount", rp."currentStreakCount"
FROM "ReferrerProgress" rp
JOIN "Referrer" r ON r.id = rp."referrerId"
ORDER BY rp."lifetimeCompletedCount" DESC
LIMIT 10;

-- Check quarterly counts for current quarter (update dates)
SELECT r.name, COUNT(*) AS quarterly
FROM "Referral" rf
JOIN "Referrer" r ON r.id = rf."referrerId"
WHERE rf.status = 'COMPLETED'
  AND rf."completedAt" >= '2026-04-01'
  AND rf."completedAt" <  '2026-07-01'
GROUP BY r.name
ORDER BY quarterly DESC
LIMIT 10;

-- Check community stat
SELECT body FROM "CommTemplate" WHERE key = 'ui_community_stat';
```

---

## 7. Ambassador tier thresholds (reference)

Default tiers (editable in Admin → Tiers):

| Tier | Name | Min lifetime referrals |
|---|---|---|
| 1 | Scout | 1 |
| 2 | Connector | 3 |
| 3 | Ambassador | 6 |

Tiers are computed dynamically — no DB column stores the current tier.
Changing thresholds in the admin panel takes effect immediately for all users.
