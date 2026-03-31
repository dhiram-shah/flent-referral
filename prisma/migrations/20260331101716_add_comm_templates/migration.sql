-- CreateTable
CREATE TABLE "CommTemplate" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "CommTemplate_pkey" PRIMARY KEY ("key")
);
