ALTER TABLE "users" ADD COLUMN "accountType" TEXT NOT NULL DEFAULT 'PRIVATE_SELLER';
UPDATE "users" SET "accountType" = 'DEALER' WHERE "role" = 'DEALER';
ALTER TABLE "users" ADD CONSTRAINT "users_accountType_check" CHECK ("accountType" IN ('PRIVATE_SELLER', 'DEALER'));
