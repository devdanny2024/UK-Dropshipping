-- CreateTable
CREATE TABLE "MagicLoginCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLoginCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MagicLoginCode_email_code_idx" ON "MagicLoginCode"("email", "code");
