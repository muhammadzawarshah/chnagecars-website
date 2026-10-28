-- Makes sure the website has 12 featured cars. When fewer than 12 listed cars are featured, random listed
-- cars with a photo and a year are featured until there are 12. Cars already featured stay featured.
-- Run with: psql "$DATABASE_URL" -f scripts/top-up-featured-vehicles.sql
WITH listed AS (
  SELECT v.id, v."isFeatured"
  FROM vehicles v
  JOIN dealers d ON d.id = v."dealerId"
  WHERE v.status IN ('PUBLISHED', 'RESERVED')
    AND d.status = 'APPROVED'
    AND v.year >= 1900
    AND v."primaryImageUrl" IS NOT NULL
),
missing AS (
  SELECT GREATEST(0, 12 - count(*) FILTER (WHERE "isFeatured")) AS n FROM listed
)
UPDATE vehicles
SET "isFeatured" = true, "updatedAt" = now()
WHERE id IN (
  SELECT id FROM listed WHERE NOT "isFeatured" ORDER BY random() LIMIT (SELECT n FROM missing)
)
RETURNING id, title;
