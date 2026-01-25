-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('SHIPPING', 'BILLING');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Address"
ADD COLUMN     "label" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "type" "AddressType" NOT NULL DEFAULT 'SHIPPING',
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;
