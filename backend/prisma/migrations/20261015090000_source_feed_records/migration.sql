CREATE TABLE "source_feed_records" (
    "source" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "source_feed_records_pkey" PRIMARY KEY ("source", "kind", "externalId")
);
