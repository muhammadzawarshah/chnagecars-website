-- Dealer review pages (Google, HelloPeter) stored on the dealer itself instead of only inside each
-- vehicle's source snapshot, so every dealer keeps them, including dealers without stock.
-- AlterTable
ALTER TABLE "dealers" ADD COLUMN     "googleReviewUrl" TEXT,
ADD COLUMN     "hellopeterReviewUrl" TEXT;


-- Backfill from the stored DealerTrade dealer records (https links only).
UPDATE "dealers" d
SET "googleReviewUrl" = CASE WHEN s.payload->>'google_review' ~ '^https://[^\s<>"'']+$' THEN s.payload->>'google_review' END,
    "hellopeterReviewUrl" = CASE WHEN s.payload->>'peter_review' ~ '^https://[^\s<>"'']+$' THEN s.payload->>'peter_review' END
FROM "source_feed_records" s
WHERE s."source" = 'dealertrade' AND s."kind" = 'dealer' AND s."externalId" = d."id";
