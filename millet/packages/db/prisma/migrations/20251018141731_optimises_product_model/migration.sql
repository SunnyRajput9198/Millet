/*
  Warnings:

  - You are about to drop the column `isActive` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isFeatured` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `metaDescription` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `metaKeywords` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `metaTitle` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `reviewCount` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `shortDescription` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sku]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Product_isActive_idx";

-- DropIndex
DROP INDEX "public"."Product_isFeatured_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "isActive",
DROP COLUMN "isFeatured",
DROP COLUMN "metaDescription",
DROP COLUMN "metaKeywords",
DROP COLUMN "metaTitle",
DROP COLUMN "rating",
DROP COLUMN "reviewCount",
DROP COLUMN "shortDescription",
DROP COLUMN "updatedAt",
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "price" SET DEFAULT 0,
ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sku" TEXT,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "attributes" DROP NOT NULL,
ALTER COLUMN "attributes" SET DEFAULT '{}';

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
