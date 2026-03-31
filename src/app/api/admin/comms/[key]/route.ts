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

const updateSchema = z.object({
  subject: z.string().optional().nullable(),
  body: z.string().min(1),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const payload = await getAdminPayload()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await params
  const body = await request.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const template = await prisma.commTemplate.update({
    where: { key },
    data: {
      subject: parsed.data.subject,
      body: parsed.data.body,
      updatedBy: (payload as { email?: string }).email ?? 'admin',
    },
  }).catch(() => null)

  if (!template) return Response.json({ error: 'Template not found' }, { status: 404 })

  return Response.json({ template })
}
