# Central server: dealer app API

The customer app, website, existing dealer portal and additional dealer apps share the same backend and database. Existing `/api/v1/vehicles`, `/api/v1/dealers`, `/api/v1/auth`, `/api/v1/dealer` and admin contracts remain in place. New integration routes live under `/api/v1/dealer-app`.

Each credential belongs to one dealer and one named app. Multiple credentials/apps can be issued for the same dealer. The backend resolves the dealer from the credential on every request; the app cannot choose another dealer using a query parameter or JSON field. Imported numeric dealer/vehicle IDs and locally created UUIDs are both supported as opaque strings.

## Enable the feature

Deploy the backend together with the additive `20261025000100_dealer_app_tokens` migration:

```sh
cd backend
npm run prisma:deploy
npm run build
```

Run migration deployment against the intended environment using the normal release process. It creates only `dealer_app_tokens`; it does not change existing dealer/vehicle rows or invalidate existing JWTs. Without this migration, existing routes can continue to operate, but token management and dealer-app authentication cannot use the missing table.

## Generate, list and revoke tokens

These routes require an existing platform ADMIN or SUPER_ADMIN access JWT. Ordinary customers, dealer portal JWTs without an admin role and dealer app tokens cannot manage app credentials.

| Method | Route | Result |
|---|---|---|
| POST | `/api/v1/admin/dealers/{dealerId}/app-tokens` | Issue a token; secret returned once |
| GET | `/api/v1/admin/dealers/{dealerId}/app-tokens?page=1&pageSize=20` | Paginated metadata, never the token/hash |
| DELETE | `/api/v1/admin/dealers/{dealerId}/app-tokens/{tokenId}` | Revoke immediately; repeated calls are safe |

POST JSON for a dealer app with profile and vehicle write access:

```json
{
  "appName": "Dealer mobile app",
  "scopes": ["dealer:read", "dealer:write", "vehicles:read", "vehicles:write"],
  "expiresInDays": 90
}
```

If omitted, scopes default to `dealer:read` and `vehicles:read`, and expiry defaults to 90 days. Expiry must be 1–365 days. Example issue response (illustrative secret):

```json
{
  "id": "019a0000-0000-7000-8000-000000000001",
  "dealerId": "3095",
  "appName": "Dealer mobile app",
  "tokenPrefix": "ccd_app_abcdefgh",
  "scopes": ["dealer:read", "dealer:write", "vehicles:read", "vehicles:write"],
  "createdById": "019a0000-0000-7000-8000-000000000002",
  "expiresAt": "2027-01-23T12:00:00.000Z",
  "revokedAt": null,
  "createdAt": "2026-10-25T12:00:00.000Z",
  "token": "ccd_app_<one-time-secret>",
  "tokenType": "Bearer"
}
```

Persist the one-time secret in the consuming app's secure credential storage, or in its server backend. For a browser frontend, keep a shared integration token on its server rather than in a public JavaScript bundle or `NEXT_PUBLIC_*` variable. Credentials carry only the chosen dealer's scopes and do not grant staff/admin access.

The server stores a SHA-256 hash of a random 256-bit secret. Secrets/hashes are excluded from token lists and audit entries. Authentication reads token expiry, revocation and dealer status from the database each time; suspended/rejected dealers are blocked. Rotation is issue a replacement, update the consuming app, then revoke the old credential. Revocation blocks subsequent requests; an already authorized in-flight operation can finish.

Example calls using credentials supplied through environment variables:

```sh
# BASE_URL includes /api/v1; ADMIN_JWT is an existing platform admin login token.
curl --fail-with-body -X POST "$BASE_URL/admin/dealers/3095/app-tokens" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H 'Content-Type: application/json' \
  --data '{"appName":"Dealer mobile app","scopes":["dealer:read","dealer:write","vehicles:read","vehicles:write"],"expiresInDays":90}'

# Set DEALER_APP_TOKEN to the one-time token returned above.
curl --fail-with-body "$BASE_URL/dealer-app/bootstrap?page=1&pageSize=50" \
  -H "Authorization: Bearer $DEALER_APP_TOKEN"

curl --fail-with-body -X PATCH "$BASE_URL/dealer-app/vehicles/$VEHICLE_ID" \
  -H "Authorization: Bearer $DEALER_APP_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"price":239900,"expectedVersion":1}'

curl --fail-with-body -X DELETE "$BASE_URL/admin/dealers/3095/app-tokens/$TOKEN_ID" \
  -H "Authorization: Bearer $ADMIN_JWT"
```

## Fetch dealer details and vehicles together

Use the app credential, not the platform login JWT:

```http
GET /api/v1/dealer-app/bootstrap?page=1&pageSize=50
Authorization: Bearer ccd_app_<secret>
```

The JSON shape is:

```json
{
  "dealer": {
    "id": "3095",
    "name": "Example Motors",
    "email": "sales@example.test",
    "phone": "+27110000000",
    "status": "APPROVED",
    "branches": []
  },
  "vehicles": {
    "data": [],
    "meta": { "page": 1, "pageSize": 50, "total": 0, "pageCount": 1 }
  }
}
```

This is a shortened example; the profile contains business/contact information, and vehicle rows use the existing dealer inventory JSON. `meta.total` is the matching vehicle count. Page size is capped at 100: fetch subsequent pages until `pageCount` to retrieve all vehicles. Responses are `private, no-store`. Archived vehicles are excluded by default; request `status=ARCHIVED` to inspect removed inventory. Optional filters: `status` (comma separated), `branchId`, `q` and `sort` (`recent`, `price-asc`, `price-desc`, `views-desc`). Bootstrap requires both read scopes.

## Profile and vehicle operations

All paths below are relative to `/api/v1/dealer-app`, with `Authorization: Bearer <app-token>`.

| Method | Path | Scope | Behavior |
|---|---|---|---|
| GET | `/profile` | `dealer:read` | Bound dealer's details and branches |
| PATCH | `/profile` | `dealer:write` | Update business/contact profile fields |
| GET | `/vehicles` | `vehicles:read` | Paginated own inventory |
| GET | `/vehicles/{id}` | `vehicles:read` | Own vehicle, specifications, images and history |
| POST | `/vehicles` | `vehicles:write` | Create an own vehicle in DRAFT |
| PATCH | `/vehicles/{id}` | `vehicles:write` | Update using existing edit/concurrency rules |
| DELETE | `/vehicles/{id}` | `vehicles:write` | Archive own vehicle, removing it from public listings |
| POST | `/vehicles/{id}/submit` | `vehicles:write` | Submit for existing admin review |
| POST | `/vehicles/{id}/withdraw` | `vehicles:write` | Withdraw from review to DRAFT |
| POST | `/vehicles/{id}/edit` | `vehicles:write` | Return to DRAFT for material edits |
| POST | `/vehicles/{id}/publish` | `vehicles:write` | Publish an APPROVED vehicle for an approved dealer |

Cross-dealer vehicle reads, edits and deletes return 404. Branches must belong to the token's dealer. Promotions must be global or belong to that dealer. Unknown input fields, including `dealerId`, `status` or ownership overrides in vehicle mutations, are rejected. Profile edits cannot change the dealership's approval status or plan.

POST `/vehicles` example:

```json
{
  "makeId": "<catalogue make UUID>",
  "modelId": "<catalogue model UUID>",
  "condition": "USED",
  "year": 2024,
  "mileage": 15000,
  "price": 249900,
  "transmission": "AUTOMATIC",
  "fuelType": "PETROL",
  "colour": "White",
  "description": "Full service history"
}
```

Use existing public `/api/v1/catalogue/...` endpoints for make/model/variant, feature and category UUIDs. A `variantId` can supply catalogue specifications. Existing `CreateVehicleDto`/`UpdateVehicleDto` validation and Swagger schemas apply.

PATCH `/vehicles/{id}` example:

```json
{ "price": 239900, "expectedVersion": 1 }
```

The successful response includes the new version. A stale version returns 409. New vehicles remain DRAFT until photos are uploaded, they are submitted, an administrator approves them using the existing admin API, and they are published. After approval, only existing commercial fields (such as price and description) can be edited directly; identifying/specification changes require the existing draft/review workflow. This preserves the main marketplace's listing approval rules.

DELETE is a soft removal: history remains in the central database and the vehicle is archived. Pending-review vehicles are withdrawn first; reserved vehicles are suspended first. These preparatory lifecycle transitions and archiving are separate commits, so a concurrent change can produce 409; reload and retry. Repeating deletion of an already archived own vehicle succeeds.

All apps access the same inventory. Changes to existing published DealerTrade-backed listings affect the customer app through the existing cache invalidation and listing visibility rules. The customer API currently exposes DealerTrade-backed vehicles only; newly created native dealer-app vehicles are available in dealer inventory but remain outside that public feed, even after publication. This preserves the current customer API's source policy. Existing external-feed import/reconciliation behavior still applies to feed-owned fields; this feature does not change source synchronization precedence.

## Vehicle photos

Photo operations require `vehicles:write`, use existing upload/storage/processing checks and always validate vehicle ownership:

| Method | Path | JSON |
|---|---|---|
| POST | `/vehicles/{id}/images/upload-url` | `{ "contentType": "image/jpeg", "sizeBytes": 123456 }` |
| POST | `/vehicles/{id}/images/{imageId}/complete` | No body, after PUT to the returned upload URL |
| PUT | `/vehicles/{id}/images/order` | `{ "imageIds": ["<UUID>"] }` |
| PATCH | `/vehicles/{id}/images/{imageId}` | `{ "isPrimary": true, "altText": "Front view" }` |
| DELETE | `/vehicles/{id}/images/{imageId}` | No body |

Read the gallery from GET `/vehicles/{id}`. Existing worker/storage configuration is used; no new media infrastructure is required.

## Errors and auditing

Existing error JSON is retained: `{ statusCode, code, message, details?, requestId, timestamp, path }`. Missing/invalid/expired/revoked app tokens return 401, missing scopes or an inactive dealership return 403, unrelated vehicles return 404, invalid fields return 400, and lifecycle/concurrency conflicts return 409.

Inventory/profile changes use the existing audit service and business services. App mutations record `actorId: null` and `actorRole: "DEALER_APP:<token-id>"`, distinguishing integration activity from the administrator who issued the token. Human JWT requests retain their existing audit attribution. Token creation/revocation is audited as the administering user. Existing global request rate limits continue to apply.

## Verification

From `backend/`:

```sh
npm run typecheck
npm run build
npm test -- --runInBand
npm run test:dealer-app:e2e
```

The end-to-end command requires local PostgreSQL binaries (`initdb`, `pg_ctl`, `postgres`) on PATH, or their directory in `POSTGRES_BIN`. It creates its own temporary PostgreSQL cluster, applies all migrations, starts the real application on a temporary loopback port, runs the API checks, then stops/removes its cluster. It does not use the existing configured database. Nest/Prisma, password login, SQL, guards, audit, outbox, image resizing and cache invalidation are real; external object storage uses an in-memory adapter. See [test results and limits](dealer-app-testing.md).
