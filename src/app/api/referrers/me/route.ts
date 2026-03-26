import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyReferrerToken, COOKIE_NAMES } from '@/lib/auth'

// GET /api/referrers/me — returns full profile + milestone context
export async function GET(_req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.REFERRER)?.value
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = verifyReferrerToken(token)
  if (!payload) return Response.json({ error: 'Invalid session' }, { status: 401 })

  const [referrer, milestones] = await Promise.all([
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
        redemptions: {
          orderBy: { requestedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            requestedAt: true,
            fulfilledAt: true,
            milestone: { select: { rewardName: true, tierNumber: true } },
          },
        },
      },
    }),
    prisma.milestoneConfig.findMany({
      where: { isActive: true },
      orderBy: { tierNumber: 'asc' },
    }),
  ])

  if (!referrer) return Response.json({ error: 'Not found' }, { status: 404 })

  const streakCount = referrer.progress?.currentStreakCount ?? 0
  const pendingRedemption = referrer.redemptions.find((r) => r.status === 'PENDING')

  // Find current unlocked milestone and next milestone
  const unlockedMilestone = [...milestones]
    .reverse()
    .find((m) => streakCount >= m.referralsRequired)

  const nextMilestone = milestones.find((m) => streakCount < m.referralsRequired)

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
      unlockedMilestone: unlockedMilestone ?? null,
      nextMilestone: nextMilestone ?? null,
      canRedeem: !!unlockedMilestone && !pendingRedemption,
      hasPendingRedemption: !!pendingRedemption,
    },
    milestones,
    referrals: referrer.referrals,
    recentRedemptions: referrer.redemptions,
  })
}
