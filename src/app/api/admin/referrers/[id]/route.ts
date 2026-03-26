import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken, COOKIE_NAMES } from '@/lib/auth'

async function requireAdmin(role?: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.ADMIN)?.value
  if (!token) return null
  const payload = verifyAdminToken(token)
  if (!payload) return null
  if (role && payload.role !== role) return null
  return payload
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const referrer = await prisma.referrer.findUnique({
    where: { id },
    include: {
      progress: true,
      referrals: { orderBy: { createdAt: 'desc' } },
      redemptions: {
        orderBy: { requestedAt: 'desc' },
        include: { milestone: true },
      },
    },
  })

  if (!referrer) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ referrer })
}

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  isDisqualified: z.boolean().optional(),
  disqualifyNote: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin('ADMIN')
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const referrer = await prisma.referrer.update({
    where: { id },
    data: parsed.data,
  })

  return Response.json({ referrer })
}
