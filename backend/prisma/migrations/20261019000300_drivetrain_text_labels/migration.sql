-- Store drivetrain as plain text so Prisma and the API return "4x2"/"4x4" as-is
-- (Prisma enum keys cannot start with a digit). Existing values already use these labels.
ALTER TABLE "variant_specifications" ALTER COLUMN "drivetrain" TYPE TEXT USING "drivetrain"::text;
ALTER TABLE "vehicles" ALTER COLUMN "drivetrain" TYPE TEXT USING "drivetrain"::text;
DROP TYPE "Drivetrain";

ALTER TABLE "variant_specifications" ADD CONSTRAINT "variant_specifications_drivetrain_check"
  CHECK ("drivetrain" IN ('FWD', 'RWD', 'AWD', '4x2', '4x4'));
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_drivetrain_check"
  CHECK ("drivetrain" IN ('FWD', 'RWD', 'AWD', '4x2', '4x4'));
