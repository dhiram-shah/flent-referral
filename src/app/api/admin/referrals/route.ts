import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken, COOKIE_NAMES } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.ADMIN)?.value
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyAdminToken(token)
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const referrals = await prisma.referral.findMany({
    where: status ? { status: status as 'INTERESTED' | 'AGREEMENT_SIGNED' | 'COMPLETED' | 'DISQUALIFIED' } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: {
      id: true,
      refereeName: true,
      refereePhone: true,
      refereeEmail: true,
      status: true,
      isDisqualified: true,
      disqualifyNote: true,
      interestedAt: true,
      signedAt: true,
      completedAt: true,
      createdAt: true,
      referrer: { select: { id: true, name: true, email: true, referralCode: true } },
    },
  })

  return Response.json({ referrals })
}
