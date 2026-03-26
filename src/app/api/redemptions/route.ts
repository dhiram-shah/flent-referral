import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyReferrerToken, COOKIE_NAMES } from '@/lib/auth'
import { notifyRedemptionConfirmed } from '@/lib/notifications'

const schema = z.object({
  milestoneId: z.string(),
  extraInfo: z.record(z.string(), z.string()).optional(),
})

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.REFERRER)?.value
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = verifyReferrerToken(token)
  if (!payload) return Response.json({ error: 'Invalid session' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const { milestoneId, extraInfo } = parsed.data
  const referrerId = payload.sub

  const [referrer, progress, milestone, existingPending] = await Promise.all([
    prisma.referrer.findUnique({ where: { id: referrerId } }),
    prisma.referrerProgress.findUnique({ where: { referrerId } }),
    prisma.milestoneConfig.findUnique({ where: { id: milestoneId } }),
    prisma.redemption.findFirst({
      where: { referrerId, status: 'PENDING' },
    }),
  ])

  if (!referrer || !progress || !milestone) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (existingPending) {
    return Response.json(
      { error: 'You already have a pending redemption. Please wait for it to be fulfilled.' },
      { status: 409 }
    )
  }

  if (progress.currentStreakCount < milestone.referralsRequired) {
    return Response.json(
      { error: 'You have not yet reached this milestone.' },
      { status: 400 }
    )
  }

  if (milestone.requiresExtraInfo && !extraInfo) {
    return Response.json(
      { error: `Additional information required: ${milestone.extraInfoLabel}` },
      { status: 400 }
    )
  }

  const redemption = await prisma.redemption.create({
    data: { referrerId, milestoneId, extraInfo: extraInfo ?? {}, status: 'PENDING' },
  })

  // Notify referrer (async, non-blocking)
  notifyRedemptionConfirmed(referrer, milestone.rewardName).catch(console.error)

  return Response.json({ status: 'success', redemption })
}
