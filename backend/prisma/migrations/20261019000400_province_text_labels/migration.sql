-- Store province as plain text so Prisma and the API return "KwaZulu-Natal" as-is instead of
-- the enum key "KWAZULU_NATAL". Existing values already use these names; indexes are rebuilt in place.
ALTER TABLE "branches" ALTER COLUMN "province" TYPE TEXT USING "province"::text;
ALTER TABLE "dealers" ALTER COLUMN "province" TYPE TEXT USING "province"::text;
ALTER TABLE "sell_requests" ALTER COLUMN "province" TYPE TEXT USING "province"::text;
ALTER TABLE "vehicles" ALTER COLUMN "province" TYPE TEXT USING "province"::text;
ALTER TABLE "bidding_sessions" ALTER COLUMN "eligibleProvinces" DROP DEFAULT;
ALTER TABLE "bidding_sessions" ALTER COLUMN "eligibleProvinces" TYPE TEXT[] USING "eligibleProvinces"::text[];
ALTER TABLE "bidding_sessions" ALTER COLUMN "eligibleProvinces" SET DEFAULT ARRAY[]::TEXT[];
DROP TYPE "Province";

ALTER TABLE "branches" ADD CONSTRAINT "branches_province_check" CHECK ("province" IN ('Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'));
ALTER TABLE "dealers" ADD CONSTRAINT "dealers_province_check" CHECK ("province" IN ('Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'));
ALTER TABLE "sell_requests" ADD CONSTRAINT "sell_requests_province_check" CHECK ("province" IN ('Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'));
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_province_check" CHECK ("province" IN ('Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'));
ALTER TABLE "bidding_sessions" ADD CONSTRAINT "bidding_sessions_eligible_provinces_check" CHECK ("eligibleProvinces" <@ ARRAY['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape']::TEXT[]);
