-- CreateEnum
CREATE TYPE "AdapterHealthStatus" AS ENUM ('UNKNOWN', 'ONLINE', 'OFFLINE');

-- AlterTable
ALTER TABLE "Payment"
ADD COLUMN "gatewayRef" TEXT,
ADD COLUMN "gatewayTxId" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "rawPayload" JSONB;

-- CreateTable
CREATE TABLE "AdapterState" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "AdapterHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "lastCheckAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdapterState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdapterState_domain_key" ON "AdapterState"("domain");

-- CreateIndex
CREATE INDEX "AdapterState_enabled_idx" ON "AdapterState"("enabled");

-- CreateIndex
CREATE INDEX "AdapterState_status_idx" ON "AdapterState"("status");