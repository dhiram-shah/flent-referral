import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyReferrerToken, COOKIE_NAMES } from '@/lib/auth'
import { getTemplate, renderTemplate } from '@/lib/comms'
import { getAllTiers, computeTier, getCurrentQuarter } from '@/lib/ambassadorTiers'

// GET /api/referrers/me — returns full profile + milestone context + leaderboard data
export async function GET(_req: NextRequest) {
  // ── Dev bypass — return stub data so dashboard is viewable without auth ──
  if (process.env.NODE_ENV !== 'production') {
    const devMilestones = [
      { id: 'ms1', tierNumber: 1, referralsRequired: 1, rewardName: 'Swiggy Voucher', rewardDescription: 'Order a feast on us', rewardValue: '500', requiresExtraInfo: false },
      { id: 'ms2', tierNumber: 2, referralsRequired: 3, rewardName: 'Zepto Credits', rewardDescription: 'Stock up your pantry', rewardValue: '1000', requiresExtraInfo: false },
      { id: 'ms3', tierNumber: 3, referralsRequired: 5, rewardName: 'Boat Earbuds', rewardDescription: 'Premium wireless earbuds', rewardValue: '2000', requiresExtraInfo: false },
      { id: 'ms4', tierNumber: 4, referralsRequired: 8, rewardName: 'Flight Tickets', rewardDescription: 'Round-trip within India', rewardValue: '5000', requiresExtraInfo: false },
      { id: 'ms5', tierNumber: 5, referralsRequired: 12, rewardName: 'iPhone 16', rewardDescription: 'Grand prize — all yours', rewardValue: '80000', requiresExtraInfo: false },
    ]
    return Response.json({
      waShareText: `Hey! I've already referred 5 friends to Flent and they're really happy living there! 🏠\n\nUse my code *DEV123* when you enquire.\n\nhttps://flent.in`,
      igShareText: `Living in Bangalore? I've already referred 5 friends to @flentliving and they love it 🏠\n\nUse my code DEV123 when you enquire at flent.in\n\nAs a Flent Connector, I've personally vouched for these homes.`,
      referrer: { id: 'dev', name: 'Dev User', email: 'dev@flent.in', phone: '9999999999', referralCode: 'DEV123', isTenant: true },
      progress: {
        streakCount: 3,
        lifetimeCount: 5,
        nextMilestone: devMilestones[2],
        redeemableMilestones: [devMilestones[0], devMilestones[1]],
        pendingRedemption: null,
        redeemedHistory: [
          { id: 'rd1', milestoneId: 'ms1', rewardName: 'Swiggy Voucher', tierNumber: 1, rewardValue: '500', fulfilledAt: '2025-01-15T10:00:00.000Z', requestedAt: '2025-01-10T10:00:00.000Z' },
        ],
        totalEarnedValue: 500,
      },
      milestones: devMilestones,
      referrals: [
        { id: 'ref1', refereeName: 'Arjun Mehta', refereePhone: '98765XXXXX', status: 'COMPLETED', interestedAt: new Date().toISOString() },
        { id: 'ref2', refereeName: 'Priya Sharma', refereePhone: '87654XXXXX', status: 'AGREEMENT_SIGNED', interestedAt: new Date().toISOString() },
        { id: 'ref3', refereeName: 'Rohan Gupta', refereePhone: '76543XXXXX', status: 'INTERESTED', interestedAt: new Date().toISOString() },
      ],
      leaderboard: {
        ambassadorTier: { name: 'Connector', colorToken: 'success' },
        leaderboardOptIn: false,
        allTiers: [
          { id: 1, name: 'Scout', minReferrals: 1, colorToken: 'info' },
          { id: 2, name: 'Connector', minReferrals: 3, colorToken: 'success' },
          { id: 3, name: 'Ambassador', minReferrals: 6, colorToken: 'brand' },
        ],
        quarterly: {
          rank: 4,
          total: 12,
          quarterlyCount: 3,
          quarter: 'Q2 2026',
          resetsOn: new Date(2026, 6, 1).toISOString(),
        },
      },
    })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.REFERRER)?.value
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = verifyReferrerToken(token)
  if (!payload) return Response.json({ error: 'Invalid session' }, { status: 401 })

  const { start, end, label: qLabel, resetsOn } = getCurrentQuarter()

  const [referrer, milestones, allRedemptions, waShareTpl, igShareTpl, allTiers, quarterlyGroups] = await Promise.all([
    prisma.referrer.findUnique({
      where: { id: payload.sub },
      include: {
        progress: true,
        referrals: {
          orderBy: { createdAt: 'desc' },
          where: { isDisqualified: false },
          select: {
            id: true,
            refereeName: true,
            refereePhone: true,
            status: true,
            interestedAt: true,
            signedAt: true,
            completedAt: true,
          },
        },
      },
    }),
    prisma.milestoneConfig.findMany({
      where: { isActive: true },
      orderBy: { tierNumber: 'asc' },
    }),
    prisma.redemption.findMany({
      where: { referrerId: payload.sub },
      orderBy: { requestedAt: 'desc' },
      select: {
        id: true,
        milestoneId: true,
        status: true,
        requestedAt: true,
        fulfilledAt: true,
        milestone: { select: { rewardName: true, tierNumber: true, rewardValue: true } },
      },
    }),
    getTemplate('ui_wa_share_text'),
    getTemplate('ui_instagram_share_text'),
    getAllTiers(),
    prisma.referral.groupBy({
      by: ['referrerId'],
      where: {
        status: 'COMPLETED',
        completedAt: { gte: start, lt: end },
        isDisqualified: false,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ])

  if (!referrer) return Response.json({ error: 'Not found' }, { status: 404 })

  const streakCount = referrer.progress?.currentStreakCount ?? 0
  const lifetimeCount = referrer.progress?.lifetimeCompletedCount ?? 0
  const pendingRaw = allRedemptions.find((r) => r.status === 'PENDING')

  const pendingRedemption = pendingRaw
    ? { milestoneId: pendingRaw.milestoneId, rewardName: pendingRaw.milestone.rewardName, tierNumber: pendingRaw.milestone.tierNumber }
    : null

  const redeemableMilestones = pendingRedemption
    ? []
    : milestones.filter((m) => streakCount >= m.referralsRequired)

  const nextMilestone = milestones.find((m) => streakCount < m.referralsRequired) ?? null

  const redeemedHistory = allRedemptions
    .filter((r) => r.status === 'FULFILLED')
    .map((r) => ({
      id: r.id,
      milestoneId: r.milestoneId,
      rewardName: r.milestone.rewardName,
      tierNumber: r.milestone.tierNumber,
      rewardValue: r.milestone.rewardValue ?? null,
      fulfilledAt: r.fulfilledAt?.toISOString() ?? null,
      requestedAt: r.requestedAt.toISOString(),
    }))

  const totalEarnedValue = redeemedHistory.reduce((sum, r) => {
    if (!r.rewardValue) return sum
    const num = parseFloat(r.rewardValue.replace(/[^0-9.]/g, ''))
    return isNaN(num) ? sum : sum + num
  }, 0)

  // ── Leaderboard / ambassador tier ──────────────────────────────────────────
  const ambassadorTier = computeTier(lifetimeCount, allTiers)
  const tierBrag = ambassadorTier ? `\n\nAs a Flent ${ambassadorTier.name}, I've personally vouched for these homes.` : ''

  const renderVars = { referralCode: referrer.referralCode, lifetimeCount: String(lifetimeCount), tierBrag }
  const waShareText = renderTemplate(
    waShareTpl?.body ?? `Hey! I've already referred ${lifetimeCount} friends to Flent and they're really happy! 🏠\n\nUse my code *{{referralCode}}* when you enquire.\n\nhttps://flent.in`,
    renderVars
  )
  const igShareText = renderTemplate(
    igShareTpl?.body ?? `Living in Bangalore? I've referred ${lifetimeCount} friends to @flentliving and they love it 🏠\n\nUse my code {{referralCode}} when you enquire at flent.in`,
    renderVars
  )

  const userQuarterlyEntry = quarterlyGroups.find((g) => g.referrerId === referrer.id)
  const quarterlyCount = userQuarterlyEntry?._count.id ?? 0
  const quarterlyRank = userQuarterlyEntry ? quarterlyGroups.indexOf(userQuarterlyEntry) + 1 : null
  const quarterlyTotal = quarterlyGroups.length

  return Response.json({
    waShareText,
    igShareText,
    referrer: {
      id: referrer.id,
      name: referrer.name,
      email: referrer.email,
      phone: referrer.phone,
      referralCode: referrer.referralCode,
      isTenant: referrer.isTenant,
    },
    progress: {
      streakCount,
      lifetimeCount,
      nextMilestone,
      redeemableMilestones,
      pendingRedemption,
      redeemedHistory,
      totalEarnedValue,
    },
    milestones,
    referrals: referrer.referrals,
    leaderboard: {
      ambassadorTier: ambassadorTier
        ? { name: ambassadorTier.name, colorToken: ambassadorTier.colorToken }
        : null,
      allTiers: allTiers.map((t) => ({ id: t.id, name: t.name, minReferrals: t.minReferrals, colorToken: t.colorToken })),
      leaderboardOptIn: referrer.leaderboardOptIn,
      quarterly: {
        rank: quarterlyRank,
        total: quarterlyTotal,
        quarterlyCount,
        quarter: qLabel,
        resetsOn: resetsOn.toISOString(),
      },
    },
  })
}

// PATCH /api/referrers/me — update leaderboardOptIn
export async function PATCH(req: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    return Response.json({ ok: true })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.REFERRER)?.value
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = verifyReferrerToken(token)
  if (!payload) return Response.json({ error: 'Invalid session' }, { status: 401 })

  const body = await req.json()
  if (typeof body.leaderboardOptIn !== 'boolean') {
    return Response.json({ error: 'leaderboardOptIn must be a boolean' }, { status: 400 })
  }

  await prisma.referrer.update({
    where: { id: payload.sub },
    data: { leaderboardOptIn: body.leaderboardOptIn },
  })

  return Response.json({ ok: true })
}
