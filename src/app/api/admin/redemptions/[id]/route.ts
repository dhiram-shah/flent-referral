import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken, COOKIE_NAMES } from '@/lib/auth'

const schema = z.object({
  status: z.enum(['FULFILLED', 'REJECTED']),
  notes: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.ADMIN)?.value
  const payload = token ? verifyAdminToken(token) : null

  if (!payload || payload.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const redemption = await prisma.redemption.findUnique({
    where: { id },
    include: { referrer: true, milestone: true },
  })

  if (!redemption) return Response.json({ error: 'Not found' }, { status: 404 })
  if (redemption.status !== 'PENDING') {
    return Response.json({ error: 'Redemption is not pending' }, { status: 409 })
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedRedemption = await tx.redemption.update({
      where: { id },
      data: {
        status: parsed.data.status,
        notes: parsed.data.notes,
        fulfilledAt: parsed.data.status === 'FULFILLED' ? new Date() : null,
      },
    })

    // If fulfilled: reset referrer's streak counter
    if (parsed.data.status === 'FULFILLED') {
      await tx.referrerProgress.update({
        where: { referrerId: redemption.referrerId },
        data: {
          currentStreakCount: 0,
          lastResetAt: new Date(),
        },
      })
    }

    return updatedRedemption
  })

  return Response.json({ redemption: updated })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.ADMIN)?.value
  if (!token || !verifyAdminToken(token)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const redemption = await prisma.redemption.findUnique({
    where: { id },
    include: { referrer: true, milestone: true },
  })

  if (!redemption) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ redemption })
}
