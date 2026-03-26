import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken, COOKIE_NAMES } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.ADMIN)?.value
  if (!token || !verifyAdminToken(token)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') // 'active' | 'disqualified' | 'inactive'
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 25

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { referralCode: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (status === 'disqualified') where.isDisqualified = true
  if (status === 'inactive') where.isActive = false
  if (status === 'active') {
    where.isActive = true
    where.isDisqualified = false
  }

  const [referrers, total] = await Promise.all([
    prisma.referrer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        progress: true,
        _count: {
          select: {
            referrals: { where: { isDisqualified: false, status: 'COMPLETED' } },
          },
        },
      },
    }),
    prisma.referrer.count({ where }),
  ])

  return Response.json({ referrers, total, page, pages: Math.ceil(total / limit) })
}
