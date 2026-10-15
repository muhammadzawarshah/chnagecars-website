-- Stock codes are source attributes, not vehicle identities. The API legitimately
-- repeats them within a dealer. Vehicle UUIDs and source record keys stay unique.
DROP INDEX "vehicles_dealerId_stockNumber_key";
CREATE INDEX "vehicles_dealerId_stockNumber_idx" ON "vehicles"("dealerId", "stockNumber");
