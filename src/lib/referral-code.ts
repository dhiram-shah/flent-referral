import { randomBytes } from 'crypto'

/**
 * Generates a referral code in the format FLENT-[FIRSTNAME]-[4-char alphanumeric]
 * e.g. FLENT-RAHUL-K7X2
 */
export function generateReferralCode(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, '')
  const suffix = randomBytes(3).toString('hex').toUpperCase().slice(0, 4)
  return `FLENT-${firstName}-${suffix}`
}
