-- Dealer-app snapshots (only some dealers' cars) are kept apart from the full marketplace snapshot.
ALTER TABLE "vehicle_filter_snapshots" ADD COLUMN "dealerScope" TEXT;
CREATE INDEX "vehicle_filter_snapshots_dealerScope_generatedAt_idx" ON "vehicle_filter_snapshots" ("dealerScope", "generatedAt");
