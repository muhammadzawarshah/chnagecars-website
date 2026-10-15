# DealerTrade import

Production API: `https://dealertrade.co.za`. The supplied October 2026 PDF describes
two read-only POST endpoints: `/api/apk/dealers` and `/api/apk/stock/by-dealers`.
Both actually return paginated responses; the importer fetches every page and checks
the reported total and uniqueness before producing an importable snapshot.
Each fetch starts a fresh snapshot; use `dealertrade:fetch -- --resume` only to
resume an interrupted run. Previous page directories are retained locally.

From `backend/`:

```sh
# Set DEALERTRADE_TOKEN in the process environment, or supply .local/dealertrade/token (mode 0600).
npm run dealertrade:fetch
npm run prisma:deploy
npm run dealertrade:import
npm run dealertrade:enrich
npm run dealertrade:images
npm run dealertrade:sync-images
npm run dealertrade:verify
```

`backend/.local/` and `public/media/dealertrade/` are ignored by Git. Raw page
responses, merged snapshots, import/verification reports and the SQLite image
manifest are under `.local/dealertrade/`. Back up the database before importing.
The token is sent only to the production API, never to the image CDN.

Every complete dealer and stock record is retained in `source_feed_records`,
including records lacking enough trustworthy information for normalized inventory.
Vehicle `sourceData.dealertrade` also preserves the complete original API row;
previous XML source fields remain intact. Exact external vehicle IDs match existing
cars; their database IDs, URLs, enquiries and favourites remain intact. Existing
dealer IDs follow the previous feed's deterministic identity convention. Imports
never delete unrelated vehicles or dealers. API galleries replace the previous
single-image feed gallery for that vehicle; user-uploaded images are retained.

The API does **not** supply vehicle year or colour. Existing verified values are
preserved; missing values stay null. The PDF documents transmission IDs 1/2 as
Manual/Automatic, but gives no fuel ID dictionary: numeric fuel IDs are retained in
the raw record, and existing verified normalized fuel values are preserved.
Variant introduction dates are never substituted for an individual car's year.
Variants with a valid, consistent source introduction date are normalized separately;
their `yearFrom` is that introduction year. Shared specifications are normalized
only when source listings agree. Conflicts and invalid introduction dates are
listed in `enrichment-report.json`. Body categories follow the source listing URL.
Decimal specifications that cannot fit the schema's integer columns remain in the
raw record without rounding. Manufacturer variant names and all extra equipment,
comments, tyre sizes, video URLs and other fields remain available in raw JSON.

Rows without a valid positive price, known dealer, make/model or condition stay in
the raw-record table and are listed in `import-report.json`. No fabricated price or
dealer is used to publish them. Imported active cars are published; API-inactive
previously published cars are archived. Cars absent from this snapshot are retained
because this API does not document whether absence means sold or deleted.

Photo downloads use exactly `cdn_url + photos[]`. Files are keyed by SHA-256 of the
complete source URL and installed atomically after checking image signatures and
file completeness. Identical URLs from the previous feed reuse verified local
files through hard links. A Cloudflare 403 preflight stops network downloads and
still completes local reuse; blocked remote URLs remain visible and are never
counted as downloaded or replaced with a fake photo. Exit status is nonzero while
any downloads remain pending or failed.

After CDN access is restored, rerun `dealertrade:images -- --retry-failed`, then
`dealertrade:sync-images` and `dealertrade:verify`. For local reuse without network
access use `dealertrade:images -- --reuse-only`. The downloaded media directory
must travel with the website when moving the local installation.

The verifier checks exact raw JSON equality for every API record, unique vehicle
identities, normalized prices, complete photo positions, primary-photo consistency,
and local file presence/size. It separately reports unknown years, colours, fuel
types and photos still using the remote CDN. Successful verification establishes
fidelity to the supplied sources; it cannot certify facts omitted by those sources.

## Independent reconciliation

The current API-authoritative update policy is implemented by these commands:

```sh
npm run dealertrade:reconcile:fetch
npm run dealertrade:reconcile:plan
npm run dealertrade:reconcile:apply
npm run dealertrade:reconcile:verify
```

`reconcile:fetch -- --resume` resumes completed dealer partitions from an interrupted
capture. Stock is fetched in small documented `dealer_ids` partitions, with
count/identity checks and recovery of duplicate pagination boundaries through
individual dealer requests. The source remains live, so capture is per partition,
not an atomic snapshot of the provider's database. Absent rows are preserved.

The update rule is recursive: provided nonempty values replace old values;
missing keys, null, whitespace-only text and empty arrays/objects preserve old
values. Numeric zero and boolean false are valid values. A nonempty photo array
replaces the imported gallery; an empty one preserves it. Custom uploaded images,
application IDs, URLs, lifecycle state and counters are preserved. New records use
normal application defaults where the API supplies no value.

Every source field is retained in the reconciled JSON payload in
`source_feed_records` and `Vehicle.sourceData.dealertrade`. Original responses
remain in `.local/dealertrade-reconcile/source/`. Typed columns receive documented
or direct mappings: price, mileage, stockno/stockNumber, featured/isFeatured,
image_count/imageCount, transmission IDs, condition/type, specifications and
catalogue/dealer links. API image_count is retained even when it disagrees with
the supplied photos[] length. A discount equal to price is not a promotion; its
exact original amount remains in JSON. Unknown numeric fuel IDs remain in JSON
without inventing a fuel enum mapping. Car year/colour fields absent from the API
preserve the existing values.

Upstream stock codes can repeat within a dealer. The schema indexes
`(dealerId, stockNumber)` without making it unique; vehicle UUIDs and source record
keys remain unique. Stock numbers now carry nonempty API stockno values, while
external vehicle identity remains in sourceData.vehicle_id.

The plan records full before/after values, blank preservation expectations,
protected image-column hashes and all unobserved inventory. Applying uses
optimistic vehicle versions, per-vehicle transactions and a source-file checksum.
Verification checks each supplied API value independently, all mapped/preserved
columns, dealer branches, variants, galleries, custom image preservation and
untouched rows. Constrained or ambiguous source values remain in exact JSON form
and are listed in the plan issues; they are not replaced with fabricated values.

Artifacts: `.local/dealertrade-reconcile/{plan-summary.json,changes.csv,
apply-report.json,verification-report.json,verification-mismatches.json}`. Large
vehicle plans use per-row NDJSON to handle the complete gallery dataset.
`dealertrade:reconcile:test` checks blank preservation, valid zero/false values,
nested partial updates and source-array replacement. The older seed/verifier
commands describe the historical import and assume its original stock-ID and
snapshot conventions; the `reconcile:*` commands implement the current policy.

To compare the complete existing inventory with a fresh API traversal without
importing or updating database records:

```sh
DEALERTRADE_OUTPUT_DIR=.local/dealertrade-audit npm run dealertrade:fetch
npm run dealertrade:audit
```

The audit enforces read-only PostgreSQL connections and reads inventory, galleries,
dealer branches, catalogue relationships, and raw records in a repeatable-read
transaction. It compares all imported API rows, every API gallery position and
locally available file, and preserved years/colours against the historical XML
and its existing normalization dictionary. It separately checks all older XML
inventory still outside the API snapshot. Original raw JSON is compared in full;
normalized checks cover only fields with an explicit source or documented mapping.
Missing fields are reported rather than treated as verified values.

Results are in `.local/dealertrade-audit/audit-report.json`, with per-record
differences in `differences.csv` and `differences.ndjson`. Additional files list
older inventory absent from the current API, records without a feed source,
missing source fields and inconsistencies in upstream photo metadata. API changes
since import are classified separately from incorrect database values.
The fetcher rejects changing page totals. If the API is actively changing and no
fixed source export is available, `dealertrade:fetch -- --resume --workers 1
--observe-changing` (with the same separate output directory) preserves an explicit
audit-only `stock-observed.json` plus traversal metadata. It deduplicates observed
records and never emits an importable `stock-all.json`. The auditor labels absent
IDs as not observed, without inferring that they have been removed or sold.

Original website observations, when available, are recorded in
`.local/dealertrade-audit/website/evidence.json`. A browsable homepage, aggregate
counts or a historical XML export cannot establish current per-car equality.
If the original site's detail pages are blocked, full independent website
verification requires access to those pages or the client's read-only source
database/export. The report explicitly records whether that verification occurred.

## Local dealer logos

Run `node --import tsx prisma/sync-dealertrade-logos.ts` from `backend` after
capturing the dealer feed in `.local/dealertrade-reconcile/source/dealers.json`.
The script downloads `dealer_image` from the feed's CHANGECARS image host, validates
each full image, and stores it under `public/media/dealertrade/logos/` using a hash
of the exact source URL. Matching dealers receive a local `/media/` logo URL;
missing or failed images never replace an existing database logo. Existing local
files are validated and reused on subsequent runs. Before values and a per-dealer
result manifest are saved in `.local/dealertrade-reconcile/`.

These media files are gitignored: include `public/media/dealertrade/` when moving
the local site and database to another machine.

## Download remaining source photos from database URLs

The private `.local/dealertrade/remote-db-urls.ndjson` manifest contains the exact
distinct original-site image URLs exported from the local database. To resume
the local-only download:

```sh
python3 scripts/download-dealertrade.py \
  --urls-file .local/dealertrade/remote-db-urls.ndjson \
  --workers 12 --batch-size 250 --reserve-gib 20 --retry-failed
```

Run from `backend`. Check `.local/dealertrade/bulk-download-job.json` and
`.local/dealertrade/download-progress.json` before restarting: the downloader uses
an exclusive lock and will reject a concurrent worker. Live logs are in
`.local/dealertrade/bulk-download.log`; completed or failed downloads are recorded
in `images.sqlite`. Downloaded files remain in `public/media/dealertrade/` at the
repository root. The worker validates image files, retries normal transfer
failures and leaves a free-space reserve. It does not update PostgreSQL URLs,
upload to Firebase, or publish assets to GitHub/Vercel.
