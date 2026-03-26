import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken, COOKIE_NAMES } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.ADMIN)?.value
  if (!token || !verifyAdminToken(token)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [
    totalReferrers,
    activeReferrers,
    totalReferrals,
    referralsByStatus,
    pendingRedemptions,
    totalRedemptions,
    recentSignups,
  ] = await Promise.all([
    prisma.referrer.count(),
    prisma.referrer.count({ where: { isActive: true, isDisqualified: false } }),
    prisma.referral.count({ where: { isDisqualified: false } }),
    prisma.referral.groupBy({
      by: ['status'],
      _count: true,
      where: { isDisqualified: false },
    }),
    prisma.redemption.count({ where: { status: 'PENDING' } }),
    prisma.redemption.count(),
    prisma.referrer.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  const statusCounts = Object.fromEntries(
    referralsByStatus.map((r) => [r.status, r._count])
  )

  return Response.json({
    stats: {
      totalReferrers,
      activeReferrers,
      totalReferrals,
      referralsByStatus: statusCounts,
      pendingRedemptions,
      totalRedemptions,
      recentSignups,
    },
  })
}
