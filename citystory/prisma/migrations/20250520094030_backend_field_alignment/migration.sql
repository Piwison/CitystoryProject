/*
  Warnings:

  - You are about to drop the column `placeType` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `priceRange` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `authType` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastLogin` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[google_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `place_type` to the `Place` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Place_placeType_idx";

-- DropIndex
DROP INDEX "User_googleId_idx";

-- DropIndex
DROP INDEX "User_googleId_key";

-- AlterTable
ALTER TABLE "Place" DROP COLUMN "placeType",
DROP COLUMN "priceRange",
ADD COLUMN     "place_type" "PlaceType" NOT NULL,
ADD COLUMN     "price_level" INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "authType",
DROP COLUMN "googleId",
DROP COLUMN "lastLogin",
ADD COLUMN     "auth_type" "AuthType" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "google_id" TEXT,
ADD COLUMN     "last_login" TIMESTAMP(3),
ADD COLUMN     "last_name" TEXT;

-- CreateIndex
CREATE INDEX "Place_place_type_idx" ON "Place"("place_type");

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");

-- CreateIndex
CREATE INDEX "User_google_id_idx" ON "User"("google_id");
