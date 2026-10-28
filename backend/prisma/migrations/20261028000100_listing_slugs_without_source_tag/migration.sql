-- Vehicle and dealer slugs drop the import-source tag: "name-fbook-123" / "name-dealertrade-123" become "name-123".
-- The trailing number is the row's own ID, so the new slugs stay unique; old links resolve via currentListingSlug().
UPDATE "vehicles"
SET "slug" = regexp_replace("slug", '-(fbook|dealertrade)-(\d+)$', '-\2')
WHERE "slug" ~ '-(fbook|dealertrade)-\d+$';

UPDATE "dealers"
SET "slug" = regexp_replace("slug", '-(fbook|dealertrade)-(\d+)$', '-\2')
WHERE "slug" ~ '-(fbook|dealertrade)-\d+$';
