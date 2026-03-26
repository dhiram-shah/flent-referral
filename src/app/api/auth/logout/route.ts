import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/auth'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAMES.REFERRER)
  return Response.json({ status: 'logged_out' })
}
