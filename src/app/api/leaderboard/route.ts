import { prisma } from '@/lib/prisma'
import { getAllTiers, computeTier, getCurrentQuarter } from '@/lib/ambassadorTiers'

export async function GET() {
  const { start, end, label, resetsOn } = getCurrentQuarter()

  const [quarterlyGroups, tiers] = await Promise.all([
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
    getAllTiers(),
  ])

  const top20Ids = quarterlyGroups.slice(0, 20).map((g) => g.referrerId)

  const [referrers, progresses] = await Promise.all([
    prisma.referrer.findMany({
      where: { id: { in: top20Ids }, isActive: true },
      select: { id: true, name: true, leaderboardOptIn: true },
    }),
    prisma.referrerProgress.findMany({
      where: { referrerId: { in: top20Ids } },
      select: { referrerId: true, lifetimeCompletedCount: true },
    }),
  ])

  const referrerMap = new Map(referrers.map((r) => [r.id, r]))
  const progressMap = new Map(progresses.map((p) => [p.referrerId, p.lifetimeCompletedCount]))

  const entries = quarterlyGroups.slice(0, 20).map((g, index) => {
    const ref = referrerMap.get(g.referrerId)
    const lifetimeCount = progressMap.get(g.referrerId) ?? 0
    const tier = computeTier(lifetimeCount, tiers)
    return {
      rank: index + 1,
      referrerId: g.referrerId,
      displayName: ref?.leaderboardOptIn ? ref.name.split(' ')[0] : null,
      quarterlyCount: g._count.id,
      tierName: tier?.name ?? null,
      tierColorToken: tier?.colorToken ?? null,
    }
  })

  return Response.json({
    quarter: label,
    resetsOn: resetsOn.toISOString(),
    totalParticipants: quarterlyGroups.length,
    entries,
  })
}
