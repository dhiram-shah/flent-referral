import { Resend } from 'resend'
import { getTemplate, renderTemplate, DASHBOARD_URL } from './comms'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  return _resend
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'referrals@email.flent.in'

export async function sendOtpEmail(email: string, name: string, otp: string): Promise<void> {
  const tpl = await getTemplate('email_otp')
  if (!tpl) return
  const subject = renderTemplate(tpl.subject ?? '{{otp}} is your Flent verification code', { name, otp })
  const html = renderTemplate(tpl.body, { name, otp })
  await getResend().emails.send({ from: FROM, to: email, subject, html })
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  referralCode: string,
  dashboardUrl: string
): Promise<void> {
  const tpl = await getTemplate('email_welcome')
  if (!tpl) return
  const vars = { firstName: name.split(' ')[0], referralCode, dashboardUrl }
  const subject = renderTemplate(tpl.subject ?? 'Welcome to the Flent Referral Program!', vars)
  const html = renderTemplate(tpl.body, vars)
  await getResend().emails.send({ from: FROM, to: email, subject, html })
}

export async function sendReferralStatusEmail(
  email: string,
  referrerName: string,
  refereeName: string,
  event: 'interested' | 'signed' | 'completed',
  rewardName?: string
): Promise<void> {
  const keyMap = {
    interested: 'email_referral_interested',
    signed: 'email_referral_signed',
    completed: 'email_referral_completed',
  }
  const tpl = await getTemplate(keyMap[event])
  if (!tpl) return

  const rewardLine = rewardName
    ? `you've unlocked: <strong>${rewardName}</strong>!`
    : 'check your dashboard to see your next milestone!'

  const vars = {
    firstName: referrerName.split(' ')[0],
    refereeName,
    rewardLine,
    dashboardUrl: DASHBOARD_URL,
  }
  const subject = renderTemplate(tpl.subject ?? 'Referral Update', vars)
  const html = renderTemplate(tpl.body, vars)
  await getResend().emails.send({ from: FROM, to: email, subject, html })
}

export async function sendRedemptionConfirmedEmail(
  email: string,
  name: string,
  rewardName: string
): Promise<void> {
  const tpl = await getTemplate('email_redemption_confirmed')
  if (!tpl) return
  const vars = { firstName: name.split(' ')[0], rewardName, dashboardUrl: DASHBOARD_URL }
  const subject = renderTemplate(tpl.subject ?? 'Your reward is on its way!', vars)
  const html = renderTemplate(tpl.body, vars)
  await getResend().emails.send({ from: FROM, to: email, subject, html })
}
