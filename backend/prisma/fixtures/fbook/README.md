# Full CHANGECARS feed

`source.xml` is the original user-provided export, copied without alteration.
It contains 30,011 unique vehicles from 744 dealers and one image URL per vehicle.
The parser strips leading whitespace only to accept the XML declaration.

From `backend/`:

```sh
npm run prisma:generate
npm run prisma:deploy
npm run feed:prepare
npm run feed:images -- --workers 32
npm run db:seed:fbook
npm run feed:verify
```

Images download to the website's `public/media/fbook/`; copy this folder along
with the website when moving environments. Downloads resume from valid existing
files. `images.json` and `download-report.json` record the outcome of each source
URL. Uppercase image extensions are retried as lowercase paths; the original URL
remains preserved. Failed downloads exit nonzero and remain visible in the report; rerun to
retry them. Seed uses downloaded paths where available, otherwise the original
remote URL. Rerun the seed after finishing downloads to switch all image URLs to
local paths.

The seed creates approved dealers and their branches, makes/models, body
categories, published vehicles, and ready images using deterministic UUIDs.
The first 12 feed listings are featured locally to populate the homepage.
Upserts preserve row IDs and do not duplicate records or delete other data.
The original listing fields (including source IDs/URLs and dealer address/phone)
are retained in `Vehicle.sourceData`. `stockNumber` retains the source vehicle ID.
No dealer login accounts are invented. Missing emails use reserved `.invalid`
addresses that cannot receive mail.

Missing specifications remain unknown: fuel OTHER, transmission UNKNOWN,
drivetrain null, engine null. No specifications are inferred from titles.
5,122 blank years, three year=0 records, and one mileage=-4 are stored as null
in normalized columns, with originals preserved in sourceData. Website adapters
use year=0 and mileage=-1 only as display sentinels, shown as Unknown.
Prices are whole ZAR; a sale price becomes a special only when lower than price.
Availability and condition are validated; no feed rows are silently dropped.
Listed/published dates reflect local import time because the feed has no dates.
Dealer branch data uses the first listing for each dealer, while every listing's
original location is retained on the vehicle and in sourceData.

Downloaded media and generated JSON/reports are git-ignored; source XML and
import scripts are included so the seed can be reproduced. Downloaded assets
may total several GB. `seed-report.json` reports imports and any errors.

Optional: use `ARCHIVE_SETUP_DEMO=true npm run db:seed:fbook` to hide only the
nine sample listings created by the initial local setup. They remain archived
in the database. Feed cars and all other records are unaffected.

Blocked original image URLs use the source website's locally saved
`/img/feed-image-unavailable.png` placeholder. These retain their errors in the
manifest/report and are not counted as successful original-image downloads.

For an existing import, avoid rewriting all vehicle data when only media changes:

```sh
npm run feed:images -- --workers 32
ARCHIVE_SETUP_DEMO=true npm run feed:sync-images
npm run feed:verify
```

`feed:sync-images` validates that every manifest entry has a local image or
placeholder, then updates vehicle and image rows in parameterized SQL batches.
`media-sync-report.json` records the final counts. If downloads exit nonzero,
inspect `download-report.json`; the available images can still be synced, with
reported blocked URLs displayed using the local placeholder.

Current local verification: all 30,011 feed records and 744 dealers match the
source; 30,000 original images are local, 11 source URLs are blocked/unavailable
and use the local placeholder, and no imported listing depends on remote media.
The nine setup demo cars are archived. Full reports live alongside this guide.
