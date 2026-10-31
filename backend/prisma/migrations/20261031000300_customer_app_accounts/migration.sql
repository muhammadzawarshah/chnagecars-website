CREATE TABLE "customer_apps" (
 "id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "dealerIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
 "resetUrl" TEXT, "enabled" BOOLEAN NOT NULL DEFAULT true,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
INSERT INTO "customer_apps" ("id", "name", "updatedAt") VALUES ('changecars', 'Change Cars', CURRENT_TIMESTAMP);
ALTER TABLE "users" ADD COLUMN "appId" TEXT NOT NULL DEFAULT 'changecars';
DROP INDEX "users_email_key";
DROP INDEX "users_username_key";
CREATE UNIQUE INDEX "users_appId_email_key" ON "users"("appId", "email");
CREATE UNIQUE INDEX "users_appId_username_key" ON "users"("appId", "username");
ALTER TABLE "users" ADD CONSTRAINT "users_appId_fkey" FOREIGN KEY ("appId") REFERENCES "customer_apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "newsletter_subscribers" ADD COLUMN "appId" TEXT NOT NULL DEFAULT 'changecars';
DROP INDEX "newsletter_subscribers_email_key";
CREATE UNIQUE INDEX "newsletter_subscribers_appId_email_key" ON "newsletter_subscribers"("appId", "email");
