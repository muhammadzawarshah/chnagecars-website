-- Dealers whose advertised prices include on-road costs (dealer directory filter). DealerTrade does not send
-- this, so admins set it.
ALTER TABLE "dealers" ADD COLUMN "onRoadCostsIncluded" BOOLEAN NOT NULL DEFAULT false;
