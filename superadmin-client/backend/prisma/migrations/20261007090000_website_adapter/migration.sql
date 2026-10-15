-- CreateTable
CREATE TABLE "vehicle_view_daily" (
    "vehicleId" UUID NOT NULL,
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vehicle_view_daily_pkey" PRIMARY KEY ("vehicleId","day")
);

-- CreateIndex
CREATE INDEX "vehicle_view_daily_day_idx" ON "vehicle_view_daily"("day");

-- AddForeignKey
ALTER TABLE "vehicle_view_daily" ADD CONSTRAINT "vehicle_view_daily_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AlterTable
ALTER TABLE "newsletter_subscribers" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT;

