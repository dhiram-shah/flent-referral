import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyReferrerToken, COOKIE_NAMES } from '@/lib/auth'

// GET /api/referrers/me — returns full profile + milestone context
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
    })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.REFERRER)?.value
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = verifyReferrerToken(token)
  if (!payload) return Response.json({ error: 'Invalid session' }, { status: 401 })

  const [referrer, milestones, allRedemptions] = await Promise.all([
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
  ])

  if (!referrer) return Response.json({ error: 'Not found' }, { status: 404 })

  const streakCount = referrer.progress?.currentStreakCount ?? 0
  const pendingRaw = allRedemptions.find(r => r.status === 'PENDING')

  const pendingRedemption = pendingRaw
    ? { milestoneId: pendingRaw.milestoneId, rewardName: pendingRaw.milestone.rewardName, tierNumber: pendingRaw.milestone.tierNumber }
    : null

  // Eligible to claim: streak reached + no pending redemption in flight
  const redeemableMilestones = pendingRedemption
    ? []
    : milestones.filter(m => streakCount >= m.referralsRequired)

  const nextMilestone = milestones.find(m => streakCount < m.referralsRequired) ?? null

  // All fulfilled redemptions as history
  const redeemedHistory = allRedemptions
    .filter(r => r.status === 'FULFILLED')
    .map(r => ({
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

  return Response.json({
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
      lifetimeCount: referrer.progress?.lifetimeCompletedCount ?? 0,
      nextMilestone,
      redeemableMilestones,
      pendingRedemption,
      redeemedHistory,
      totalEarnedValue,
    },
    milestones,
    referrals: referrer.referrals,
  })
}
