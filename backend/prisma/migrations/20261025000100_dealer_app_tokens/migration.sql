-- Additive: existing tables, credentials and API data remain unchanged.
CREATE TABLE "dealer_app_tokens" (
    "id" UUID NOT NULL,
    "dealerId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "scopes" TEXT[] NOT NULL,
    "createdById" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dealer_app_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "dealer_app_tokens_tokenHash_key" ON "dealer_app_tokens"("tokenHash");
CREATE INDEX "dealer_app_tokens_dealerId_createdAt_idx" ON "dealer_app_tokens"("dealerId", "createdAt" DESC);
ALTER TABLE "dealer_app_tokens" ADD CONSTRAINT "dealer_app_tokens_dealerId_fkey"
    FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
