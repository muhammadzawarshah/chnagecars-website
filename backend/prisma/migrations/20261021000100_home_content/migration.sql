-- Website home page content managed from the super admin console: advert banners, customer
-- testimonials and featured dealers. New tables only; existing data is untouched.
-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('HOME_HERO', 'HOME_DEALERS', 'HOME_BOTTOM');

-- CreateTable
CREATE TABLE "ad_banners" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "placement" "AdPlacement" NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "photoUrl" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "featured_dealers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "about" TEXT,
    "dealerId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "featured_dealers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ad_banners_placement_isActive_sortOrder_idx" ON "ad_banners"("placement", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "testimonials_isActive_sortOrder_idx" ON "testimonials"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "featured_dealers_slug_key" ON "featured_dealers"("slug");

-- CreateIndex
CREATE INDEX "featured_dealers_isActive_sortOrder_idx" ON "featured_dealers"("isActive", "sortOrder");

-- AddForeignKey
ALTER TABLE "featured_dealers" ADD CONSTRAINT "featured_dealers_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

