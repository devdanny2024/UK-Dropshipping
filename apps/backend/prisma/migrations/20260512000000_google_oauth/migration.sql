-- Make passwordHash optional for Google OAuth users
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Add googleId for Google OAuth
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_googleId_key" UNIQUE ("googleId");
