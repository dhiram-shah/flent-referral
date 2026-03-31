-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('INTERESTED', 'AGREEMENT_SIGNED', 'COMPLETED', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'FULFILLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'VIEWER');

-- CreateTable
CREATE TABLE "Referrer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "city" TEXT,
    "referralCode" TEXT NOT NULL,
    "isTenant" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDisqualified" BOOLEAN NOT NULL DEFAULT false,
    "disqualifyNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referrer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeName" TEXT NOT NULL,
    "refereePhone" TEXT NOT NULL,
    "refereeEmail" TEXT,
    "hubspotId" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'INTERESTED',
    "ipAddress" TEXT,
    "isDisqualified" BOOLEAN NOT NULL DEFAULT false,
    "disqualifyNote" TEXT,
    "interestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneConfig" (
    "id" TEXT NOT NULL,
    "tierNumber" INTEGER NOT NULL,
    "referralsRequired" INTEGER NOT NULL,
    "rewardName" TEXT NOT NULL,
    "rewardDescription" TEXT,
    "rewardValue" TEXT,
    "requiresExtraInfo" BOOLEAN NOT NULL DEFAULT false,
    "extraInfoLabel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MilestoneConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "extraInfo" JSONB,
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilledAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferrerProgress" (
    "referrerId" TEXT NOT NULL,
    "currentStreakCount" INTEGER NOT NULL DEFAULT 0,
    "lifetimeCompletedCount" INTEGER NOT NULL DEFAULT 0,
    "currentMilestoneId" TEXT,
    "lastResetAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferrerProgress_pkey" PRIMARY KEY ("referrerId")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpSession" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "referrerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Referrer_phone_key" ON "Referrer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Referrer_email_key" ON "Referrer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Referrer_referralCode_key" ON "Referrer"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_hubspotId_key" ON "Referral"("hubspotId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_refereePhone_idx" ON "Referral"("refereePhone");

-- CreateIndex
CREATE INDEX "Referral_refereePhone_isDisqualified_idx" ON "Referral"("refereePhone", "isDisqualified");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneConfig_tierNumber_key" ON "MilestoneConfig"("tierNumber");

-- CreateIndex
CREATE INDEX "MilestoneConfig_isActive_referralsRequired_idx" ON "MilestoneConfig"("isActive", "referralsRequired");

-- CreateIndex
CREATE INDEX "Redemption_referrerId_idx" ON "Redemption"("referrerId");

-- CreateIndex
CREATE INDEX "Redemption_status_idx" ON "Redemption"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "OtpSession_email_idx" ON "OtpSession"("email");

-- CreateIndex
CREATE INDEX "NotificationLog_referrerId_idx" ON "NotificationLog"("referrerId");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Referrer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Referrer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "MilestoneConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferrerProgress" ADD CONSTRAINT "ReferrerProgress_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Referrer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpSession" ADD CONSTRAINT "OtpSession_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Referrer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Referrer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
