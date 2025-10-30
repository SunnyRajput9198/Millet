/*
  Warnings:

  - The values [PAYPAL] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[transactionId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `transactionId` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'REFUND');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CARD', 'COD', 'BANK_TRANSFER', 'WALLET');
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TABLE "Transaction" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "bankReferenceNo" TEXT,
ADD COLUMN     "cardBrand" TEXT,
ADD COLUMN     "cardLast4" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "screenshotUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "upiTransactionId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL,
ALTER COLUMN "transactionId" SET NOT NULL;

-- CreateTable
CREATE TABLE "payment_configs" (
    "id" TEXT NOT NULL,
    "upiId" TEXT,
    "upiQrCodeUrl" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "accountHolderName" TEXT,
    "bankName" TEXT,
    "branchName" TEXT,
    "razorpayKeyId" TEXT,
    "razorpayKeySecret" TEXT,
    "stripePublicKey" TEXT,
    "stripeSecretKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoVerifyPayments" BOOLEAN NOT NULL DEFAULT false,
    "minOrderAmount" DOUBLE PRECISION,
    "maxOrderAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transactionId_key" ON "Transaction"("transactionId");

-- CreateIndex
CREATE INDEX "Transaction_orderId_idx" ON "Transaction"("orderId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_transactionId_idx" ON "Transaction"("transactionId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
