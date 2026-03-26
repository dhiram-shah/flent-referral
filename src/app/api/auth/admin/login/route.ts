import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  comparePassword,
  signAdminToken,
  COOKIE_NAMES,
  adminCookieOptions,
} from '@/lib/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { email, password } = parsed.data

  const admin = await prisma.adminUser.findUnique({ where: { email } })

  if (!admin || !admin.isActive) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await comparePassword(password, admin.passwordHash)
  if (!valid) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  })

  const token = signAdminToken(admin.id, admin.role)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAMES.ADMIN, token, adminCookieOptions)

  return Response.json({
    status: 'success',
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  })
}
