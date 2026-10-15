-- Hand-written: things Prisma's schema language cannot express.

-- Free-text search on listing titles (ILIKE '%word%') 
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "vehicles_title_trgm_idx" ON "vehicles" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "articles_title_trgm_idx" ON "articles" USING GIN ("title" gin_trgm_ops);

-- Partial indexes for the public search hot path (only visible listings) 
CREATE INDEX IF NOT EXISTS "vehicles_public_recent_idx" ON "vehicles" ("publishedAt" DESC, "id" DESC) WHERE "status" IN ('PUBLISHED', 'RESERVED');
CREATE INDEX IF NOT EXISTS "vehicles_public_price_idx" ON "vehicles" ("price", "id") WHERE "status" IN ('PUBLISHED', 'RESERVED');
CREATE INDEX IF NOT EXISTS "vehicles_public_mileage_idx" ON "vehicles" ("mileage", "id") WHERE "status" IN ('PUBLISHED', 'RESERVED');
CREATE INDEX IF NOT EXISTS "vehicles_public_popular_idx" ON "vehicles" ("popularityScore" DESC, "id" DESC) WHERE "status" IN ('PUBLISHED', 'RESERVED');
CREATE INDEX IF NOT EXISTS "vehicles_public_geo_idx" ON "vehicles" ("latitude", "longitude") WHERE "status" IN ('PUBLISHED', 'RESERVED') AND "latitude" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "vehicles_reserved_until_idx" ON "vehicles" ("reservedUntil") WHERE "status" = 'RESERVED';
CREATE INDEX IF NOT EXISTS "offers_active_expiry_idx" ON "offers" ("expiresAt") WHERE "status" IN ('SUBMITTED', 'UPDATED', 'PENDING');
CREATE INDEX IF NOT EXISTS "outbox_pending_idx" ON "outbox_events" ("availableAt") WHERE "status" = 'PENDING';

-- Data integrity (NFR-10) 
ALTER TABLE "vehicles"
  ADD CONSTRAINT "vehicles_price_positive" CHECK ("price" > 0),
  ADD CONSTRAINT "vehicles_special_price_valid" CHECK ("specialPrice" IS NULL OR ("specialPrice" > 0 AND "specialPrice" < "price")),
  ADD CONSTRAINT "vehicles_mileage_non_negative" CHECK ("mileage" >= 0),
  ADD CONSTRAINT "vehicles_year_range" CHECK ("year" BETWEEN 1900 AND 2100),
  ADD CONSTRAINT "vehicles_counters_non_negative" CHECK ("viewCount" >= 0 AND "enquiryCount" >= 0 AND "favouriteCount" >= 0);

ALTER TABLE "offers" ADD CONSTRAINT "offers_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "counter_offers" ADD CONSTRAINT "counter_offers_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "deals" ADD CONSTRAINT "deals_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "valuations" ADD CONSTRAINT "valuations_range_ordered" CHECK ("estimateLow" <= "estimateMid" AND "estimateMid" <= "estimateHigh");
ALTER TABLE "bidding_sessions" ADD CONSTRAINT "bidding_sessions_window" CHECK ("closesAt" > "opensAt");
ALTER TABLE "sell_requests" ADD CONSTRAINT "sell_requests_mileage_non_negative" CHECK ("mileage" >= 0);
ALTER TABLE "generations" ADD CONSTRAINT "generations_years" CHECK ("yearTo" IS NULL OR "yearTo" >= "yearFrom");
ALTER TABLE "variants" ADD CONSTRAINT "variants_years" CHECK ("yearTo" IS NULL OR "yearTo" >= "yearFrom");

-- A feature is assigned to exactly one catalogue level or vehicle (FR-50).
ALTER TABLE "feature_assignments" ADD CONSTRAINT "feature_assignments_single_target" CHECK (
  num_nonnulls("makeId", "modelId", "generationId", "variantId", "vehicleId") = 1
);
-- No duplicate assignment of the same feature to the same target.
CREATE UNIQUE INDEX IF NOT EXISTS "feature_assignments_unique_target" ON "feature_assignments" (
  "featureId", COALESCE("makeId", "modelId", "generationId", "variantId", "vehicleId")
);

-- One live (scheduled/open) bidding process per sell request.
CREATE UNIQUE INDEX IF NOT EXISTS "bidding_sessions_one_live_per_request" ON "bidding_sessions" ("sellRequestId") WHERE "status" IN ('SCHEDULED', 'OPEN');
-- At most one open counter-offer per offer.
CREATE UNIQUE INDEX IF NOT EXISTS "counter_offers_one_open" ON "counter_offers" ("offerId") WHERE "status" = 'OPEN';
