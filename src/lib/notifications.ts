/**
 * Unified notification sender — fires both email and WhatsApp in parallel
 * and logs results to the DB. Never throws — failures are logged.
 */

import { prisma } from './prisma'
import * as email from './resend'
import * as wa from './superchat'

type NotifEvent =
  | 'WELCOME'
  | 'REFERRAL_INTERESTED'
  | 'REFERRAL_SIGNED'
  | 'REFERRAL_COMPLETED'
  | 'REDEMPTION_CONFIRMED'

interface Referrer {
  id: string
  name: string
  email: string
  phone: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flent.in/referral-program'
const DASHBOARD_URL = `${APP_URL}/dashboard`

async function log(referrerId: string, channel: string, event: string, status: string) {
  await prisma.notificationLog
    .create({ data: { referrerId, channel, event, status } })
    .catch(console.error)
}

async function fire(
  referrerId: string,
  event: NotifEvent,
  emailFn: () => Promise<void>,
  waFn: () => Promise<void>
): Promise<void> {
  const [emailResult, waResult] = await Promise.allSettled([emailFn(), waFn()])

  await log(referrerId, 'EMAIL', event, emailResult.status === 'fulfilled' ? 'SENT' : 'FAILED')
  await log(referrerId, 'WHATSAPP', event, waResult.status === 'fulfilled' ? 'SENT' : 'FAILED')

  if (emailResult.status === 'rejected') {
    console.error(`[Notify] Email ${event} failed:`, emailResult.reason)
  }
  if (waResult.status === 'rejected') {
    console.error(`[Notify] WhatsApp ${event} failed:`, waResult.reason)
  }
}

export async function notifyWelcome(referrer: Referrer, referralCode: string): Promise<void> {
  await fire(
    referrer.id,
    'WELCOME',
    () => email.sendWelcomeEmail(referrer.email, referrer.name, referralCode, DASHBOARD_URL),
    () => wa.sendWelcomeWhatsApp(referrer.phone, referrer.name, referralCode, DASHBOARD_URL)
  )
}

export async function notifyReferralInterested(
  referrer: Referrer,
  refereeName: string
): Promise<void> {
  await fire(
    referrer.id,
    'REFERRAL_INTERESTED',
    () => email.sendReferralStatusEmail(referrer.email, referrer.name, refereeName, 'interested'),
    () => wa.sendReferralInterestedWhatsApp(referrer.phone, referrer.name, refereeName)
  )
}

export async function notifyReferralSigned(
  referrer: Referrer,
  refereeName: string
): Promise<void> {
  await fire(
    referrer.id,
    'REFERRAL_SIGNED',
    () => email.sendReferralStatusEmail(referrer.email, referrer.name, refereeName, 'signed'),
    () => wa.sendReferralSignedWhatsApp(referrer.phone, referrer.name, refereeName)
  )
}

export async function notifyReferralCompleted(
  referrer: Referrer,
  refereeName: string,
  rewardName?: string
): Promise<void> {
  await fire(
    referrer.id,
    'REFERRAL_COMPLETED',
    () =>
      email.sendReferralStatusEmail(
        referrer.email,
        referrer.name,
        refereeName,
        'completed',
        rewardName
      ),
    () =>
      wa.sendMilestoneUnlockedWhatsApp(
        referrer.phone,
        referrer.name,
        rewardName ?? 'your next reward',
        DASHBOARD_URL
      )
  )
}

export async function notifyRedemptionConfirmed(
  referrer: Referrer,
  rewardName: string
): Promise<void> {
  await fire(
    referrer.id,
    'REDEMPTION_CONFIRMED',
    () => email.sendRedemptionConfirmedEmail(referrer.email, referrer.name, rewardName),
    () => wa.sendRedemptionFulfilledWhatsApp(referrer.phone, referrer.name, rewardName)
  )
}
