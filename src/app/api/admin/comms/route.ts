import { cookies } from 'next/headers'
import { verifyAdminToken, COOKIE_NAMES } from '@/lib/auth'
import { getAllTemplates } from '@/lib/comms'

async function getAdminPayload() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.ADMIN)?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export async function GET() {
  const payload = await getAdminPayload()
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const templates = await getAllTemplates()
  return Response.json({ templates })
}
