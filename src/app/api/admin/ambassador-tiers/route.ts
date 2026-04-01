import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken, COOKIE_NAMES } from '@/lib/auth'
import { getAllTiers } from '@/lib/ambassadorTiers'
import { prisma } from '@/lib/prisma'

async function getAdminPayload() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.ADMIN)?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export async function GET() {
  const payload = await getAdminPayload()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const tiers = await getAllTiers()
  return Response.json({ tiers })
}

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, minReferrals, colorToken, sortOrder } = body

  if (!name?.trim() || minReferrals === undefined) {
    return Response.json({ error: 'name and minReferrals are required' }, { status: 400 })
  }

  const tier = await prisma.ambassadorTier.create({
    data: {
      name: String(name).trim(),
      minReferrals: parseInt(minReferrals),
      colorToken: colorToken ?? 'brand',
      sortOrder: sortOrder ?? 0,
    },
  })

  return Response.json({ tier })
}
