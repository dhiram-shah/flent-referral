import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken, COOKIE_NAMES } from '@/lib/auth'

async function getAdminPayload() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.ADMIN)?.value
  if (!token) return null
  return verifyAdminToken(token)
}

const patchSchema = z.object({
  tierNumber: z.number().int().positive().optional(),
  referralsRequired: z.number().int().positive().optional(),
  rewardName: z.string().min(1).optional(),
  rewardDescription: z.string().optional(),
  rewardValue: z.string().optional(),
  requiresExtraInfo: z.boolean().optional(),
  extraInfoLabel: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await getAdminPayload()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const milestone = await prisma.milestoneConfig.update({
    where: { id },
    data: parsed.data,
  })
  return Response.json({ milestone })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await getAdminPayload()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.milestoneConfig.delete({ where: { id } })
  return Response.json({ status: 'deleted' })
}
