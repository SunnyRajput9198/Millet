/*
  Warnings:

  - Added the required column `addressId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'UPI_QR';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "addressId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
