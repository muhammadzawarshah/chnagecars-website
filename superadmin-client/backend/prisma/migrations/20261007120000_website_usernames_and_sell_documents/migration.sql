-- CreateEnum
CREATE TYPE "SellMediaKind" AS ENUM ('PHOTO', 'REGISTRATION_DOCUMENT');

-- AlterTable
ALTER TABLE "sell_request_images" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "kind" "SellMediaKind" NOT NULL DEFAULT 'PHOTO',
ADD COLUMN     "sizeBytes" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

