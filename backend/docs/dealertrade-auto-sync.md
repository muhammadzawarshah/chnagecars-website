# DealerTrade automatic server sync

The backend API server automatically captures fresh DealerTrade dealers and stock on startup and every 10 minutes. It runs the existing capture → plan → apply → verify pipeline. Source images use their HTTPS upstream URLs. Existing IDs/slugs and blank-field preservation follow the reconciliation policy. Stock missing from a capture is preserved because traversal is not an atomic snapshot. After verification, cleanup deletes only explicitly disabled/removed DealerTrade vehicles and captured available vehicles with no image records; it requires at least 98% reported coverage. The full run then picks 12 eligible featured cars, excluding known coming-soon placeholders.

Only real changes are written. DealerTrade re-stamps `updated_at` on whole batches of unchanged stock, so a difference in `updated_at` alone does not update a vehicle, its raw record or its gallery; when another field changes, the new `updated_at` is stored with it. Vehicles with nothing to change are skipped without a database transaction (`unchanged` in the apply report).

`isFeatured` is chosen by ChangeCars after full sync and is never taken from the DealerTrade `featured` flag.

Vehicles need a photo to be listed. A new DealerTrade vehicle without photos is not created; it is created by the first run that receives its photos. A listed vehicle that has no photo at all is set to `DRAFT` and marked `sourceData.hiddenNoPhotos`; once photos arrive the run lists it again. Vehicles drafted by hand are never listed by the sync.

No separate worker or hosting platform is required. Start the backend normally with `npm run start:prod` (or `npm run start:dev`). The job starts automatically when a DealerTrade token is available, using `DEALERTRADE_TOKEN` or the existing `.local/dealertrade/token` file. Tokens are never logged.

Optional environment settings:

```dotenv
DEALERTRADE_SYNC_ENABLED=true
DEALERTRADE_TOKEN=<DealerTrade bearer token>
DEALERTRADE_SYNC_INTERVAL_MINUTES=10
DEALERTRADE_QUICK_SYNC_MINUTES=2
DEALERTRADE_QUICK_CACHE_MINUTES=15
```

A full capture takes about 20 minutes, so a **quick sync** also runs every `DEALERTRADE_QUICK_SYNC_MINUTES` (default 2; `0` disables it). It reads DealerTrade's first stock page, which holds the newest 100 listings (`created_at` descending; the API ignores `per_page`), and runs the same plan → apply → verify pipeline on those rows only (`DEALERTRADE_RECONCILE_SCOPE=source`). New listings therefore appear within a few minutes, with the same photo, catalogue and verification rules. The quick sync does not rename shared makes, models or variants; the full sync does. It logs only when something was created or updated, and on HTTP 429 it waits for `Retry-After` (at least one minute) without an error.

The full and quick sync never write at the same time: both take a second advisory lock while planning, applying and verifying, and the quick sync skips a run while the full sync holds it. A full capture can be older than rows the quick sync stored meanwhile; such rows (stored `updated_at` newer than the captured one) are skipped by the full run instead of being overwritten with older data.

Set `DEALERTRADE_SYNC_ENABLED=false` to disable both. The interval must be at least five minutes; invalid values fall back to 10 minutes. A run that takes longer than the interval is never overlapped; the next run starts after it finishes. Restart the backend after changing configuration. The standalone worker also loads the job; the database lock prevents overlapping imports.

The backend Docker image includes Python, curl and the capture script. For non-Docker hosting, install Python 3 and curl, retain `scripts/`, `prisma/`, `src/` (the reconciler imports source helpers) and production dependencies, and start from the backend directory. Each step has a 45-minute timeout. The fetcher retries transient API failures and respects rate limits.

A PostgreSQL session advisory lock prevents concurrent automatic syncs across server replicas. Shutdown or loss of the lock connection cancels the current child process. Failed runs retry at the next scheduled interval. A failed apply may leave successfully committed rows; subsequent runs reconcile them. Cache versions and website revalidation are refreshed after any apply attempt, including partial failures. Use shared Redis when worker/API are separate processes. Temporary capture/plan files are removed after a successful run. Failed runs retain their private diagnostic directory; its path is logged. Each step writes a private log there for troubleshooting.

Server logs report each stage, verified completion, or the failed stage and exit code; tokens and raw feed output are excluded from server logs. Diagnostic files may contain source data and should remain private. No live database or server configuration is changed by adding this code. Restart the updated backend with its database available and a valid token to start syncing.

Run `npm run dealertrade:sync:status` from `backend/` for a read-only check of inventory counts, the last raw-source update, the active sync lock and backend health.

## Stock metadata and additional public fields

`GET /api/v1/vehicles/source-summary` returns the upstream `total_stock_count`, `last_updated`, pagination `total`, and the local `fetchedAt`. `GET /api/v1/vehicles` also includes this object under `meta.source`; its existing `meta.total` remains the local, filtered result count. DealerTrade's stock count and pagination total can differ, so neither replaces the other. The upstream `last_updated` timestamp is returned as supplied, without guessing its timezone.

Stock-response `meta` is preserved in `source_feed_records` under `source=dealertrade`, `kind=metadata`, `externalId=stock`, alongside its pagination total. Future extra metadata keys are retained in that JSON snapshot. The job updates it after a successful apply and verifies it against the capture. Vehicle and dealer raw payloads continue to preserve all received keys.

Public vehicle search/detail responses now also expose `videoUrl` (HTTPS only), `priceOnApplication` (boolean or null), `extras`, `comment`, `sourceCreatedAt`, and `sourceUpdatedAt`. Website vehicle detail responses carry the same fields. Missing fields remain null, and raw feeds and private routing fields remain excluded.

Standard colour IDs, hex codes, per-colour stock counts, ID-based filtering and title-case inventory normalization are documented in [app-colour-filtering.md](app-colour-filtering.md). The sync keeps raw source snapshots and applies these display rules to database columns on each run.

New vehicles, and existing vehicles missing a coordinate component, inherit the confirmed South African latitude/longitude of their own branch. Complete vehicle locations are preserved. Missing or invalid branch coordinates are never guessed.

Quick-sync cache invalidations are throttled to 15 minutes by default; set `DEALERTRADE_QUICK_CACHE_MINUTES=0` to publish every successful change immediately. Full sync always invalidates the vehicle/catalogue caches.

Confirmed GPS for 947 local head-office branches is versioned in `src/infrastructure/dealertrade/dealer-gps.json`. Migration `20261031000100_confirmed_dealer_gps` fills missing existing branch/vehicle coordinates. Reconciliation uses the same map for subsequently created branches; vehicles inherit branch coordinates on the next run. Complete existing coordinates remain unchanged.
