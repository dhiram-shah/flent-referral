/**
 * Run with: npx tsx scripts/seed-admin.ts
 *
 * Creates the initial admin users and milestone tiers.
 * Run once after first deployment, then manage via admin dashboard.
 */

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding admin users and milestones...\n')

  // ── Admin users ──────────────────────────────────────────────────────────
  const admins = [
    { email: 'demand@flent.in', name: 'Demand Team', password: 'ChangeMe123!', role: 'ADMIN' as const },
    { email: 'marketing@flent.in', name: 'Marketing Team', password: 'ChangeMe123!', role: 'VIEWER' as const },
  ]

  for (const admin of admins) {
    const passwordHash = await bcrypt.hash(admin.password, 12)
    await prisma.adminUser.upsert({
      where: { email: admin.email },
      update: {},
      create: { email: admin.email, name: admin.name, passwordHash, role: admin.role },
    })
    console.log(`✅ Admin: ${admin.email} (${admin.role}) — default password: ${admin.password}`)
  }

  // ── Milestone tiers ──────────────────────────────────────────────────────
  const tiers = [
    { tierNumber: 1, referralsRequired: 1, rewardName: '₹3,000 Amazon Voucher', rewardDescription: 'Amazon gift card, delivered via email', rewardValue: '₹3,000', requiresExtraInfo: false },
    { tierNumber: 2, referralsRequired: 2, rewardName: '₹5,000 Swiggy Credits', rewardDescription: 'Swiggy credits added to your account', rewardValue: '₹5,000', requiresExtraInfo: true, extraInfoLabel: 'Your Swiggy registered phone number' },
    { tierNumber: 3, referralsRequired: 4, rewardName: 'Apple AirPods', rewardDescription: 'AirPods (2nd Gen) couriered to your address', rewardValue: '₹14,900', requiresExtraInfo: true, extraInfoLabel: 'Full delivery address with pincode' },
    { tierNumber: 4, referralsRequired: 7, rewardName: '₹15,000 Travel Voucher', rewardDescription: 'MakeMyTrip / Cleartrip voucher', rewardValue: '₹15,000', requiresExtraInfo: false },
    { tierNumber: 5, referralsRequired: 10, rewardName: '₹25,000 Experience Voucher', rewardDescription: 'Your choice: travel, shopping, or dining', rewardValue: '₹25,000', requiresExtraInfo: true, extraInfoLabel: 'Preferred reward type (travel / shopping / dining)' },
  ]

  for (const tier of tiers) {
    await prisma.milestoneConfig.upsert({
      where: { tierNumber: tier.tierNumber },
      update: {},
      create: { ...tier, isActive: true },
    })
    console.log(`🎁 Tier ${tier.tierNumber}: ${tier.rewardName}`)
  }

  console.log('\n✅ Seed complete. Change admin passwords immediately after first login!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
