# Dealer app API verification

Verified on 25 October 2026. API contract and integration instructions: [dealer-app-api.md](dealer-app-api.md).

## Results

| Check | Result |
|---|---|
| Complete Jest suite | 32 suites, 279 tests passed |
| Real-database API end-to-end test | 88 checks passed |
| New dealer-app and token operations | All 20 method/path combinations exercised |
| Migration deployment | All 21 migrations applied to a fresh disposable PostgreSQL 17 cluster |
| TypeScript typecheck | Passed |
| Production Nest build | Passed |
| Whitespace/conflict-marker check (`git diff --check`) | Passed |

The Jest count includes the pre-existing regression tests, 44 dealer-app token/inventory/HTTP tests, three audit-attribution tests and two additional legacy identity-boundary cases.

## Real-database coverage

`npm run test:dealer-app:e2e` boots the complete application with its real modules and global guards/interceptors, using an isolated PostgreSQL database created by the test runner.

| Area | Verified behavior |
|---|---|
| Existing app | Admin, dealer and customer password login; customer JWT identity; existing dealer profile/inventory; public search, detail and cache headers |
| API registration | Swagger contains all new dealer-app routes and admin token routes |
| Token issuance | Admin can issue; customer/dealer owner cannot; defaults are read-only; only hashes are stored |
| Token listing | Metadata and count are returned without secrets or hashes |
| Authentication boundary | Missing/invalid credentials rejected; user JWT cannot act as an app credential; app credential cannot act as user/admin JWT |
| Tenant isolation | Bootstrap/inventory/profile belong to the token's dealer; cross-dealer reads/updates/deletes and image uploads are blocked |
| Input validation | Dealer ownership/status overrides, invalid page size and foreign branches are rejected |
| Profile | Own profile reads and updates persist; read-only tokens cannot write |
| Inventory | Draft create, own GET, list/count, pagination and text search; price/version updates persist; stale versions rejected |
| Permissions | Read-only token cannot create/update/delete vehicles or modify the profile |
| Photos | Upload URL, upload completion, real JPEG resizing into WebP renditions, READY state, metadata/primary image update, reorder and deletion |
| Review lifecycle | Cannot publish a draft or submit without photos; submit, withdraw, resubmit, existing admin approve and dealer publish work |
| Editing lifecycle | Published price edits work; material edits require draft; returning to draft permits material edits |
| Vehicle removal | Archiving, repeated deletion, archive filtering, deleting pending-review/reserved vehicles through existing transitions |
| Shared data | Existing feed-backed inventory changes appear in customer search; archived feed-backed inventory disappears through cache invalidation |
| Existing source policy | Native app-created inventory remains outside the existing DealerTrade-only customer feed |
| Audit/outbox | App token identity, existing admin identity, status/price history and durable outbox events; no full token secrets in audit payloads |
| Revocation/status | Suspension, expiry and revocation block subsequent requests; cross-dealer revocation is rejected; repeated revocation is safe |

Additional Jest tests cover malformed credentials, unknown tokens, rejected dealers, independent app credentials, unavailable promotions, missing scope metadata and unchanged legacy/public DealerTrade identity handling.

## Reproduce

Requirements: installed backend dependencies, generated Prisma client and PostgreSQL binaries on PATH. `POSTGRES_BIN` may point to the PostgreSQL bin directory.

```sh
cd backend
npm run prisma:generate
npm run typecheck
npm run build
npm test -- --runInBand
npm run test:dealer-app:e2e
```

The end-to-end runner allocates a temporary directory and local ports, initializes its own PostgreSQL cluster, creates `dealer_app_e2e`, deploys migrations, compiles the application/test with Nest decorator metadata, executes HTTP assertions and cleans up its cluster. Existing `.env` database/replica, Redis, mail, webhook and worker settings are overridden for this process. The runner never migrates or mutates the configured project database.

## Limits and release status

- External S3/Firebase connectivity and signed upload delivery are not tested against a live account. The media adapter is in-memory; image validation/resizing, ownership checks and database state transitions run through real services.
- Redis is disabled for the isolated test, exercising the supported in-memory fallback. Multi-instance Redis behavior and load/performance testing are outside this run.
- New native dealer-app vehicles remain subject to the existing public source policy. Making native inventory visible in customer search would be a separate source-policy change.
- External-feed refresh precedence remains unchanged; a later source import may replace feed-owned fields.
- This verification does not deploy the application or migrate a live database. The new migration must be applied in the target release environment before app credentials can be used there.
