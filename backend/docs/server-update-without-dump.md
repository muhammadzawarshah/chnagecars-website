# Update an existing server without restoring a dump

Use the existing production database. Do not run `db:seed`, `prisma migrate reset`, or restore a local dump. Take a production backup before updating.

## Backend settings

Keep existing production database, auth, storage and mail secrets. Never copy the local DATABASE_URL or local JWT secrets onto production.

```dotenv
NODE_ENV=production
DEALERTRADE_SYNC_ENABLED=true
DEALERTRADE_TOKEN=<valid DealerTrade bearer token, no Bearer prefix>
DEALERTRADE_SYNC_INTERVAL_MINUTES=10
DEALERTRADE_QUICK_SYNC_MINUTES=2
DEALERTRADE_QUICK_CACHE_MINUTES=15
API_PUBLIC_URL=https://changecarapi.wowcar.co.th
PUBLIC_WEB_URL=https://<your-customer-website>
CORS_ORIGINS=https://<your-customer-website>,https://<your-admin-website>
WEB_REVALIDATE_URL=https://<your-customer-website>/api/revalidate
WEB_ADAPTER_KEY=<same existing secret as frontend and superadmin>
```

Also retain the actual server `DATABASE_URL`, shared `REDIS_URL`, `JWT_ACCESS_SECRET`, and working storage credentials. If `DATABASE_READ_URL` is set, ensure that replica follows this production database. Use `RUN_WORKER_IN_API=true` for a single API service without a separate worker if outbox jobs are required; DealerTrade sync starts in the API independently of this flag. Configure a persistent writable `DEALERTRADE_MEDIA_DIR` for mirrored dealer logos (default `backend/media`); retain the default mirror setting.

Frontend: `API_URL=https://changecarapi.wowcar.co.th/api/v1`, matching `WEB_ADAPTER_KEY`, actual `SUPERADMIN_URL`.
Superadmin: same `API_URL` and shared key, `SESSION_COOKIE_SECURE=true`, actual `NEXT_PUBLIC_SITE_URL`. Rebuild Next.js apps after changing build-time settings.

## Update commands

From your existing deployment checkout, pull the pushed branch `feature/search-sorting-near-me` using your normal release process. Then, for a non-Docker backend:

```sh
cd backend
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run build
# Restart the API using your existing process manager.
```

Python 3 and curl must be installed. Keep `scripts/`, `prisma/`, `src/`, `tsconfig.json` and production dependencies on the server. Start with the backend directory as working directory. Docker already includes these files and applies migrations on startup. Do not start two standalone reconciliation commands alongside the running scheduler.

Migrations update the schema, existing SQL data transformations, and missing confirmed GPS coordinates. On restart, the scheduled full capture → plan → apply → verify → cleanup → featured pipeline imports current DealerTrade stock, photo object payloads, display text, colours and catalogue values. GPS for branches imported later comes from the same committed coordinate map. A first full capture may take roughly 20 minutes or longer; wait for `DealerTrade sync completed and verified` rather than assuming restart means import finished.

```sh
npm run dealertrade:sync:status
curl --fail https://changecarapi.wowcar.co.th/health/ready
curl --fail https://changecarapi.wowcar.co.th/api/v1/vehicles/source-summary
```

## What will match

Current upstream stock fields and confirmed missing GPS are reconciled without a dump. A byte-for-byte copy of local data is not promised: feed changes, random featured selection, preserved complete server coordinates, manual edits, user accounts, enquiries, uploaded files and local-only content differ by design. Missing vehicles are preserved unless explicitly disabled/removed in the feed; incomplete traversal cannot prove absence. Known placeholder photos are excluded from featured picks, but this does not permanently delete every placeholder listing. An empty server database additionally needs deliberate catalogue/content initialization; these commands target an existing ChangeCars production database.

No production deployment or data verification is implied by a Git push. Check deployment logs and the commands above on the actual server.
