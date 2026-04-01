import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken, COOKIE_NAMES } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getAdminPayload() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.ADMIN)?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const tier = await prisma.ambassadorTier.update({
    where: { id: parseInt(id) },
    data: {
      ...(body.name !== undefined && { name: String(body.name).trim() }),
      ...(body.minReferrals !== undefined && { minReferrals: parseInt(body.minReferrals) }),
      ...(body.colorToken !== undefined && { colorToken: body.colorToken }),
      ...(body.sortOrder !== undefined && { sortOrder: parseInt(body.sortOrder) }),
    },
  })

  return Response.json({ tier })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.ambassadorTier.delete({ where: { id: parseInt(id) } })
  return Response.json({ ok: true })
}
