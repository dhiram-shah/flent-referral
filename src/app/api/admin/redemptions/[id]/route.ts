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
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.ADMIN)?.value
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!verifyAdminToken(token)) return Response.json({ error: 'Invalid session' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const { status, notes } = parsed.data

  const redemption = await prisma.redemption.update({
    where: { id },
    data: {
      status,
      ...(notes !== undefined ? { notes } : {}),
      ...(status === 'FULFILLED' ? { fulfilledAt: new Date() } : {}),
    },
  })

  return Response.json({ redemption })
}
