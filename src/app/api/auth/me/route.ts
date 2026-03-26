import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyReferrerToken, COOKIE_NAMES } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.REFERRER)?.value

  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = verifyReferrerToken(token)
  if (!payload) return Response.json({ error: 'Invalid session' }, { status: 401 })

  const referrer = await prisma.referrer.findUnique({
    where: { id: payload.sub },
    include: {
      progress: true,
      referrals: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          refereeName: true,
          refereePhone: true,
          status: true,
          isDisqualified: true,
          interestedAt: true,
          signedAt: true,
          completedAt: true,
        },
      },
    },
  })

  if (!referrer || !referrer.isActive) {
    return Response.json({ error: 'Account not found or inactive' }, { status: 404 })
  }

  return Response.json({ referrer })
}
