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

const createSchema = z.object({
  tierNumber: z.number().int().positive(),
  referralsRequired: z.number().int().positive(),
  rewardName: z.string().min(1),
  rewardDescription: z.string().optional(),
  rewardValue: z.string().optional(),
  requiresExtraInfo: z.boolean().default(false),
  extraInfoLabel: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function GET() {
  const payload = await getAdminPayload()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const milestones = await prisma.milestoneConfig.findMany({
    orderBy: { tierNumber: 'asc' },
  })
  return Response.json({ milestones })
}

export async function POST(request: NextRequest) {
  const payload = await getAdminPayload()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const milestone = await prisma.milestoneConfig.create({ data: parsed.data })
  return Response.json({ milestone }, { status: 201 })
}
