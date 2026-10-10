CREATE TABLE "vehicle_filter_snapshots" (
 "revision" TEXT NOT NULL PRIMARY KEY,
 "total" INTEGER NOT NULL,
 "sha256" TEXT NOT NULL,
 "compressedBytes" INTEGER NOT NULL,
 "content" BYTEA NOT NULL,
 "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
