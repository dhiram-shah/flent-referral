-- AlterTable
ALTER TABLE "Referrer" ADD COLUMN     "leaderboardOptIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AmbassadorTier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "minReferrals" INTEGER NOT NULL,
    "colorToken" TEXT NOT NULL DEFAULT 'brand',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmbassadorTier_pkey" PRIMARY KEY ("id")
);
