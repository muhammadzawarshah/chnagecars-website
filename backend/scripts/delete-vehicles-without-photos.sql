-- Permanently deletes every vehicle that has no photo, in any status. Take a database backup first.
-- Images, favourites, history, views and price alerts of these vehicles are deleted with them (ON DELETE CASCADE);
-- enquiries and leads are kept with an empty vehicle. A DealerTrade vehicle is created again by the sync
-- as soon as DealerTrade sends its photos.
-- Run with: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/delete-vehicles-without-photos.sql
BEGIN;
SELECT count(*) AS vehicles_to_delete
FROM vehicles v
WHERE NOT EXISTS (SELECT 1 FROM vehicle_images i WHERE i."vehicleId" = v.id);

DELETE FROM vehicles v
WHERE NOT EXISTS (SELECT 1 FROM vehicle_images i WHERE i."vehicleId" = v.id);
COMMIT;
