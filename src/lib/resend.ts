import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  return _resend
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'referrals@flent.in'

export async function sendOtpEmail(email: string, name: string, otp: string): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `${otp} is your Flent verification code`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #7C3AED; margin-bottom: 8px;">Hi ${name},</h2>
        <p style="color: #374151; font-size: 16px;">Use the code below to verify your email and join the Flent Referral Program.</p>
        <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #111827; margin: 0;">${otp}</p>
        </div>
        <p style="color: #6B7280; font-size: 14px;">This code expires in 10 minutes. Never share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">Flent · Bangalore · <a href="https://flent.in" style="color: #7C3AED;">flent.in</a></p>
      </div>
    `,
  })
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  referralCode: string,
  dashboardUrl: string
): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Welcome to the Flent Referral Program, ${name.split(' ')[0]}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #7C3AED;">You're in! 🎉</h1>
        <p style="color: #374151; font-size: 16px;">Hey ${name.split(' ')[0]}, your referral account is live. Every friend you refer to Flent brings you closer to amazing rewards.</p>
        <div style="background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); border-radius: 16px; padding: 28px; text-align: center; margin: 24px 0;">
          <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px;">Your Referral Code</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #FFFFFF; margin: 0;">${referralCode}</p>
        </div>
        <p style="color: #374151; font-size: 15px;">Share this code with friends looking for quality co-living in Bangalore. When they move in and complete a month, you unlock rewards — and they keep stacking.</p>
        <a href="${dashboardUrl}" style="display: inline-block; background: #7C3AED; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0;">View My Dashboard →</a>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">Flent · Bangalore · <a href="https://flent.in" style="color: #7C3AED;">flent.in</a></p>
      </div>
    `,
  })
}

export async function sendReferralStatusEmail(
  email: string,
  referrerName: string,
  refereeName: string,
  event: 'interested' | 'signed' | 'completed',
  rewardName?: string
): Promise<void> {
  const templates: Record<string, { subject: string; body: string }> = {
    interested: {
      subject: `${refereeName} just showed interest in Flent!`,
      body: `<p style="color: #374151; font-size: 16px;">Hey ${referrerName.split(' ')[0]}, your referral is moving! <strong>${refereeName}</strong> just submitted an enquiry on Flent using your code. We'll keep you posted.</p>`,
    },
    signed: {
      subject: `${refereeName} signed their agreement — you're almost there!`,
      body: `<p style="color: #374151; font-size: 16px;">Big news! <strong>${refereeName}</strong> has signed their tenancy agreement at Flent. Once they complete their first month, your referral will be fully credited.</p>`,
    },
    completed: {
      subject: `Referral complete — you've unlocked a reward! 🎁`,
      body: `<p style="color: #374151; font-size: 16px;"><strong>${refereeName}</strong> has completed their first month at Flent. Your referral is now fully credited — ${rewardName ? `you've unlocked: <strong>${rewardName}</strong>!` : 'check your dashboard to see your next milestone!'}</p>`,
    },
  }

  const { subject, body } = templates[event]

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #7C3AED;">Referral Update</h2>
        ${body}
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #7C3AED; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0;">View Dashboard →</a>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">Flent · Bangalore · <a href="https://flent.in" style="color: #7C3AED;">flent.in</a></p>
      </div>
    `,
  })
}

export async function sendRedemptionConfirmedEmail(
  email: string,
  name: string,
  rewardName: string
): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Your reward is on its way! 🚀`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #7C3AED;">Your reward is coming!</h1>
        <p style="color: #374151; font-size: 16px;">Hey ${name.split(' ')[0]}, we've processed your redemption for <strong>${rewardName}</strong>. You'll receive it within 7 business days.</p>
        <p style="color: #374151; font-size: 16px;">Your referral counter has been reset — time to start the next streak! 🎮</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #7C3AED; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0;">Start Round 2 →</a>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">Flent · Bangalore · <a href="https://flent.in" style="color: #7C3AED;">flent.in</a></p>
      </div>
    `,
  })
}
