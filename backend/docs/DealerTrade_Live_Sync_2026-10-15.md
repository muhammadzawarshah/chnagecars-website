# DealerTrade live database sync — 15 October 2026

Target: Railway `graceful-vision / production / Postgres`, used by
`independent-prosperity / production / chnagecars-website`.

The user explicitly requested the complete captured API data and dealer logos on
the live database. No application accounts, authentication credentials, sessions,
or client-created records are copied from the development database.

Before the update, production contained 745 dealers, 30,020 vehicles and no dealer
logo URLs. A full private custom-format PostgreSQL backup was created before any
migration or data mutation; its location and size are recorded in
`backend/.local/live-sync/backup.json`.

The input is the validated DealerTrade capture in
`backend/.local/dealertrade-reconcile/source/`. This is a capture across API pages,
not an atomic export or a claim that subsequent API changes have been synchronized.
API-provided nonempty values win. Missing, null, blank and empty collections
preserve existing production values; zero and false remain valid source values.
Records absent from the capture are preserved.

## Plan and trial

The production-specific plan matched 26,005 vehicles, proposed 12,221 vehicle
inserts, and preserved 4,015 unmatched production vehicles. It includes 763 source
dealers, including 20 new dealers. Fifteen source vehicles lack a usable source
dealer association and are kept in the raw feed table rather than inventing a
dealer. Source inconsistencies remain in the plan's issue report.

Before production application, its full backup was restored into an isolated
local database and the complete batch updater was run there. The existing
independent reconciliation verifier reported:

- 38,226 inventory rows and 763 dealer rows verified;
- 1,713,874 API-provided values checked;
- 172,143 empty-value preservation checks;
- 695,423 gallery references checked;
- 4,015 unobserved vehicles preserved;
- zero mismatches.

The two pending migrations create `source_feed_records` and replace the dealer /
stock-number unique index with a nonunique index. Source vehicle IDs remain
unique. The local Prisma schema engine failed to connect to Railway, so
`scripts/prepare-live-dealertrade.cjs` applies only these reviewed SQL files
transactionally and records their exact SHA-256 migration checksums. It refuses
conflicting migration history and requires a backup.

## Application and logos

`scripts/apply-live-dealertrade.cjs` applies the reviewed plan in transactional
batches with optimistic concurrency checks. It updates only supplied patch
columns, preserves application fields, and uses a checkpoint for restart. Its
input plan hash and source-capture hash must match. Vehicle galleries use exact
source image URLs on production; local development `/media/` paths are never
introduced by this reconciliation.

`scripts/publish-dealer-logos.cjs` uploads validated downloaded public dealer logos
into the existing configured Firebase bucket, under `changecars/dealer-logos/`.
It authenticates with Google's standard service-account OAuth flow, checks upload
MD5 hashes, downloads each public URL, and compares its bytes with the local file.
Only verified published URLs are eligible for production database updates.
The original API `dealer_image` paths remain in the raw feed records.

One upstream logo, Auto Investments North Coast (source dealer 3843), returned
HTTP 403 and has no downloaded file. Existing database logos must be preserved
when an image cannot be downloaded or published.

## Private artifacts

`backend/.local/live-sync/` contains production plan, source links, checkpoint,
before values, published-media manifest and verification reports. It is ignored
by Git. Credential configuration files are mode 0600 and are never included in
reports or command output. The local trial database is separate from both the
development and production databases.

The final production result is established by `reconcile/verification-report.json`
and the separate dealer-logo verification report after the jobs complete. The
trial results above are not a substitute for that final production verification.
