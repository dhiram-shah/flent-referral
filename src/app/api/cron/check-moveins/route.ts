/**
 * Daily cron — marks referrals as COMPLETED when:
 *   - status is AGREEMENT_SIGNED
 *   - HubSpot contact has first_month_rent=Paid + tenant_security_deposit=Paid
 *   - move_in_date has now passed
 *
 * Runs daily at 06:30 IST (01:00 UTC) via Vercel Cron.
 * Secured with CRON_SECRET env var.
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchContactByEmail, markReferralCompleted } from '@/app/api/webhooks/hubspot/route'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // All referrals waiting on move-in
  const pending = await prisma.referral.findMany({
    where: { status: 'AGREEMENT_SIGNED', isDisqualified: false },
    select: {
      id: true, status: true, referrerId: true, refereeName: true, refereeEmail: true,
      referrer: {
        select: {
          id: true, name: true, email: true, phone: true,
          progress: { select: { currentStreakCount: true, lifetimeCompletedCount: true } },
        },
      },
    },
  })

  let completed = 0
  const errors: string[] = []

  for (const referral of pending) {
    if (!referral.refereeEmail) continue

    try {
      const contact = await searchContactByEmail(referral.refereeEmail)
      if (!contact) continue

      if (contact.firstMonthRent !== 'Paid' || contact.securityDeposit !== 'Paid') continue

      if (!contact.moveInDate) continue
      const moveInDate = isNaN(Number(contact.moveInDate))
        ? new Date(contact.moveInDate)
        : new Date(Number(contact.moveInDate))
      if (moveInDate > new Date()) continue

      await markReferralCompleted(referral)
      completed++
    } catch (err) {
      errors.push(`referral ${referral.id}: ${String(err)}`)
      console.error('[CronCheckMoveins] failed for', referral.id, err)
    }
  }

  console.log(`[CronCheckMoveins] processed=${pending.length} completed=${completed} errors=${errors.length}`)

  return Response.json({ processed: pending.length, completed, errors })
}
