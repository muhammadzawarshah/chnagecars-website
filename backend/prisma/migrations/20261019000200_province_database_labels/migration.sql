-- Preserve Prisma/API enum keys while storing canonical province names.
ALTER TYPE "Province" RENAME VALUE 'EASTERN_CAPE' TO 'Eastern Cape';
ALTER TYPE "Province" RENAME VALUE 'FREE_STATE' TO 'Free State';
ALTER TYPE "Province" RENAME VALUE 'GAUTENG' TO 'Gauteng';
ALTER TYPE "Province" RENAME VALUE 'KWAZULU_NATAL' TO 'KwaZulu-Natal';
ALTER TYPE "Province" RENAME VALUE 'LIMPOPO' TO 'Limpopo';
ALTER TYPE "Province" RENAME VALUE 'MPUMALANGA' TO 'Mpumalanga';
ALTER TYPE "Province" RENAME VALUE 'NORTHERN_CAPE' TO 'Northern Cape';
ALTER TYPE "Province" RENAME VALUE 'NORTH_WEST' TO 'North West';
ALTER TYPE "Province" RENAME VALUE 'WESTERN_CAPE' TO 'Western Cape';
