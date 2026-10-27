# DealerTrade automatic server sync

The backend API server automatically captures fresh DealerTrade dealers and stock on startup and every 12 hours. It runs the existing capture → plan → apply → verify pipeline. Source images use their HTTPS upstream URLs. Existing IDs/slugs and blank-field preservation follow the reconciliation policy. Stock missing from a capture is not deleted or marked sold because the upstream traversal is not an atomic snapshot.

No separate worker or hosting platform is required. Start the backend normally with `npm run start:prod` (or `npm run start:dev`). The job starts automatically when a DealerTrade token is available, using `DEALERTRADE_TOKEN` or the existing `.local/dealertrade/token` file. Tokens are never logged.

Optional environment settings:

```dotenv
DEALERTRADE_SYNC_ENABLED=true
DEALERTRADE_TOKEN=<DealerTrade bearer token>
DEALERTRADE_SYNC_INTERVAL_MINUTES=720
```

Set `DEALERTRADE_SYNC_ENABLED=false` to disable it. The interval must be at least five minutes; invalid values fall back to 12 hours. Restart the backend after changing configuration. The standalone worker also loads the job; the database lock prevents overlapping imports.

The backend Docker image includes Python, curl and the capture script. For non-Docker hosting, install Python 3 and curl, retain `scripts/`, `prisma/`, `src/` (the reconciler imports source helpers) and production dependencies, and start from the backend directory. Each step has a 45-minute timeout. The fetcher retries transient API failures and respects rate limits.

A PostgreSQL session advisory lock prevents concurrent automatic syncs across server replicas. Shutdown or loss of the lock connection cancels the current child process. Failed runs retry at the next scheduled interval. A failed apply may leave successfully committed rows; subsequent runs reconcile them. Cache versions and website revalidation are refreshed after any apply attempt, including partial failures. Use shared Redis when worker/API are separate processes. Temporary capture/plan files are removed after a successful run. Failed runs retain their private diagnostic directory; its path is logged. Each step writes a private log there for troubleshooting.

Server logs report each stage, verified completion, or the failed stage and exit code; tokens and raw feed output are excluded from server logs. Diagnostic files may contain source data and should remain private. No live database or server configuration is changed by adding this code. Restart the updated backend with its database available and a valid token to start syncing.

Run `npm run dealertrade:sync:status` from `backend/` for a read-only check of inventory counts, the last raw-source update, the active sync lock and backend health.

## Stock metadata and additional public fields

`GET /api/v1/vehicles/source-summary` returns the upstream `total_stock_count`, `last_updated`, pagination `total`, and the local `fetchedAt`. `GET /api/v1/vehicles` also includes this object under `meta.source`; its existing `meta.total` remains the local, filtered result count. DealerTrade's stock count and pagination total can differ, so neither replaces the other. The upstream `last_updated` timestamp is returned as supplied, without guessing its timezone.

Stock-response `meta` is preserved in `source_feed_records` under `source=dealertrade`, `kind=metadata`, `externalId=stock`, alongside its pagination total. Future extra metadata keys are retained in that JSON snapshot. The job updates it after a successful apply and verifies it against the capture. Vehicle and dealer raw payloads continue to preserve all received keys.

Public vehicle search/detail responses now also expose `videoUrl` (HTTPS only), `priceOnApplication` (boolean or null), `extras`, `comment`, `sourceCreatedAt`, and `sourceUpdatedAt`. Website vehicle detail responses carry the same fields. Missing fields remain null, and raw feeds and private routing fields remain excluded.

Standard colour IDs, hex codes, per-colour stock counts, ID-based filtering and title-case inventory normalization are documented in [app-colour-filtering.md](app-colour-filtering.md). The sync keeps raw source snapshots and applies these display rules to database columns on each run.
