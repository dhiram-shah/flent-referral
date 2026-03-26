import { NextRequest } from 'next/server'

// GET /api/milestones — public, used on landing page and sign-up flow
export async function GET(_req: NextRequest) {
  const { prisma } = await import('@/lib/prisma')

  const milestones = await prisma.milestoneConfig.findMany({
    where: { isActive: true },
    orderBy: { tierNumber: 'asc' },
    select: {
      id: true,
      tierNumber: true,
      referralsRequired: true,
      rewardName: true,
      rewardDescription: true,
      rewardValue: true,
      requiresExtraInfo: true,
    },
  })

  return Response.json({ milestones })
}
