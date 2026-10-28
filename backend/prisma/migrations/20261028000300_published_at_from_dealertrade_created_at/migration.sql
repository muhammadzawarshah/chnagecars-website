-- "Recently added" sorts by publishedAt. For DealerTrade vehicles that was the time our sync wrote the row, so
-- thousands of vehicles shared one timestamp. Use DealerTrade's own listing time (created_at) instead.
-- created_at is South African time without a zone; publishedAt is stored as UTC without a zone.
UPDATE "vehicles"
SET "publishedAt" = ((("sourceData" -> 'dealertrade' ->> 'created_at')::timestamp AT TIME ZONE 'Africa/Johannesburg') AT TIME ZONE 'UTC')
WHERE "publishedAt" IS NOT NULL
  AND ("sourceData" -> 'dealertrade' ->> 'created_at') ~ '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$';
