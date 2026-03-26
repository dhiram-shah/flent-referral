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

  const redemptions = await prisma.redemption.findMany({
    orderBy: { requestedAt: 'desc' },
    take: 50,
    include: {
      referrer: { select: { name: true, email: true, phone: true } },
      milestone: { select: { rewardName: true, tierNumber: true, requiresExtraInfo: true } },
    },
  })

  return Response.json({ redemptions })
}
