# ChangeCars — All APIs

Source: deployed OpenAPI specification, retrieved 2026-10-09.

**Base URL:** `https://chnagecars-website-production.up.railway.app`

Paths below include `/api/v1`; health endpoints have no prefix. JSON request bodies use `Content-Type: application/json`. Protected endpoints use `Authorization: Bearer <access-token>`. Path placeholders such as `{id}` must be replaced.

Authentication and role notes are from repository controller metadata where available. Request and response schemas below are exactly those documented by OpenAPI; an unspecified response schema does not mean the response is empty.

**Total endpoints:** 267

## Quick examples

```bash
curl 'https://chnagecars-website-production.up.railway.app/api/v1/web/cars/featured?limit=6'
curl 'https://chnagecars-website-production.up.railway.app/health/ready'
```

## Index

- Health: 2 endpoints
- Auth: 9 endpoints
- Notifications: 6 endpoints
- Dealers (public): 3 endpoints
- Dealer portal: account: 13 endpoints
- Admin: dealers: 4 endpoints
- Catalogue: 7 endpoints
- Admin: catalogue: 24 endpoints
- Vehicles (public): 9 endpoints
- Dealer portal: inventory: 20 endpoints
- Admin: vehicles: 12 endpoints
- Finance: 2 endpoints
- Dealer portal: CRM: 8 endpoints
- Enquiries (public forms): 10 endpoints
- Customer: enquiries: 4 endpoints
- Dealer portal: enquiries: 3 endpoints
- Admin: enquiries: 4 endpoints
- Sell / value your vehicle: 1 endpoints
- Customer: my vehicles for sale: 6 endpoints
- Admin: sell requests: 4 endpoints
- Admin: bidding: 4 endpoints
- Dealer portal: bidding: 7 endpoints
- Customer: offers: 4 endpoints
- Customer: account & dashboard: 17 endpoints
- Content (public): 9 endpoints
- Admin: content: 28 endpoints
- Newsletter: 2 endpoints
- Admin: newsletter: 2 endpoints
- Dealer portal: dashboard: 1 endpoints
- Admin: users, statistics, audit, system: 10 endpoints
- SEO: 4 endpoints
- Website adapter: cars and articles: 15 endpoints
- Website adapter: dashboards: 9 endpoints
- Website adapter: forms: 4 endpoints

## Health

### `GET /health/live`

Liveness: the process is up

**Access:** Public.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /health/ready`

Readiness: dependencies reachable (returns 503 otherwise)

**Access:** Public.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Auth

### `POST /api/v1/auth/register`

Create a customer account (FR-01)

**Access:** Public.

**Request body:** required.

- `application/json`: RegisterDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | application/json: {"type":"object"} |

### `POST /api/v1/auth/login`

Sign in with email and password

**Access:** Public.

**Request body:** required.

- `application/json`: LoginDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | application/json: {"type":"object"} |

### `POST /api/v1/auth/refresh`

Exchange a refresh token for new tokens (rotation)

**Access:** Public.

**Request body:** required.

- `application/json`: RefreshTokenDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | application/json: {"type":"object"} |

### `POST /api/v1/auth/logout`

Revoke the current session

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `POST /api/v1/auth/logout-all`

Revoke every session of the current user

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `POST /api/v1/auth/forgot-password`

Email a password reset link (always returns 202)

**Access:** Public.

**Request body:** required.

- `application/json`: ForgotPasswordDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 202 | — | Schema not specified |

### `POST /api/v1/auth/reset-password`

Set a new password with a reset token

**Access:** Public.

**Request body:** required.

- `application/json`: ResetPasswordDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `POST /api/v1/auth/change-password`

Change password and sign out other devices

**Access:** Bearer token required.

**Request body:** required.

- `application/json`: ChangePasswordDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `GET /api/v1/auth/me`

Current user with dealer membership, if any

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Notifications

### `GET /api/v1/me/notifications`

My in-app notifications

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `unreadOnly` | query | No | {"type":"boolean"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/me/notifications/unread-count`

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/me/notifications/{id}/read`

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `POST /api/v1/me/notifications/read-all`

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `GET /api/v1/me/notifications/preferences`

Notification preferences per type and channel (FR-39, FR-57)

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PUT /api/v1/me/notifications/preferences`

**Access:** Bearer token required.

**Request body:** required.

- `application/json`: UpdateNotificationPreferencesDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Dealers (public)

### `POST /api/v1/dealers/register`

Register a dealership (FR-11). Account starts PENDING until an admin approves it.

**Access:** Public.

**Request body:** required.

- `application/json`: RegisterDealerDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `GET /api/v1/dealers`

Directory of approved dealers

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `q` | query | No | {"maxLength":100,"type":"string"} |  |
| `province` | query | No | {"type":"string","enum":["EASTERN_CAPE","FREE_STATE","GAUTENG","KWAZULU_NATAL","LIMPOPO","MPUMALANGA","NORTHERN_CAPE","NORTH_WEST","WESTERN_CAPE"]} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/dealers/{slug}`

Public dealer page with branches and opening hours

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `slug` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Dealer portal: account

### `GET /api/v1/dealer/profile`

My dealership (FR-13 "view dealership information")

**Access:** Bearer token required.
**Dealer access:** `{"allowInactive": true}`.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | application/json: {"type":"object"} |

### `PATCH /api/v1/dealer/profile`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["DEALER_PROFILE_MANAGE"]}`.

**Request body:** required.

- `application/json`: UpdateDealerProfileDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/dealer/me`

My membership, role and effective permissions

**Access:** Bearer token required.
**Dealer access:** `{"allowInactive": true}`.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | application/json: {"type":"object"} |

### `POST /api/v1/dealer/documents/upload-url`

Presigned URL for a verification document upload

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["DEALER_PROFILE_MANAGE"], "allowInactive": true}`.

**Request body:** required.

- `application/json`: DocumentUploadRequestDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/dealer/documents`

Register an uploaded verification document

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["DEALER_PROFILE_MANAGE"], "allowInactive": true}`.

**Request body:** required.

- `application/json`: ConfirmDocumentDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `GET /api/v1/dealer/documents`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["DEALER_PROFILE_MANAGE"], "allowInactive": true}`.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | application/json: {"type":"object"} |

### `GET /api/v1/dealer/branches`

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | application/json: {"type":"object"} |

### `POST /api/v1/dealer/branches`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["BRANCHES_MANAGE"]}`.

**Request body:** required.

- `application/json`: BranchInputDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `PATCH /api/v1/dealer/branches/{id}`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["BRANCHES_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateBranchDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/dealer/staff`

**Access:** Bearer token required.
**Dealer access:** `{"anyPermission": ["STAFF_MANAGE", "LEADS_ASSIGN"]}`.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/dealer/staff`

Create a staff account and email an invitation (FR-45)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["STAFF_MANAGE"]}`.

**Request body:** required.

- `application/json`: CreateStaffDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `PATCH /api/v1/dealer/staff/{memberId}`

Change role, branch, permissions or disable a staff account

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["STAFF_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `memberId` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateStaffDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/dealer/staff/{memberId}/activity`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["STAFF_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `memberId` | path | Yes | {"type":"string"} |  |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Admin: dealers

### `GET /api/v1/admin/dealers`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `q` | query | No | {"maxLength":100,"type":"string"} |  |
| `province` | query | No | {"type":"string","enum":["EASTERN_CAPE","FREE_STATE","GAUTENG","KWAZULU_NATAL","LIMPOPO","MPUMALANGA","NORTHERN_CAPE","NORTH_WEST","WESTERN_CAPE"]} |  |
| `status` | query | No | {"type":"string","enum":["PENDING","APPROVED","REJECTED","SUSPENDED"]} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/admin/dealers/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PATCH /api/v1/admin/dealers/{id}`

Update plan, bidding eligibility or rating

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: AdminUpdateDealerDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PATCH /api/v1/admin/dealers/{id}/status`

Approve, reject, suspend or reinstate a dealer (FR-11, FR-34)

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: ChangeDealerStatusDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Catalogue

### `GET /api/v1/catalogue/makes`

All active manufacturers (FR-26)

**Access:** Public.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/catalogue/makes/{makeSlug}/models`

Models of a manufacturer

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `makeSlug` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/catalogue/makes/{makeSlug}/models/{modelSlug}`

Model with generations, variants, specs and pricing (FR-06 new-vehicle flow)

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `makeSlug` | path | Yes | {"type":"string"} |  |
| `modelSlug` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | application/json: {"type":"object"} |

### `GET /api/v1/catalogue/variants/compare`

Compare 2-4 catalogue variants side by side (FR-17)

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `ids` | query | Yes | {"maxLength":200,"example":"id1,id2","type":"string"} | Comma-separated ids (2-4) |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/catalogue/variants/{id}`

Variant with full specification and resolved features (FR-49, FR-50)

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/catalogue/categories`

Vehicle categories: hatchbacks, SUVs, bakkies, EVs... (FR-25)

**Access:** Public.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/catalogue/features`

**Access:** Public.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Admin: catalogue

### `GET /api/v1/admin/catalogue/makes`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | application/json: {"type":"object"} |

### `POST /api/v1/admin/catalogue/makes`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Request body:** required.

- `application/json`: CreateMakeDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `PATCH /api/v1/admin/catalogue/makes/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateMakeDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/admin/catalogue/makes/{id}`

Delete a make (fails with 409 if models or vehicles reference it; deactivate instead)

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `GET /api/v1/admin/catalogue/makes/{makeId}/models`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `makeId` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | application/json: {"type":"object"} |

### `POST /api/v1/admin/catalogue/models`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Request body:** required.

- `application/json`: CreateModelDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `PATCH /api/v1/admin/catalogue/models/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateModelDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/admin/catalogue/models/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `POST /api/v1/admin/catalogue/generations`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Request body:** required.

- `application/json`: CreateGenerationDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `PATCH /api/v1/admin/catalogue/generations/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateGenerationDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/admin/catalogue/generations/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `GET /api/v1/admin/catalogue/models/{modelId}/variants`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `modelId` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | application/json: {"type":"object"} |

### `POST /api/v1/admin/catalogue/variants`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Request body:** required.

- `application/json`: CreateVariantDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | application/json: {"type":"object"} |

### `PATCH /api/v1/admin/catalogue/variants/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateVariantDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | application/json: {"type":"object"} |

### `DELETE /api/v1/admin/catalogue/variants/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `GET /api/v1/admin/catalogue/categories`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | application/json: {"type":"object"} |

### `POST /api/v1/admin/catalogue/categories`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Request body:** required.

- `application/json`: CategoryDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `PATCH /api/v1/admin/catalogue/categories/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateCategoryDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/admin/catalogue/categories/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `POST /api/v1/admin/catalogue/features`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Request body:** required.

- `application/json`: FeatureDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `PATCH /api/v1/admin/catalogue/features/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateFeatureDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/admin/catalogue/features/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `POST /api/v1/admin/catalogue/feature-assignments`

Assign a standard/optional feature to a make, model, generation or variant (FR-50)

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Request body:** required.

- `application/json`: AssignFeatureDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `DELETE /api/v1/admin/catalogue/feature-assignments/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |


## Vehicles (public)

### `GET /api/v1/vehicles`

Search, filter and sort listed vehicles (FR-02, FR-03, FR-05, FR-06, FR-07, FR-27)

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `q` | query | No | {"maxLength":100,"type":"string"} | Free text over the listing title |
| `make` | query | No | {"maxLength":500,"example":"bmw,audi","type":"string"} | Make slugs, comma-separated |
| `model` | query | No | {"maxLength":500,"example":"bmw:3-series","type":"string"} | Model slugs; scope to a make with make:model |
| `variant` | query | No | {"maxLength":500,"example":"320i-m-sport-2022","type":"string"} | Variant slugs |
| `condition` | query | No | {"maxLength":50,"example":"USED","type":"string"} | NEW, USED, DEMO |
| `category` | query | No | {"maxLength":300,"example":"suvs,bakkies","type":"string"} | Category slugs (FR-25) |
| `fuelType` | query | No | {"maxLength":200,"example":"PETROL,DIESEL","type":"string"} |  |
| `transmission` | query | No | {"maxLength":50,"example":"AUTOMATIC","type":"string"} |  |
| `drivetrain` | query | No | {"maxLength":100,"example":"FOUR_X_FOUR","type":"string"} |  |
| `province` | query | No | {"maxLength":300,"example":"GAUTENG,WESTERN_CAPE","type":"string"} | Provinces (FR-27) |
| `city` | query | No | {"maxLength":100,"type":"string"} |  |
| `colour` | query | No | {"maxLength":200,"example":"White,Black","type":"string"} |  |
| `dealer` | query | No | {"maxLength":120,"type":"string"} | Dealer slug |
| `branchId` | query | No | {"format":"uuid","type":"string"} |  |
| `minPrice` | query | No | {"minimum":0,"type":"number"} |  |
| `maxPrice` | query | No | {"minimum":0,"type":"number"} |  |
| `minYear` | query | No | {"minimum":1900,"type":"number"} |  |
| `maxYear` | query | No | {"maximum":2100,"type":"number"} |  |
| `minMileage` | query | No | {"minimum":0,"type":"number"} |  |
| `maxMileage` | query | No | {"minimum":0,"type":"number"} |  |
| `minEngineCc` | query | No | {"minimum":0,"type":"number"} |  |
| `maxEngineCc` | query | No | {"minimum":0,"type":"number"} |  |
| `minPowerKw` | query | No | {"minimum":0,"type":"number"} |  |
| `maxPowerKw` | query | No | {"minimum":0,"type":"number"} |  |
| `seats` | query | No | {"maxLength":50,"example":"5,7","type":"string"} | Seat counts, comma-separated; "8+" for eight or more |
| `onSpecial` | query | No | {"type":"boolean"} | Only vehicles on special (FR-23) |
| `featured` | query | No | {"type":"boolean"} |  |
| `availableOnly` | query | No | {"type":"boolean"} | Hide reserved vehicles |
| `collection` | query | No | {"type":"string","enum":["hot-sellers","specials","featured","new-arrivals","budget","student","bakkies","electric"]} |  |
| `lat` | query | No | {"type":"number"} | Centre latitude for radius search |
| `lng` | query | No | {"type":"number"} | Centre longitude for radius search |
| `radiusKm` | query | No | {"minimum":1,"maximum":1000,"type":"number"} | Radius in km (with lat/lng) |
| `sort` | query | No | {"default":"recent","type":"string","enum":["recent","oldest","price-asc","price-desc","mileage-asc","mileage-desc","year-desc","year-asc","popular","nearest"]} | nearest needs lat and lng |
| `page` | query | No | {"minimum":1,"maximum":500,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":50,"default":20,"type":"number"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/vehicles/facets`

Counts per make, fuel, transmission, province, condition and category for a search

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `q` | query | No | {"maxLength":100,"type":"string"} | Free text over the listing title |
| `make` | query | No | {"maxLength":500,"example":"bmw,audi","type":"string"} | Make slugs, comma-separated |
| `model` | query | No | {"maxLength":500,"example":"bmw:3-series","type":"string"} | Model slugs; scope to a make with make:model |
| `variant` | query | No | {"maxLength":500,"example":"320i-m-sport-2022","type":"string"} | Variant slugs |
| `condition` | query | No | {"maxLength":50,"example":"USED","type":"string"} | NEW, USED, DEMO |
| `category` | query | No | {"maxLength":300,"example":"suvs,bakkies","type":"string"} | Category slugs (FR-25) |
| `fuelType` | query | No | {"maxLength":200,"example":"PETROL,DIESEL","type":"string"} |  |
| `transmission` | query | No | {"maxLength":50,"example":"AUTOMATIC","type":"string"} |  |
| `drivetrain` | query | No | {"maxLength":100,"example":"FOUR_X_FOUR","type":"string"} |  |
| `province` | query | No | {"maxLength":300,"example":"GAUTENG,WESTERN_CAPE","type":"string"} | Provinces (FR-27) |
| `city` | query | No | {"maxLength":100,"type":"string"} |  |
| `colour` | query | No | {"maxLength":200,"example":"White,Black","type":"string"} |  |
| `dealer` | query | No | {"maxLength":120,"type":"string"} | Dealer slug |
| `branchId` | query | No | {"format":"uuid","type":"string"} |  |
| `minPrice` | query | No | {"minimum":0,"type":"number"} |  |
| `maxPrice` | query | No | {"minimum":0,"type":"number"} |  |
| `minYear` | query | No | {"minimum":1900,"type":"number"} |  |
| `maxYear` | query | No | {"maximum":2100,"type":"number"} |  |
| `minMileage` | query | No | {"minimum":0,"type":"number"} |  |
| `maxMileage` | query | No | {"minimum":0,"type":"number"} |  |
| `minEngineCc` | query | No | {"minimum":0,"type":"number"} |  |
| `maxEngineCc` | query | No | {"minimum":0,"type":"number"} |  |
| `minPowerKw` | query | No | {"minimum":0,"type":"number"} |  |
| `maxPowerKw` | query | No | {"minimum":0,"type":"number"} |  |
| `seats` | query | No | {"maxLength":50,"example":"5,7","type":"string"} | Seat counts, comma-separated; "8+" for eight or more |
| `onSpecial` | query | No | {"type":"boolean"} | Only vehicles on special (FR-23) |
| `featured` | query | No | {"type":"boolean"} |  |
| `availableOnly` | query | No | {"type":"boolean"} | Hide reserved vehicles |
| `collection` | query | No | {"type":"string","enum":["hot-sellers","specials","featured","new-arrivals","budget","student","bakkies","electric"]} |  |
| `lat` | query | No | {"type":"number"} | Centre latitude for radius search |
| `lng` | query | No | {"type":"number"} | Centre longitude for radius search |
| `radiusKm` | query | No | {"minimum":1,"maximum":1000,"type":"number"} | Radius in km (with lat/lng) |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/vehicles/count`

Count listed vehicles matching filter criteria (GET query params). See [vehicle-count-api.md](vehicle-count-api.md) for full guide.

**Access:** Public.

**Parameters:** Same filters as `GET /api/v1/vehicles/facets` (`minPrice`, `maxPrice`, `minYear`, `maxYear`, `minMileage`, `maxMileage`, `make`, `model`, `category`, `transmission`, `fuelType`, `drivetrain`, `province`, `city`, `condition`, `colour`, etc.).

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | Vehicle count | `{"total": 35, "count": 35, "formatted": "35"}` |

### `POST /api/v1/vehicles/count`

Count listed vehicles matching filter criteria (POST JSON body - recommended for mobile apps).

**Access:** Public.

**Request body:** JSON object with any search criteria fields (`minPrice`, `maxPrice`, `make`, `model`, etc.).

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | Vehicle count | `{"total": 35, "count": 35, "formatted": "35"}` |

### `GET /api/v1/vehicles/specials`

Vehicles on special (FR-23)

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `q` | query | No | {"maxLength":100,"type":"string"} | Free text over the listing title |
| `make` | query | No | {"maxLength":500,"example":"bmw,audi","type":"string"} | Make slugs, comma-separated |
| `model` | query | No | {"maxLength":500,"example":"bmw:3-series","type":"string"} | Model slugs; scope to a make with make:model |
| `variant` | query | No | {"maxLength":500,"example":"320i-m-sport-2022","type":"string"} | Variant slugs |
| `condition` | query | No | {"maxLength":50,"example":"USED","type":"string"} | NEW, USED, DEMO |
| `category` | query | No | {"maxLength":300,"example":"suvs,bakkies","type":"string"} | Category slugs (FR-25) |
| `fuelType` | query | No | {"maxLength":200,"example":"PETROL,DIESEL","type":"string"} |  |
| `transmission` | query | No | {"maxLength":50,"example":"AUTOMATIC","type":"string"} |  |
| `drivetrain` | query | No | {"maxLength":100,"example":"FOUR_X_FOUR","type":"string"} |  |
| `province` | query | No | {"maxLength":300,"example":"GAUTENG,WESTERN_CAPE","type":"string"} | Provinces (FR-27) |
| `city` | query | No | {"maxLength":100,"type":"string"} |  |
| `colour` | query | No | {"maxLength":200,"example":"White,Black","type":"string"} |  |
| `dealer` | query | No | {"maxLength":120,"type":"string"} | Dealer slug |
| `branchId` | query | No | {"format":"uuid","type":"string"} |  |
| `minPrice` | query | No | {"minimum":0,"type":"number"} |  |
| `maxPrice` | query | No | {"minimum":0,"type":"number"} |  |
| `minYear` | query | No | {"minimum":1900,"type":"number"} |  |
| `maxYear` | query | No | {"maximum":2100,"type":"number"} |  |
| `minMileage` | query | No | {"minimum":0,"type":"number"} |  |
| `maxMileage` | query | No | {"minimum":0,"type":"number"} |  |
| `minEngineCc` | query | No | {"minimum":0,"type":"number"} |  |
| `maxEngineCc` | query | No | {"minimum":0,"type":"number"} |  |
| `minPowerKw` | query | No | {"minimum":0,"type":"number"} |  |
| `maxPowerKw` | query | No | {"minimum":0,"type":"number"} |  |
| `seats` | query | No | {"maxLength":50,"example":"5,7","type":"string"} | Seat counts, comma-separated; "8+" for eight or more |
| `onSpecial` | query | No | {"type":"boolean"} | Only vehicles on special (FR-23) |
| `featured` | query | No | {"type":"boolean"} |  |
| `availableOnly` | query | No | {"type":"boolean"} | Hide reserved vehicles |
| `collection` | query | No | {"type":"string","enum":["hot-sellers","specials","featured","new-arrivals","budget","student","bakkies","electric"]} |  |
| `lat` | query | No | {"type":"number"} | Centre latitude for radius search |
| `lng` | query | No | {"type":"number"} | Centre longitude for radius search |
| `radiusKm` | query | No | {"minimum":1,"maximum":1000,"type":"number"} | Radius in km (with lat/lng) |
| `sort` | query | No | {"default":"recent","type":"string","enum":["recent","oldest","price-asc","price-desc","mileage-asc","mileage-desc","year-desc","year-asc","popular","nearest"]} | nearest needs lat and lng |
| `page` | query | No | {"minimum":1,"maximum":500,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":50,"default":20,"type":"number"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/vehicles/hot-sellers`

Popular, high-demand vehicles (FR-24)

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `q` | query | No | {"maxLength":100,"type":"string"} | Free text over the listing title |
| `make` | query | No | {"maxLength":500,"example":"bmw,audi","type":"string"} | Make slugs, comma-separated |
| `model` | query | No | {"maxLength":500,"example":"bmw:3-series","type":"string"} | Model slugs; scope to a make with make:model |
| `variant` | query | No | {"maxLength":500,"example":"320i-m-sport-2022","type":"string"} | Variant slugs |
| `condition` | query | No | {"maxLength":50,"example":"USED","type":"string"} | NEW, USED, DEMO |
| `category` | query | No | {"maxLength":300,"example":"suvs,bakkies","type":"string"} | Category slugs (FR-25) |
| `fuelType` | query | No | {"maxLength":200,"example":"PETROL,DIESEL","type":"string"} |  |
| `transmission` | query | No | {"maxLength":50,"example":"AUTOMATIC","type":"string"} |  |
| `drivetrain` | query | No | {"maxLength":100,"example":"FOUR_X_FOUR","type":"string"} |  |
| `province` | query | No | {"maxLength":300,"example":"GAUTENG,WESTERN_CAPE","type":"string"} | Provinces (FR-27) |
| `city` | query | No | {"maxLength":100,"type":"string"} |  |
| `colour` | query | No | {"maxLength":200,"example":"White,Black","type":"string"} |  |
| `dealer` | query | No | {"maxLength":120,"type":"string"} | Dealer slug |
| `branchId` | query | No | {"format":"uuid","type":"string"} |  |
| `minPrice` | query | No | {"minimum":0,"type":"number"} |  |
| `maxPrice` | query | No | {"minimum":0,"type":"number"} |  |
| `minYear` | query | No | {"minimum":1900,"type":"number"} |  |
| `maxYear` | query | No | {"maximum":2100,"type":"number"} |  |
| `minMileage` | query | No | {"minimum":0,"type":"number"} |  |
| `maxMileage` | query | No | {"minimum":0,"type":"number"} |  |
| `minEngineCc` | query | No | {"minimum":0,"type":"number"} |  |
| `maxEngineCc` | query | No | {"minimum":0,"type":"number"} |  |
| `minPowerKw` | query | No | {"minimum":0,"type":"number"} |  |
| `maxPowerKw` | query | No | {"minimum":0,"type":"number"} |  |
| `seats` | query | No | {"maxLength":50,"example":"5,7","type":"string"} | Seat counts, comma-separated; "8+" for eight or more |
| `onSpecial` | query | No | {"type":"boolean"} | Only vehicles on special (FR-23) |
| `featured` | query | No | {"type":"boolean"} |  |
| `availableOnly` | query | No | {"type":"boolean"} | Hide reserved vehicles |
| `collection` | query | No | {"type":"string","enum":["hot-sellers","specials","featured","new-arrivals","budget","student","bakkies","electric"]} |  |
| `lat` | query | No | {"type":"number"} | Centre latitude for radius search |
| `lng` | query | No | {"type":"number"} | Centre longitude for radius search |
| `radiusKm` | query | No | {"minimum":1,"maximum":1000,"type":"number"} | Radius in km (with lat/lng) |
| `sort` | query | No | {"default":"recent","type":"string","enum":["recent","oldest","price-asc","price-desc","mileage-asc","mileage-desc","year-desc","year-asc","popular","nearest"]} | nearest needs lat and lng |
| `page` | query | No | {"minimum":1,"maximum":500,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":50,"default":20,"type":"number"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/vehicles/compare`

Compare 2-4 vehicles: price, engine, performance, consumption, dimensions, features, warranty (FR-17)

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `ids` | query | Yes | {"maxLength":200,"type":"string"} | Comma-separated vehicle ids (2-4) |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/vehicles/{slugOrId}`

Vehicle detail page (FR-04). Signed-in viewers get it added to recently viewed (FR-41). Returns vehicle specs, pricing, `monthlyPrice`, `formattedMonthlyPrice`, photos, dealer contacts, features, and finance breakdown. See [car-details-api.md](car-details-api.md) for full guide.

**Access:** Optional authentication.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `slugOrId` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/vehicles/{id}/similar`

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |
| `limit` | query | No | {"minimum":1,"maximum":24,"default":6,"type":"number"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | application/json: {"type":"array","items":{"type":"object"}} |

### `GET /api/v1/vehicles/{id}/dealer-vehicles`

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |
| `limit` | query | No | {"minimum":1,"maximum":24,"default":6,"type":"number"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | application/json: {"type":"array","items":{"type":"object"}} |

### `GET /api/v1/vehicles/{id}/market-price`

Average asking price of comparable listings

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Dealer portal: inventory

### `GET /api/v1/dealer/vehicles`

My inventory (FR-13)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_VIEW"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `status` | query | No | {"type":"array","items":{"type":"string","enum":["DRAFT","PENDING_REVIEW","APPROVED","REJECTED","PUBLISHED","RESERVED","SOLD","SUSPENDED","ARCHIVED"]}} | Comma-separated statuses |
| `branchId` | query | No | {"format":"uuid","type":"string"} |  |
| `q` | query | No | {"maxLength":100,"type":"string"} |  |
| `sort` | query | No | {"type":"string","enum":["recent","price-asc","price-desc","views-desc"]} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/dealer/vehicles`

Create a vehicle in DRAFT (FR-12, FR-47)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"]}`.

**Request body:** required.

- `application/json`: CreateVehicleDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `GET /api/v1/dealer/vehicles/{id}`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_VIEW"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PATCH /api/v1/dealer/vehicles/{id}`

Edit a vehicle. After approval only price, specials, description, colour, branch, stock number and features may change.

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateVehicleDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/dealer/vehicles/{id}/submit`

Submit for admin review (DRAFT/REJECTED → PENDING_REVIEW)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"], "requireApproved": true}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/dealer/vehicles/{id}/withdraw`

Withdraw from review (PENDING_REVIEW → DRAFT)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/dealer/vehicles/{id}/edit`

Move back to DRAFT for material edits (requires a new review)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/dealer/vehicles/{id}/publish`

Publish an approved vehicle (BR-01, BR-02)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_PUBLISH"], "requireApproved": true}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/dealer/vehicles/{id}/reserve`

Reserve a published vehicle (stays visible as reserved, BR-05)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: ReserveDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/dealer/vehicles/{id}/release`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/dealer/vehicles/{id}/sell`

Mark as sold (removed from search results, BR-04)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: TransitionDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/dealer/vehicles/{id}/suspend`

Temporarily take a listing offline (FR-12)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: TransitionDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/dealer/vehicles/{id}/unsuspend`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"], "requireApproved": true}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/dealer/vehicles/{id}/archive`

Remove a listing (kept for history)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: TransitionDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `GET /api/v1/dealer/vehicles/{id}/images`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_VIEW"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/dealer/vehicles/{id}/images/upload-url`

Step 1: get a presigned URL, then PUT the file to it

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: ImageUploadRequestDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/dealer/vehicles/{id}/images/{imageId}/complete`

Step 2: confirm the upload; resizing happens in the background

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |
| `imageId` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `PUT /api/v1/dealer/vehicles/{id}/images/order`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: ReorderImagesDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PATCH /api/v1/dealer/vehicles/{id}/images/{imageId}`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |
| `imageId` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateImageDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/dealer/vehicles/{id}/images/{imageId}`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["INVENTORY_MANAGE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |
| `imageId` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |


## Admin: vehicles

### `GET /api/v1/admin/vehicles`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `status` | query | No | {"type":"array","items":{"type":"string","enum":["DRAFT","PENDING_REVIEW","APPROVED","REJECTED","PUBLISHED","RESERVED","SOLD","SUSPENDED","ARCHIVED"]}} | Comma-separated statuses |
| `branchId` | query | No | {"format":"uuid","type":"string"} |  |
| `q` | query | No | {"maxLength":100,"type":"string"} |  |
| `sort` | query | No | {"type":"string","enum":["recent","price-asc","price-desc","views-desc"]} |  |
| `dealerId` | query | No | {"format":"uuid","type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/admin/vehicles/review-queue`

Listings awaiting approval, oldest first (BR-01)

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/admin/vehicles/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PATCH /api/v1/admin/vehicles/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateVehicleDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PATCH /api/v1/admin/vehicles/{id}/flags`

Feature a vehicle or mark it as special

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: AdminFlagsDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/admin/vehicles/{id}/approve`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: TransitionDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/admin/vehicles/{id}/reject`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: TransitionDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/admin/vehicles/{id}/publish`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/admin/vehicles/{id}/suspend`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: TransitionDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/admin/vehicles/{id}/unsuspend`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/admin/vehicles/{id}/archive`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: TransitionDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/admin/vehicles/{id}/relist`

Correct a mistaken sale: SOLD → PUBLISHED

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: TransitionDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |


## Finance

### `POST /api/v1/finance/repayment`

Monthly repayment, finance amount and total repayment (FR-18)

**Access:** Public.

**Request body:** required.

- `application/json`: RepaymentDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/finance/affordability`

"What can I afford" vehicle budget estimate (FR-19)

**Access:** Public.

**Request body:** required.

- `application/json`: AffordabilityDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Dealer portal: CRM

### `GET /api/v1/dealer/leads`

Leads visible to me: all (LEADS_VIEW_ALL) or only assigned to me

**Access:** Bearer token required.
**Dealer access:** `{"anyPermission": ["LEADS_VIEW_ALL", "LEADS_MANAGE_ALL", "LEADS_MANAGE_ASSIGNED"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `stage` | query | No | {"type":"string","enum":["NEW","CONTACTED","QUALIFIED","NEGOTIATION","OFFER_SENT","WON","LOST"]} |  |
| `assignedTo` | query | No | {"maxLength":40,"type":"string"} | "me", "unassigned" or a member id |
| `branchId` | query | No | {"format":"uuid","type":"string"} |  |
| `source` | query | No | {"type":"string","enum":["WEBSITE_ENQUIRY","QUOTE_REQUEST","TRADE_IN","OFFER_ACCEPTED","PHONE","WHATSAPP","EMAIL","WALK_IN","OTHER"]} |  |
| `q` | query | No | {"maxLength":100,"type":"string"} |  |
| `followUpDue` | query | No | {"type":"boolean"} | Only leads with a follow-up due now or earlier |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/dealer/leads`

Create a lead manually (walk-in, phone, WhatsApp...)

**Access:** Bearer token required.
**Dealer access:** `{"anyPermission": ["LEADS_MANAGE_ALL", "LEADS_MANAGE_ASSIGNED"]}`.

**Request body:** required.

- `application/json`: CreateLeadDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `GET /api/v1/dealer/leads/stats`

Pipeline counts, conversion rate, average first response time, overdue follow-ups

**Access:** Bearer token required.
**Dealer access:** `{"anyPermission": ["LEADS_VIEW_ALL", "LEADS_MANAGE_ALL", "LEADS_MANAGE_ASSIGNED"]}`.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/dealer/leads/{id}`

**Access:** Bearer token required.
**Dealer access:** `{"anyPermission": ["LEADS_VIEW_ALL", "LEADS_MANAGE_ALL", "LEADS_MANAGE_ASSIGNED"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PATCH /api/v1/dealer/leads/{id}`

**Access:** Bearer token required.
**Dealer access:** `{"anyPermission": ["LEADS_MANAGE_ALL", "LEADS_MANAGE_ASSIGNED"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateLeadDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/dealer/leads/{id}/stage`

Move through New → Contacted → Qualified → Negotiation → Offer Sent → Won/Lost (FR-44)

**Access:** Bearer token required.
**Dealer access:** `{"anyPermission": ["LEADS_MANAGE_ALL", "LEADS_MANAGE_ASSIGNED"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: ChangeStageDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/dealer/leads/{id}/assign`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["LEADS_ASSIGN"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: AssignLeadDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/dealer/leads/{id}/activities`

Log a call, email, WhatsApp, meeting or note and schedule the next follow-up

**Access:** Bearer token required.
**Dealer access:** `{"anyPermission": ["LEADS_MANAGE_ALL", "LEADS_MANAGE_ASSIGNED"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: AddActivityDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |


## Enquiries (public forms)

### `POST /api/v1/enquiries/vehicle`

Contact the dealer about a vehicle (FR-14). Opens a lead for the dealer.

**Access:** Optional authentication.

**Request body:** required.

- `application/json`: VehicleEnquiryDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/enquiries/test-drive`

Book a test drive for a listed vehicle

**Access:** Optional authentication.

**Request body:** required.

- `application/json`: TestDriveDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/enquiries/quote`

Request a quotation for a vehicle (FR-06, FR-15)

**Access:** Optional authentication.

**Request body:** required.

- `application/json`: QuoteRequestDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/enquiries/beat-my-quote`

Beat My Quote: submit an existing quote for a better offer (FR-16)

**Access:** Optional authentication.

**Request body:** required.

- `application/json`: BeatMyQuoteDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/enquiries/trade-in`

Trade in a vehicle when buying another (FR-20)

**Access:** Optional authentication.

**Request body:** required.

- `application/json`: TradeInDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/enquiries/concierge`

Request concierge services (FR-21)

**Access:** Optional authentication.

**Request body:** required.

- `application/json`: ConciergeDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/enquiries/help-me-find`

Ask the team to find a vehicle (FR-22)

**Access:** Optional authentication.

**Request body:** required.

- `application/json`: HelpMeFindDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/enquiries/finance`

Finance application interest (FR-33 finance enquiries)

**Access:** Optional authentication.

**Request body:** required.

- `application/json`: FinanceEnquiryDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/enquiries/insurance`

Insurance quote request (FR-30)

**Access:** Optional authentication.

**Request body:** required.

- `application/json`: InsuranceEnquiryDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/enquiries/contact`

General "contact us" message

**Access:** Optional authentication.

**Request body:** required.

- `application/json`: GeneralContactDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |


## Customer: enquiries

### `GET /api/v1/me/enquiries`

My enquiries with status, dealer response and follow-up (FR-42)

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `type` | query | No | {"type":"string","enum":["VEHICLE","QUOTE","BEAT_MY_QUOTE","TRADE_IN","CONCIERGE","HELP_ME_FIND","FINANCE","INSURANCE","TEST_DRIVE","GENERAL"]} |  |
| `status` | query | No | {"type":"string","enum":["NEW","IN_PROGRESS","RESPONDED","CLOSED","CANCELLED"]} |  |
| `q` | query | No | {"maxLength":100,"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/me/enquiries/{id}`

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/me/enquiries/{id}/reply`

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: CustomerReplyDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/me/enquiries/{id}/cancel`

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |


## Dealer portal: enquiries

### `GET /api/v1/dealer/enquiries`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["ENQUIRIES_VIEW"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `type` | query | No | {"type":"string","enum":["VEHICLE","QUOTE","BEAT_MY_QUOTE","TRADE_IN","CONCIERGE","HELP_ME_FIND","FINANCE","INSURANCE","TEST_DRIVE","GENERAL"]} |  |
| `status` | query | No | {"type":"string","enum":["NEW","IN_PROGRESS","RESPONDED","CLOSED","CANCELLED"]} |  |
| `q` | query | No | {"maxLength":100,"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/dealer/enquiries/{id}`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["ENQUIRIES_VIEW"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/dealer/enquiries/{id}/respond`

Reply to the customer; also moves the lead from NEW to CONTACTED

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["ENQUIRIES_RESPOND"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: RespondDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |


## Admin: enquiries

### `GET /api/v1/admin/enquiries`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `type` | query | No | {"type":"string","enum":["VEHICLE","QUOTE","BEAT_MY_QUOTE","TRADE_IN","CONCIERGE","HELP_ME_FIND","FINANCE","INSURANCE","TEST_DRIVE","GENERAL"]} |  |
| `status` | query | No | {"type":"string","enum":["NEW","IN_PROGRESS","RESPONDED","CLOSED","CANCELLED"]} |  |
| `q` | query | No | {"maxLength":100,"type":"string"} |  |
| `dealerId` | query | No | {"format":"uuid","type":"string"} |  |
| `platformOnly` | query | No | {"type":"boolean"} | Only enquiries handled by the platform team (no dealer) |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/admin/enquiries/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PATCH /api/v1/admin/enquiries/{id}`

Change status, assign a team member or route the request to a dealer

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: AdminUpdateEnquiryDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/admin/enquiries/{id}/respond`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: RespondDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |


## Sell / value your vehicle

### `POST /api/v1/sell-requests`

Submit your vehicle for a valuation or to receive dealer offers (FR-08, FR-09)

**Access:** Optional authentication.

**Request body:** required.

- `application/json`: CreateSellRequestDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |


## Customer: my vehicles for sale

### `GET /api/v1/me/sell-requests`

My valuations and sell requests (FR-40)

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `status` | query | No | {"type":"string","enum":["SUBMITTED","UNDER_REVIEW","VALUED","BIDDING","OFFER_ACCEPTED","COMPLETED","CANCELLED","REJECTED"]} |  |
| `type` | query | No | {"type":"string","enum":["SELL","VALUATION"]} |  |
| `q` | query | No | {"maxLength":100,"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/me/sell-requests/{id}`

Valuations, bidding status and every dealer offer with its history

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/me/sell-requests/{id}/request-offers`

Ask ChangeCars to collect offers from the dealer network

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/me/sell-requests/{id}/cancel`

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/me/sell-requests/{id}/images/upload-url`

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: SellImageUploadDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/me/sell-requests/{id}/images`

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: ConfirmSellImageDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |


## Admin: sell requests

### `GET /api/v1/admin/sell-requests`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `status` | query | No | {"type":"string","enum":["SUBMITTED","UNDER_REVIEW","VALUED","BIDDING","OFFER_ACCEPTED","COMPLETED","CANCELLED","REJECTED"]} |  |
| `type` | query | No | {"type":"string","enum":["SELL","VALUATION"]} |  |
| `q` | query | No | {"maxLength":100,"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/admin/sell-requests/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/admin/sell-requests/{id}/valuations`

Record a manual valuation

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: ManualValuationDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `PATCH /api/v1/admin/sell-requests/{id}/status`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: AdminSellStatusDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Admin: bidding

### `GET /api/v1/admin/bidding-sessions`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `status` | query | No | {"type":"string","enum":["SCHEDULED","OPEN","CLOSED","AWARDED","CANCELLED"]} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/admin/sell-requests/{id}/bidding-sessions`

Publish a vehicle to the dealer network with explicit bidding rules (FR-10, FR-52)

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: OpenBiddingDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/admin/bidding-sessions/{id}/reopen`

Explicitly reopen a closed bidding process (BR-07)

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: ReopenBiddingDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/admin/bidding-sessions/{id}/cancel`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: RejectOfferDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |


## Dealer portal: bidding

### `GET /api/v1/dealer/bidding/sessions`

Vehicles open for bidding that my dealership is eligible for (BR-06)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["BIDDING_VIEW"], "requireApproved": true}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `status` | query | No | {"type":"string","enum":["SCHEDULED","OPEN","CLOSED","AWARDED","CANCELLED"]} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/dealer/bidding/sessions/{id}`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["BIDDING_VIEW"], "requireApproved": true}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/dealer/bidding/sessions/{id}/offers`

Submit (or revise/renew) this dealership’s offer

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["BIDDING_PARTICIPATE"], "requireApproved": true}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: SubmitOfferDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `GET /api/v1/dealer/offers`

My dealership’s offers (FR-13 manage offers)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["BIDDING_VIEW"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `status` | query | No | {"type":"string","enum":["SUBMITTED","PENDING","UPDATED","ACCEPTED","REJECTED","EXPIRED","WITHDRAWN","SUPERSEDED"]} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PATCH /api/v1/dealer/offers/{id}`

Revise an offer; full history is kept (BR-08)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["BIDDING_PARTICIPATE"], "requireApproved": true}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateOfferDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/dealer/offers/{id}/withdraw`

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["BIDDING_PARTICIPATE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/dealer/offers/{id}/counter-response`

Accept or decline the customer’s counter-offer (FR-56)

**Access:** Bearer token required.
**Dealer access:** `{"permissions": ["BIDDING_PARTICIPATE"]}`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: CounterResponseDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |


## Customer: offers

### `GET /api/v1/me/offers`

Dealer offers on my vehicles (FR-10, FR-40)

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `status` | query | No | {"type":"string","enum":["SUBMITTED","PENDING","UPDATED","ACCEPTED","REJECTED","EXPIRED","WITHDRAWN","SUPERSEDED"]} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/me/offers/{id}/accept`

Accept an offer (FR-54). Creates the deal and supersedes all other offers atomically.

**Access:** Bearer token required.
**Idempotency:** supported; send `Idempotency-Key`.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |
| `Idempotency-Key` | header | No | {"type":"string"} | Retry-safe acceptance |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/me/offers/{id}/reject`

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: RejectOfferDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/me/offers/{id}/counter`

Counter an offer with a higher amount (FR-56)

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: CounterOfferDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |


## Customer: account & dashboard

### `GET /api/v1/me`

My profile (FR-01)

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PATCH /api/v1/me`

**Access:** Bearer token required.

**Request body:** required.

- `application/json`: UpdateProfileDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/me/dashboard`

Personal dashboard: enquiries, valuations, offers, favourites, saved searches, history, notifications (FR-40)

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/me/sessions`

Signed-in devices (security settings)

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/me/sessions/{id}`

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `GET /api/v1/me/favourites`

Saved vehicles, kept across sessions and devices (FR-37)

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/me/favourites/ids`

Ids of saved vehicles (to render heart icons)

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PUT /api/v1/me/favourites/{vehicleId}`

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `vehicleId` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/me/favourites/{vehicleId}`

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `vehicleId` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/me/saved-searches`

Saved searches (FR-38)

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/me/saved-searches`

**Access:** Bearer token required.

**Request body:** required.

- `application/json`: CreateSavedSearchDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `PATCH /api/v1/me/saved-searches/{id}`

Rename, change criteria or toggle alerts

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateSavedSearchDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/me/saved-searches/{id}`

**Access:** Bearer token required.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `GET /api/v1/me/recently-viewed`

Recently viewed vehicles (FR-41)

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/me/recently-viewed`

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/me/export`

Download all my personal data (NFR-17)

**Access:** Bearer token required.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/me/delete-account`

Delete my account: personal data is anonymised (NFR-17)

**Access:** Bearer token required.

**Request body:** required.

- `application/json`: DeleteAccountDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |


## Content (public)

### `GET /api/v1/content/articles`

News, reviews, buying advice and guides (FR-28)

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `q` | query | No | {"maxLength":100,"type":"string"} |  |
| `category` | query | No | {"maxLength":80,"type":"string"} | Category slug |
| `type` | query | No | {"type":"string","enum":["NEWS","REVIEW","ADVICE","GUIDE","ARTICLE"]} |  |
| `tag` | query | No | {"maxLength":60,"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/content/articles/{slug}`

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `slug` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/content/article-categories`

**Access:** Public.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/content/media`

Videos and podcasts (FR-29)

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `type` | query | No | {"type":"string","enum":["VIDEO","PODCAST"]} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/content/media/{slug}`

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `slug` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/content/faqs`

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `category` | query | No | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/content/pages/{slug}`

Static pages: privacy policy, terms, insurance (FR-30), EV & charging info (FR-31)

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `slug` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/promotions`

Active specials and promotions (FR-23)

**Access:** Public.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/promotions/{slug}`

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `slug` | path | Yes | {"type":"string"} |  |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Admin: content

### `GET /api/v1/admin/articles`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `q` | query | No | {"maxLength":100,"type":"string"} |  |
| `category` | query | No | {"maxLength":80,"type":"string"} | Category slug |
| `type` | query | No | {"type":"string","enum":["NEWS","REVIEW","ADVICE","GUIDE","ARTICLE"]} |  |
| `tag` | query | No | {"maxLength":60,"type":"string"} |  |
| `status` | query | No | {"type":"string","enum":["DRAFT","PUBLISHED","ARCHIVED"]} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/admin/articles`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Request body:** required.

- `application/json`: ArticleDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `GET /api/v1/admin/articles/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PATCH /api/v1/admin/articles/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateArticleDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/admin/articles/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `POST /api/v1/admin/articles/{id}/status`

Publish (optionally scheduled), unpublish or archive

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: PublishDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `POST /api/v1/admin/article-categories`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Request body:** required.

- `application/json`: ArticleCategoryDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `DELETE /api/v1/admin/article-categories/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `GET /api/v1/admin/media`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `type` | query | No | {"type":"string","enum":["VIDEO","PODCAST"]} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/admin/media`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Request body:** required.

- `application/json`: MediaItemDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `PATCH /api/v1/admin/media/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateMediaItemDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/admin/media/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `POST /api/v1/admin/media/{id}/status`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: PublishDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `GET /api/v1/admin/faqs`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/admin/faqs`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Request body:** required.

- `application/json`: FaqDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `PATCH /api/v1/admin/faqs/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateFaqDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/admin/faqs/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `GET /api/v1/admin/pages`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/admin/pages`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Request body:** required.

- `application/json`: StaticPageDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `GET /api/v1/admin/pages/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PATCH /api/v1/admin/pages/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdateStaticPageDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/admin/pages/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `POST /api/v1/admin/pages/{id}/status`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: PublishDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `GET /api/v1/admin/promotions`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/admin/promotions`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Request body:** required.

- `application/json`: PromotionDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `PATCH /api/v1/admin/promotions/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UpdatePromotionDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `DELETE /api/v1/admin/promotions/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 204 | — | Schema not specified |

### `PUT /api/v1/admin/promotions/{id}/vehicles`

Set the vehicles included in a promotion

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: PromotionVehiclesDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Newsletter

### `POST /api/v1/newsletter/subscribe`

**Access:** Optional authentication.

**Request body:** required.

- `application/json`: SubscribeDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/newsletter/unsubscribe`

Unsubscribe with the token from any newsletter email

**Access:** Public.

**Request body:** required.

- `application/json`: UnsubscribeDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Admin: newsletter

### `GET /api/v1/admin/newsletter/subscribers`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `status` | query | No | {"type":"string","enum":["SUBSCRIBED","UNSUBSCRIBED"]} |  |
| `q` | query | No | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/admin/newsletter/subscribers.csv`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `status` | query | No | {"type":"string","enum":["SUBSCRIBED","UNSUBSCRIBED"]} |  |
| `q` | query | No | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Dealer portal: dashboard

### `GET /api/v1/dealer/dashboard`

Dealer dashboard summary (FR-13)

**Access:** Bearer token required.
**Dealer access:** `{"allowInactive": true}`.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Admin: users, statistics, audit, system

### `GET /api/v1/admin/stats`

Platform statistics (FR-34)

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/admin/users`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `role` | query | No | {"type":"string","enum":["CUSTOMER","DEALER","ADMIN","SUPER_ADMIN"]} |  |
| `status` | query | No | {"type":"string","enum":["ACTIVE","SUSPENDED","DELETED"]} |  |
| `q` | query | No | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/admin/users`

Invite an administrator (super admin only)

**Access:** Bearer token required.
**Roles declared:** SUPER_ADMIN.

**Request body:** required.

- `application/json`: CreateAdminDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |

### `GET /api/v1/admin/users/{id}`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PATCH /api/v1/admin/users/{id}/status`

Suspend or reactivate a user (suspension signs them out everywhere)

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UserStatusDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `PATCH /api/v1/admin/users/{id}/role`

**Access:** Bearer token required.
**Roles declared:** SUPER_ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: UserRoleDto (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/admin/audit-logs`

Audit trail: who did what, when, previous and new values (BR-13)

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `entityType` | query | No | {"type":"string"} |  |
| `entityId` | query | No | {"type":"string"} |  |
| `actorId` | query | No | {"type":"string"} |  |
| `action` | query | No | {"type":"string"} | Action prefix, e.g. "vehicle." or "offer.accept" |
| `from` | query | No | {"type":"string"} |  |
| `to` | query | No | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/admin/system/outbox`

Background queue health: depth by status and age of the oldest pending event

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/admin/system/outbox/events`

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | query | No | {"minimum":1,"default":1,"type":"number"} |  |
| `pageSize` | query | No | {"minimum":1,"maximum":100,"default":20,"type":"number"} |  |
| `status` | query | No | {"default":"DEAD","type":"string","enum":["PENDING","PROCESSING","DONE","DEAD"]} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/admin/system/outbox/events/{id}/retry`

Re-queue a dead-lettered event

**Access:** Bearer token required.
**Roles declared:** ADMIN.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 201 | — | Schema not specified |


## SEO

### `GET /api/v1/seo/sitemap.xml`

Sitemap index (NFR-12)

**Access:** Public.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/seo/sitemap-static.xml`

**Access:** Public.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/seo/sitemap-vehicles-{page}.xml`

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `page` | path | Yes | {"type":"number"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/seo/vehicles/{slug}/structured-data`

schema.org JSON-LD for a vehicle page

**Access:** Public.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `slug` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Website adapter: cars and articles

### `GET /api/v1/web/cars`

Car search with the website CarSearch fields → { cars, total, page, pageCount }

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/cars/all`

Every listed car, newest first (capped at 1000)

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `limit` | query | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/cars/featured`

Featured cars, shuffled on every call (not cached)

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `limit` | query | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/cars/premium`

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `limit` | query | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/cars/recent`

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `limit` | query | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/cars/{id}`

One car by its website id (32 hex characters). Counts a view.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/cars/{id}/dealer-cars`

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |
| `limit` | query | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/cars/{id}/similar`

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |
| `limit` | query | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/cars/{id}/popular-dealers`

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |
| `limit` | query | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/cars/{id}/market-price`

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/article-categories`

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/articles`

News search → { articles, total, page, pageCount }

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `q` | query | Yes | {"type":"string"} |  |
| `category` | query | Yes | {"type":"string"} |  |
| `page` | query | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/articles/featured`

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/articles/latest`

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `limit` | query | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/articles/{slug}`

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `slug` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Website adapter: dashboards

### `GET /api/v1/web/dashboard/overview`

**Access:** OpenAPI declares authentication; check controller access rules.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/dashboard/dealers`

**Access:** OpenAPI declares authentication; check controller access rules.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/dashboard/dealers-by-id`

**Access:** OpenAPI declares authentication; check controller access rules.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/dashboard/dealers/{id}`

**Access:** OpenAPI declares authentication; check controller access rules.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/web/dashboard/dealers/{id}/status`

**Access:** OpenAPI declares authentication; check controller access rules.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `id` | path | Yes | {"type":"string"} |  |

**Request body:** required.

- `application/json`: DealerStatusBody (see schemas)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/dashboard/inventory`

**Access:** OpenAPI declares authentication; check controller access rules.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `dealerId` | query | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/dashboard/leads`

**Access:** OpenAPI declares authentication; check controller access rules.

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `dealerId` | query | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/dashboard/staff`

**Access:** OpenAPI declares authentication; check controller access rules.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `GET /api/v1/web/dashboard/activity`

**Access:** OpenAPI declares authentication; check controller access rules.

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |


## Website adapter: forms

### `POST /api/v1/web/forms/{form}`

Submit a website form (newsletter, contact, vehicle-enquiry, beat-my-quote, keep-it, new-vehicle-quote, value-my-vehicle, sell-vehicle, sell-vehicle-site, special). Errors: 422 FORM_INVALID { details.fields }

**Parameters**

| Name | Location | Required | Schema | Description |
| --- | --- | --- | --- | --- |
| `form` | path | Yes | {"type":"string"} |  |

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/web/uploads/url`

Presigned upload for a photo or document of a submitted website form (token from the form receipt)

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/web/uploads/confirm`

Attach an uploaded file to the request the token belongs to

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

### `POST /api/v1/web/auth/register`

Website sign-up (private seller or dealer). Errors: 422 FORM_INVALID { details.fields }

**Documented responses**

| HTTP status | Description | Content / schema |
| --- | --- | --- |
| 200 | — | Schema not specified |

## Schemas

Schema references above resolve to the definitions below. JSON Schema properties include required fields, enums, types and validation constraints where documented.

### RegisterDto

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "maxLength": 254,
      "format": "email",
      "example": "thabo@example.com"
    },
    "password": {
      "type": "string",
      "example": "Sup3rSecret!"
    },
    "firstName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "example": "Thabo"
    },
    "lastName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "example": "Nkosi"
    },
    "phone": {
      "type": "string",
      "example": "+27 82 123 4567"
    },
    "marketingConsent": {
      "type": "boolean",
      "default": false
    },
    "acceptTerms": {
      "type": "boolean",
      "description": "Must be true: user accepts terms and privacy policy (NFR-17)"
    }
  },
  "required": [
    "email",
    "password",
    "firstName",
    "lastName",
    "acceptTerms"
  ]
}
```

### LoginDto

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    },
    "password": {
      "type": "string",
      "minLength": 1,
      "maxLength": 128
    }
  },
  "required": [
    "email",
    "password"
  ]
}
```

### RefreshTokenDto

```json
{
  "type": "object",
  "properties": {
    "refreshToken": {
      "type": "string",
      "minLength": 20,
      "maxLength": 200
    }
  },
  "required": [
    "refreshToken"
  ]
}
```

### ForgotPasswordDto

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    }
  },
  "required": [
    "email"
  ]
}
```

### ResetPasswordDto

```json
{
  "type": "object",
  "properties": {
    "token": {
      "type": "string",
      "minLength": 20,
      "maxLength": 200
    },
    "password": {
      "type": "string"
    }
  },
  "required": [
    "token",
    "password"
  ]
}
```

### ChangePasswordDto

```json
{
  "type": "object",
  "properties": {
    "currentPassword": {
      "type": "string",
      "minLength": 1,
      "maxLength": 128
    },
    "newPassword": {
      "type": "string"
    }
  },
  "required": [
    "currentPassword",
    "newPassword"
  ]
}
```

### NotificationPreferenceItemDto

```json
{
  "type": "object",
  "properties": {
    "eventType": {
      "type": "string",
      "example": "offer.new"
    },
    "channel": {
      "enum": [
        "IN_APP",
        "EMAIL",
        "SMS"
      ],
      "type": "string"
    },
    "enabled": {
      "type": "boolean"
    }
  },
  "required": [
    "eventType",
    "channel",
    "enabled"
  ]
}
```

### UpdateNotificationPreferencesDto

```json
{
  "type": "object",
  "properties": {
    "items": {
      "maxItems": 200,
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/NotificationPreferenceItemDto"
      }
    }
  },
  "required": [
    "items"
  ]
}
```

### DealershipInputDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "example": "Sandton Auto"
    },
    "legalName": {
      "type": "string",
      "maxLength": 200
    },
    "registrationNumber": {
      "type": "string",
      "maxLength": 50,
      "description": "CIPC company registration number"
    },
    "vatNumber": {
      "type": "string",
      "maxLength": 50
    },
    "dealerLicenceNumber": {
      "type": "string",
      "maxLength": 50
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string"
    },
    "website": {
      "type": "string",
      "format": "uri"
    },
    "description": {
      "type": "string",
      "maxLength": 4000
    },
    "province": {
      "enum": [
        "EASTERN_CAPE",
        "FREE_STATE",
        "GAUTENG",
        "KWAZULU_NATAL",
        "LIMPOPO",
        "MPUMALANGA",
        "NORTHERN_CAPE",
        "NORTH_WEST",
        "WESTERN_CAPE"
      ],
      "type": "string"
    },
    "city": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120
    },
    "address": {
      "type": "string",
      "minLength": 3,
      "maxLength": 300
    }
  },
  "required": [
    "name",
    "email",
    "phone",
    "province",
    "city",
    "address"
  ]
}
```

### OperatingHoursDto

```json
{
  "type": "object",
  "properties": {
    "day": {
      "type": "string",
      "enum": [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun",
        "PublicHoliday"
      ]
    },
    "open": {
      "type": "string",
      "example": "08:00"
    },
    "close": {
      "type": "string",
      "example": "17:00"
    },
    "closed": {
      "type": "boolean",
      "default": false
    }
  },
  "required": [
    "day"
  ]
}
```

### RegisterDealerDto

```json
{
  "type": "object",
  "properties": {
    "owner": {
      "description": "Owner login credentials and contact person",
      "allOf": [
        {
          "$ref": "#/components/schemas/RegisterDto"
        }
      ]
    },
    "dealership": {
      "$ref": "#/components/schemas/DealershipInputDto"
    },
    "operatingHours": {
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/OperatingHoursDto"
      }
    }
  },
  "required": [
    "owner",
    "dealership"
  ]
}
```

### UpdateDealerProfileDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "example": "Sandton Auto"
    },
    "legalName": {
      "type": "string",
      "maxLength": 200
    },
    "registrationNumber": {
      "type": "string",
      "maxLength": 50,
      "description": "CIPC company registration number"
    },
    "vatNumber": {
      "type": "string",
      "maxLength": 50
    },
    "dealerLicenceNumber": {
      "type": "string",
      "maxLength": 50
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string"
    },
    "website": {
      "type": "string",
      "format": "uri"
    },
    "description": {
      "type": "string",
      "maxLength": 4000
    },
    "province": {
      "enum": [
        "EASTERN_CAPE",
        "FREE_STATE",
        "GAUTENG",
        "KWAZULU_NATAL",
        "LIMPOPO",
        "MPUMALANGA",
        "NORTHERN_CAPE",
        "NORTH_WEST",
        "WESTERN_CAPE"
      ],
      "type": "string"
    },
    "city": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120
    },
    "address": {
      "type": "string",
      "minLength": 3,
      "maxLength": 300
    },
    "logoUrl": {
      "type": "string",
      "format": "uri"
    }
  }
}
```

### DocumentUploadRequestDto

```json
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": [
        "COMPANY_REGISTRATION",
        "TAX_CLEARANCE",
        "OWNER_ID",
        "DEALER_LICENCE",
        "PROOF_OF_ADDRESS",
        "OTHER"
      ]
    },
    "fileName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "contentType": {
      "type": "string",
      "enum": [
        "application/pdf",
        "image/jpeg",
        "image/png"
      ]
    }
  },
  "required": [
    "type",
    "fileName",
    "contentType"
  ]
}
```

### ConfirmDocumentDto

```json
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": [
        "COMPANY_REGISTRATION",
        "TAX_CLEARANCE",
        "OWNER_ID",
        "DEALER_LICENCE",
        "PROOF_OF_ADDRESS",
        "OTHER"
      ]
    },
    "fileName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "contentType": {
      "type": "string",
      "enum": [
        "application/pdf",
        "image/jpeg",
        "image/png"
      ]
    },
    "storageKey": {
      "type": "string",
      "minLength": 10,
      "maxLength": 300
    }
  },
  "required": [
    "type",
    "fileName",
    "contentType",
    "storageKey"
  ]
}
```

### BranchInputDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "example": "Sandton"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string"
    },
    "address": {
      "type": "string",
      "minLength": 3,
      "maxLength": 300
    },
    "city": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120
    },
    "province": {
      "enum": [
        "EASTERN_CAPE",
        "FREE_STATE",
        "GAUTENG",
        "KWAZULU_NATAL",
        "LIMPOPO",
        "MPUMALANGA",
        "NORTHERN_CAPE",
        "NORTH_WEST",
        "WESTERN_CAPE"
      ],
      "type": "string"
    },
    "latitude": {
      "type": "number"
    },
    "longitude": {
      "type": "number"
    },
    "operatingHours": {
      "maxItems": 8,
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/OperatingHoursDto"
      }
    }
  },
  "required": [
    "name",
    "address",
    "city",
    "province"
  ]
}
```

### UpdateBranchDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "example": "Sandton"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string"
    },
    "address": {
      "type": "string",
      "minLength": 3,
      "maxLength": 300
    },
    "city": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120
    },
    "province": {
      "enum": [
        "EASTERN_CAPE",
        "FREE_STATE",
        "GAUTENG",
        "KWAZULU_NATAL",
        "LIMPOPO",
        "MPUMALANGA",
        "NORTHERN_CAPE",
        "NORTH_WEST",
        "WESTERN_CAPE"
      ],
      "type": "string"
    },
    "latitude": {
      "type": "number"
    },
    "longitude": {
      "type": "number"
    },
    "operatingHours": {
      "maxItems": 8,
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/OperatingHoursDto"
      }
    },
    "isActive": {
      "type": "boolean"
    }
  }
}
```

### CreateStaffDto

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    },
    "firstName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80
    },
    "lastName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80
    },
    "phone": {
      "type": "string"
    },
    "role": {
      "enum": [
        "MANAGER",
        "SALES",
        "STAFF"
      ],
      "type": "string"
    },
    "branchId": {
      "type": "string",
      "format": "uuid"
    },
    "extraPermissions": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "DEALER_PROFILE_MANAGE",
          "BRANCHES_MANAGE",
          "STAFF_MANAGE",
          "INVENTORY_VIEW",
          "INVENTORY_MANAGE",
          "INVENTORY_PUBLISH",
          "ENQUIRIES_VIEW",
          "ENQUIRIES_RESPOND",
          "LEADS_VIEW_ALL",
          "LEADS_MANAGE_ALL",
          "LEADS_MANAGE_ASSIGNED",
          "LEADS_ASSIGN",
          "BIDDING_VIEW",
          "BIDDING_PARTICIPATE",
          "REPORTS_VIEW"
        ]
      }
    }
  },
  "required": [
    "email",
    "firstName",
    "lastName",
    "role"
  ]
}
```

### UpdateStaffDto

```json
{
  "type": "object",
  "properties": {
    "role": {
      "enum": [
        "MANAGER",
        "SALES",
        "STAFF"
      ],
      "type": "string"
    },
    "branchId": {
      "type": "string",
      "nullable": true,
      "format": "uuid"
    },
    "extraPermissions": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "DEALER_PROFILE_MANAGE",
          "BRANCHES_MANAGE",
          "STAFF_MANAGE",
          "INVENTORY_VIEW",
          "INVENTORY_MANAGE",
          "INVENTORY_PUBLISH",
          "ENQUIRIES_VIEW",
          "ENQUIRIES_RESPOND",
          "LEADS_VIEW_ALL",
          "LEADS_MANAGE_ALL",
          "LEADS_MANAGE_ASSIGNED",
          "LEADS_ASSIGN",
          "BIDDING_VIEW",
          "BIDDING_PARTICIPATE",
          "REPORTS_VIEW"
        ]
      }
    },
    "status": {
      "enum": [
        "ACTIVE",
        "DISABLED"
      ],
      "type": "string"
    }
  }
}
```

### ChangeDealerStatusDto

```json
{
  "type": "object",
  "properties": {
    "status": {
      "enum": [
        "APPROVED",
        "REJECTED",
        "SUSPENDED"
      ],
      "type": "string"
    },
    "reason": {
      "type": "string",
      "maxLength": 1000,
      "description": "Required when rejecting or suspending"
    }
  },
  "required": [
    "status"
  ]
}
```

### AdminUpdateDealerDto

```json
{
  "type": "object",
  "properties": {
    "plan": {
      "enum": [
        "BASIC",
        "SILVER",
        "GOLD"
      ],
      "type": "string"
    },
    "biddingEnabled": {
      "type": "boolean"
    },
    "rating": {
      "type": "number",
      "minimum": 0,
      "maximum": 5
    }
  }
}
```

### CreateMakeDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "example": "BMW"
    },
    "logoUrl": {
      "type": "string",
      "format": "uri"
    },
    "country": {
      "type": "string",
      "maxLength": 80,
      "example": "Germany"
    },
    "sortOrder": {
      "type": "number"
    },
    "isActive": {
      "type": "boolean"
    }
  },
  "required": [
    "name"
  ]
}
```

### UpdateMakeDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "example": "BMW"
    },
    "logoUrl": {
      "type": "string",
      "format": "uri"
    },
    "country": {
      "type": "string",
      "maxLength": 80,
      "example": "Germany"
    },
    "sortOrder": {
      "type": "number"
    },
    "isActive": {
      "type": "boolean"
    }
  }
}
```

### CreateModelDto

```json
{
  "type": "object",
  "properties": {
    "makeId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "example": "3 Series"
    },
    "defaultCategoryId": {
      "type": "string",
      "format": "uuid"
    },
    "isActive": {
      "type": "boolean"
    }
  },
  "required": [
    "makeId",
    "name"
  ]
}
```

### UpdateModelDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "example": "3 Series"
    },
    "defaultCategoryId": {
      "type": "string",
      "format": "uuid"
    },
    "isActive": {
      "type": "boolean"
    }
  }
}
```

### CreateGenerationDto

```json
{
  "type": "object",
  "properties": {
    "modelId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "example": "G20"
    },
    "yearFrom": {
      "type": "number",
      "minimum": 1900,
      "maximum": 2028,
      "example": 2019
    },
    "yearTo": {
      "type": "number",
      "minimum": 1900,
      "maximum": 2028,
      "example": 2025
    }
  },
  "required": [
    "modelId",
    "name",
    "yearFrom"
  ]
}
```

### UpdateGenerationDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "example": "G20"
    },
    "yearFrom": {
      "type": "number",
      "minimum": 1900,
      "maximum": 2028,
      "example": 2019
    },
    "yearTo": {
      "type": "number",
      "minimum": 1900,
      "maximum": 2028,
      "example": 2025
    }
  }
}
```

### SpecificationDto

```json
{
  "type": "object",
  "properties": {
    "engine": {
      "type": "string",
      "maxLength": 120,
      "example": "2.0L 4-cylinder turbo petrol"
    },
    "engineCapacityCc": {
      "type": "number",
      "minimum": 0,
      "maximum": 20000
    },
    "cylinders": {
      "type": "number",
      "minimum": 0,
      "maximum": 32
    },
    "powerKw": {
      "type": "number",
      "minimum": 0,
      "maximum": 2000
    },
    "torqueNm": {
      "type": "number",
      "minimum": 0,
      "maximum": 3000
    },
    "transmission": {
      "enum": [
        "UNKNOWN",
        "MANUAL",
        "AUTOMATIC"
      ],
      "type": "string"
    },
    "gears": {
      "type": "number",
      "minimum": 0,
      "maximum": 12
    },
    "drivetrain": {
      "enum": [
        "FWD",
        "RWD",
        "AWD",
        "FOUR_X_TWO",
        "FOUR_X_FOUR"
      ],
      "type": "string"
    },
    "fuelType": {
      "enum": [
        "PETROL",
        "DIESEL",
        "HYBRID",
        "PLUGIN_HYBRID",
        "ELECTRIC",
        "LPG",
        "OTHER"
      ],
      "type": "string"
    },
    "fuelConsumptionL100": {
      "type": "number",
      "minimum": 0,
      "maximum": 50
    },
    "co2GKm": {
      "type": "number",
      "minimum": 0,
      "maximum": 1000
    },
    "seats": {
      "type": "number",
      "minimum": 1,
      "maximum": 60
    },
    "doors": {
      "type": "number",
      "minimum": 0,
      "maximum": 6
    },
    "lengthMm": {
      "type": "number",
      "minimum": 0,
      "maximum": 30000
    },
    "widthMm": {
      "type": "number",
      "minimum": 0,
      "maximum": 5000
    },
    "heightMm": {
      "type": "number",
      "minimum": 0,
      "maximum": 5000
    },
    "wheelbaseMm": {
      "type": "number",
      "minimum": 0,
      "maximum": 10000
    },
    "bootLitres": {
      "type": "number",
      "minimum": 0,
      "maximum": 10000
    },
    "kerbWeightKg": {
      "type": "number",
      "minimum": 0,
      "maximum": 50000
    },
    "fuelTankLitres": {
      "type": "number",
      "minimum": 0,
      "maximum": 1000
    },
    "topSpeedKmh": {
      "type": "number",
      "minimum": 0,
      "maximum": 500
    },
    "zeroTo100Sec": {
      "type": "number",
      "minimum": 0,
      "maximum": 60
    },
    "batteryKwh": {
      "type": "number",
      "minimum": 0,
      "maximum": 500
    },
    "electricRangeKm": {
      "type": "number",
      "minimum": 0,
      "maximum": 2000
    },
    "warranty": {
      "type": "string",
      "maxLength": 200,
      "example": "5 years / 100 000 km"
    },
    "servicePlan": {
      "type": "string",
      "maxLength": 200,
      "example": "5 years / 100 000 km"
    },
    "safetyRating": {
      "type": "string",
      "maxLength": 100,
      "example": "5-star Euro NCAP"
    },
    "extra": {
      "type": "object",
      "additionalProperties": true,
      "description": "Other technical specifications as key/value pairs"
    }
  }
}
```

### CreateVariantDto

```json
{
  "type": "object",
  "properties": {
    "modelId": {
      "type": "string",
      "format": "uuid"
    },
    "generationId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120,
      "example": "320i M Sport"
    },
    "yearFrom": {
      "type": "number",
      "minimum": 1900,
      "maximum": 2028,
      "example": 2022
    },
    "yearTo": {
      "type": "number",
      "minimum": 1900,
      "maximum": 2028
    },
    "bodyCategoryId": {
      "type": "string",
      "format": "uuid"
    },
    "basePrice": {
      "type": "number",
      "minimum": 0,
      "description": "List price in rand (new vehicles)"
    },
    "isActive": {
      "type": "boolean"
    },
    "specification": {
      "$ref": "#/components/schemas/SpecificationDto"
    }
  },
  "required": [
    "modelId",
    "name",
    "yearFrom"
  ]
}
```

### UpdateVariantDto

```json
{
  "type": "object",
  "properties": {
    "generationId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120,
      "example": "320i M Sport"
    },
    "yearFrom": {
      "type": "number",
      "minimum": 1900,
      "maximum": 2028,
      "example": 2022
    },
    "yearTo": {
      "type": "number",
      "minimum": 1900,
      "maximum": 2028
    },
    "bodyCategoryId": {
      "type": "string",
      "format": "uuid"
    },
    "basePrice": {
      "type": "number",
      "minimum": 0,
      "description": "List price in rand (new vehicles)"
    },
    "isActive": {
      "type": "boolean"
    },
    "specification": {
      "$ref": "#/components/schemas/SpecificationDto"
    }
  }
}
```

### CategoryDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "example": "SUVs"
    },
    "description": {
      "type": "string",
      "maxLength": 500
    },
    "icon": {
      "type": "string",
      "maxLength": 80
    },
    "sortOrder": {
      "type": "number"
    },
    "isActive": {
      "type": "boolean"
    }
  },
  "required": [
    "name"
  ]
}
```

### UpdateCategoryDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "example": "SUVs"
    },
    "description": {
      "type": "string",
      "maxLength": 500
    },
    "icon": {
      "type": "string",
      "maxLength": 80
    },
    "sortOrder": {
      "type": "number"
    },
    "isActive": {
      "type": "boolean"
    }
  }
}
```

### FeatureDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120,
      "example": "Adaptive cruise control"
    },
    "group": {
      "type": "string",
      "enum": [
        "SAFETY",
        "COMFORT",
        "TECHNOLOGY",
        "EXTERIOR",
        "INTERIOR",
        "PERFORMANCE",
        "OTHER"
      ]
    },
    "description": {
      "type": "string",
      "maxLength": 500
    }
  },
  "required": [
    "name"
  ]
}
```

### UpdateFeatureDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120,
      "example": "Adaptive cruise control"
    },
    "group": {
      "type": "string",
      "enum": [
        "SAFETY",
        "COMFORT",
        "TECHNOLOGY",
        "EXTERIOR",
        "INTERIOR",
        "PERFORMANCE",
        "OTHER"
      ]
    },
    "description": {
      "type": "string",
      "maxLength": 500
    }
  }
}
```

### AssignFeatureDto

```json
{
  "type": "object",
  "properties": {
    "featureId": {
      "type": "string",
      "format": "uuid"
    },
    "availability": {
      "enum": [
        "STANDARD",
        "OPTIONAL"
      ],
      "type": "string"
    },
    "level": {
      "enum": [
        "make",
        "model",
        "generation",
        "variant"
      ],
      "type": "string"
    },
    "targetId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "featureId",
    "availability",
    "level",
    "targetId"
  ]
}
```

### CreateVehicleDto

```json
{
  "type": "object",
  "properties": {
    "makeId": {
      "type": "string",
      "format": "uuid"
    },
    "modelId": {
      "type": "string",
      "format": "uuid"
    },
    "generationId": {
      "type": "string",
      "format": "uuid"
    },
    "variantId": {
      "type": "string",
      "format": "uuid",
      "description": "Strongly recommended: fills specs from the catalogue"
    },
    "branchId": {
      "type": "string",
      "format": "uuid"
    },
    "condition": {
      "enum": [
        "NEW",
        "USED",
        "DEMO"
      ],
      "type": "string"
    },
    "year": {
      "type": "number",
      "minimum": 1900,
      "maximum": 2027,
      "example": 2021
    },
    "mileage": {
      "type": "number",
      "minimum": 0,
      "maximum": 2000000,
      "example": 45000
    },
    "price": {
      "type": "number",
      "minimum": 1000,
      "maximum": 100000000,
      "example": 459900,
      "description": "Rand"
    },
    "title": {
      "type": "string",
      "minLength": 3,
      "maxLength": 160,
      "description": "Defaults to \"<year> <make> <model> <variant>\""
    },
    "description": {
      "type": "string",
      "maxLength": 10000
    },
    "stockNumber": {
      "type": "string",
      "maxLength": 60
    },
    "transmission": {
      "enum": [
        "UNKNOWN",
        "MANUAL",
        "AUTOMATIC"
      ],
      "type": "string"
    },
    "fuelType": {
      "enum": [
        "PETROL",
        "DIESEL",
        "HYBRID",
        "PLUGIN_HYBRID",
        "ELECTRIC",
        "LPG",
        "OTHER"
      ],
      "type": "string"
    },
    "drivetrain": {
      "enum": [
        "FWD",
        "RWD",
        "AWD",
        "FOUR_X_TWO",
        "FOUR_X_FOUR"
      ],
      "type": "string"
    },
    "colour": {
      "type": "string",
      "maxLength": 40
    },
    "engineCapacityCc": {
      "type": "number",
      "minimum": 0,
      "maximum": 20000
    },
    "powerKw": {
      "type": "number",
      "minimum": 0,
      "maximum": 2000
    },
    "cylinders": {
      "type": "number",
      "minimum": 0,
      "maximum": 32
    },
    "seats": {
      "type": "number",
      "minimum": 1,
      "maximum": 60
    },
    "doors": {
      "type": "number",
      "minimum": 0,
      "maximum": 6
    },
    "vin": {
      "type": "string",
      "pattern": "^[A-HJ-NPR-Z0-9]{11,17}$",
      "description": "Private, never shown publicly"
    },
    "registrationNumber": {
      "type": "string",
      "maxLength": 20,
      "description": "Private, never shown publicly"
    },
    "province": {
      "enum": [
        "EASTERN_CAPE",
        "FREE_STATE",
        "GAUTENG",
        "KWAZULU_NATAL",
        "LIMPOPO",
        "MPUMALANGA",
        "NORTHERN_CAPE",
        "NORTH_WEST",
        "WESTERN_CAPE"
      ],
      "type": "string",
      "description": "Defaults to the branch/dealer province"
    },
    "city": {
      "type": "string",
      "maxLength": 120
    },
    "latitude": {
      "type": "number"
    },
    "longitude": {
      "type": "number"
    },
    "categoryIds": {
      "maxItems": 10,
      "description": "Extra category ids; body and fuel categories are assigned automatically",
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      }
    },
    "featureIds": {
      "maxItems": 200,
      "description": "Vehicle-level feature ids (FR-50)",
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      }
    },
    "isSpecial": {
      "type": "boolean"
    },
    "specialPrice": {
      "type": "number",
      "minimum": 1000,
      "description": "Promotional price when on special (FR-23)"
    },
    "promotionId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "makeId",
    "modelId",
    "condition",
    "year",
    "mileage",
    "price"
  ]
}
```

### UpdateVehicleDto

```json
{
  "type": "object",
  "properties": {
    "makeId": {
      "type": "string",
      "format": "uuid"
    },
    "modelId": {
      "type": "string",
      "format": "uuid"
    },
    "generationId": {
      "type": "string",
      "format": "uuid"
    },
    "variantId": {
      "type": "string",
      "format": "uuid",
      "description": "Strongly recommended: fills specs from the catalogue"
    },
    "branchId": {
      "type": "string",
      "format": "uuid"
    },
    "condition": {
      "enum": [
        "NEW",
        "USED",
        "DEMO"
      ],
      "type": "string"
    },
    "year": {
      "type": "number",
      "minimum": 1900,
      "maximum": 2027,
      "example": 2021
    },
    "mileage": {
      "type": "number",
      "minimum": 0,
      "maximum": 2000000,
      "example": 45000
    },
    "price": {
      "type": "number",
      "minimum": 1000,
      "maximum": 100000000,
      "example": 459900,
      "description": "Rand"
    },
    "title": {
      "type": "string",
      "minLength": 3,
      "maxLength": 160,
      "description": "Defaults to \"<year> <make> <model> <variant>\""
    },
    "description": {
      "type": "string",
      "maxLength": 10000
    },
    "stockNumber": {
      "type": "string",
      "maxLength": 60
    },
    "transmission": {
      "enum": [
        "UNKNOWN",
        "MANUAL",
        "AUTOMATIC"
      ],
      "type": "string"
    },
    "fuelType": {
      "enum": [
        "PETROL",
        "DIESEL",
        "HYBRID",
        "PLUGIN_HYBRID",
        "ELECTRIC",
        "LPG",
        "OTHER"
      ],
      "type": "string"
    },
    "drivetrain": {
      "enum": [
        "FWD",
        "RWD",
        "AWD",
        "FOUR_X_TWO",
        "FOUR_X_FOUR"
      ],
      "type": "string"
    },
    "colour": {
      "type": "string",
      "maxLength": 40
    },
    "engineCapacityCc": {
      "type": "number",
      "minimum": 0,
      "maximum": 20000
    },
    "powerKw": {
      "type": "number",
      "minimum": 0,
      "maximum": 2000
    },
    "cylinders": {
      "type": "number",
      "minimum": 0,
      "maximum": 32
    },
    "seats": {
      "type": "number",
      "minimum": 1,
      "maximum": 60
    },
    "doors": {
      "type": "number",
      "minimum": 0,
      "maximum": 6
    },
    "vin": {
      "type": "string",
      "pattern": "^[A-HJ-NPR-Z0-9]{11,17}$",
      "description": "Private, never shown publicly"
    },
    "registrationNumber": {
      "type": "string",
      "maxLength": 20,
      "description": "Private, never shown publicly"
    },
    "province": {
      "enum": [
        "EASTERN_CAPE",
        "FREE_STATE",
        "GAUTENG",
        "KWAZULU_NATAL",
        "LIMPOPO",
        "MPUMALANGA",
        "NORTHERN_CAPE",
        "NORTH_WEST",
        "WESTERN_CAPE"
      ],
      "type": "string",
      "description": "Defaults to the branch/dealer province"
    },
    "city": {
      "type": "string",
      "maxLength": 120
    },
    "latitude": {
      "type": "number"
    },
    "longitude": {
      "type": "number"
    },
    "categoryIds": {
      "maxItems": 10,
      "description": "Extra category ids; body and fuel categories are assigned automatically",
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      }
    },
    "featureIds": {
      "maxItems": 200,
      "description": "Vehicle-level feature ids (FR-50)",
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      }
    },
    "isSpecial": {
      "type": "boolean"
    },
    "specialPrice": {
      "type": "number",
      "minimum": 1000,
      "description": "Promotional price when on special (FR-23)"
    },
    "promotionId": {
      "type": "string",
      "format": "uuid"
    },
    "expectedVersion": {
      "type": "number",
      "description": "Optimistic concurrency: the version you last read"
    }
  }
}
```

### ReserveDto

```json
{
  "type": "object",
  "properties": {
    "reason": {
      "type": "string",
      "maxLength": 1000,
      "description": "Reason (required for reject and admin suspend)"
    },
    "reservedUntil": {
      "type": "string",
      "description": "Reservation expiry; defaults to RESERVATION_HOLD_HOURS from now"
    }
  }
}
```

### TransitionDto

```json
{
  "type": "object",
  "properties": {
    "reason": {
      "type": "string",
      "maxLength": 1000,
      "description": "Reason (required for reject and admin suspend)"
    }
  }
}
```

### ImageUploadRequestDto

```json
{
  "type": "object",
  "properties": {
    "contentType": {
      "type": "string",
      "enum": [
        "image/jpeg",
        "image/png",
        "image/webp"
      ]
    },
    "sizeBytes": {
      "type": "number",
      "minimum": 1,
      "description": "File size in bytes"
    }
  },
  "required": [
    "contentType",
    "sizeBytes"
  ]
}
```

### ReorderImagesDto

```json
{
  "type": "object",
  "properties": {
    "imageIds": {
      "maxItems": 100,
      "description": "Image ids in display order; the first becomes primary",
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      }
    }
  },
  "required": [
    "imageIds"
  ]
}
```

### UpdateImageDto

```json
{
  "type": "object",
  "properties": {
    "altText": {
      "type": "string",
      "maxLength": 200
    },
    "isPrimary": {
      "type": "boolean"
    }
  }
}
```

### AdminFlagsDto

```json
{
  "type": "object",
  "properties": {
    "isFeatured": {
      "type": "boolean"
    },
    "isSpecial": {
      "type": "boolean"
    }
  }
}
```

### RepaymentDto

```json
{
  "type": "object",
  "properties": {
    "vehiclePrice": {
      "type": "number",
      "example": 450000
    },
    "deposit": {
      "type": "number",
      "example": 45000
    },
    "termMonths": {
      "type": "number",
      "example": 72,
      "default": 72
    },
    "annualInterestRate": {
      "type": "number",
      "example": 11.75
    },
    "balloonPercent": {
      "type": "number",
      "example": 30
    }
  },
  "required": [
    "vehiclePrice",
    "deposit",
    "termMonths",
    "annualInterestRate"
  ]
}
```

### AffordabilityDto

```json
{
  "type": "object",
  "properties": {
    "monthlyIncome": {
      "type": "number",
      "example": 45000
    },
    "monthlyExpenses": {
      "type": "number",
      "example": 25000
    },
    "deposit": {
      "type": "number",
      "example": 30000
    },
    "termMonths": {
      "type": "number",
      "example": 72
    },
    "annualInterestRate": {
      "type": "number",
      "example": 11.75
    },
    "balloonPercent": {
      "type": "number",
      "example": 0
    }
  },
  "required": [
    "monthlyIncome",
    "monthlyExpenses",
    "deposit",
    "termMonths",
    "annualInterestRate"
  ]
}
```

### CreateLeadDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 160
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string"
    },
    "source": {
      "enum": [
        "PHONE",
        "WHATSAPP",
        "EMAIL",
        "WALK_IN",
        "OTHER"
      ],
      "type": "string"
    },
    "vehicleId": {
      "type": "string",
      "format": "uuid"
    },
    "branchId": {
      "type": "string",
      "format": "uuid"
    },
    "assignedToId": {
      "type": "string",
      "format": "uuid"
    },
    "note": {
      "type": "string",
      "maxLength": 4000
    },
    "nextFollowUpAt": {
      "type": "string"
    }
  },
  "required": [
    "name",
    "source"
  ]
}
```

### UpdateLeadDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 160
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string"
    },
    "vehicleId": {
      "type": "string",
      "format": "uuid"
    },
    "nextFollowUpAt": {
      "type": "string",
      "nullable": true
    }
  }
}
```

### ChangeStageDto

```json
{
  "type": "object",
  "properties": {
    "stage": {
      "enum": [
        "NEW",
        "CONTACTED",
        "QUALIFIED",
        "NEGOTIATION",
        "OFFER_SENT",
        "WON",
        "LOST"
      ],
      "type": "string"
    },
    "note": {
      "type": "string",
      "maxLength": 2000
    },
    "lostReason": {
      "type": "string",
      "maxLength": 500,
      "description": "Required when stage is LOST"
    }
  },
  "required": [
    "stage"
  ]
}
```

### AssignLeadDto

```json
{
  "type": "object",
  "properties": {
    "memberId": {
      "type": "string",
      "nullable": true,
      "format": "uuid",
      "description": "Dealer member id, or null to unassign"
    }
  },
  "required": [
    "memberId"
  ]
}
```

### AddActivityDto

```json
{
  "type": "object",
  "properties": {
    "type": {
      "enum": [
        "NOTE",
        "CALL",
        "EMAIL",
        "SMS",
        "WHATSAPP",
        "MEETING"
      ],
      "type": "string"
    },
    "note": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    },
    "nextFollowUpAt": {
      "type": "string",
      "description": "Schedule the next follow-up"
    }
  },
  "required": [
    "type",
    "note"
  ]
}
```

### VehicleEnquiryDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 160,
      "example": "Thabo Nkosi"
    },
    "email": {
      "type": "string",
      "maxLength": 254,
      "format": "email"
    },
    "phone": {
      "type": "string",
      "example": "+27 82 123 4567"
    },
    "consent": {
      "type": "boolean",
      "description": "Consent to be contacted about this request (POPIA / NFR-17)"
    },
    "vehicleId": {
      "type": "string",
      "format": "uuid"
    },
    "message": {
      "type": "string",
      "maxLength": 4000
    },
    "interestedInFinance": {
      "type": "boolean",
      "description": "Customer would like finance"
    },
    "hasTradeIn": {
      "type": "boolean",
      "description": "Customer has a vehicle to trade in"
    }
  },
  "required": [
    "name",
    "email",
    "phone",
    "consent",
    "vehicleId"
  ]
}
```

### TestDriveDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 160,
      "example": "Thabo Nkosi"
    },
    "email": {
      "type": "string",
      "maxLength": 254,
      "format": "email"
    },
    "phone": {
      "type": "string",
      "example": "+27 82 123 4567"
    },
    "consent": {
      "type": "boolean",
      "description": "Consent to be contacted about this request (POPIA / NFR-17)"
    },
    "vehicleId": {
      "type": "string",
      "format": "uuid"
    },
    "preferredAt": {
      "type": "string",
      "description": "Preferred date/time (ISO 8601)"
    },
    "message": {
      "type": "string",
      "maxLength": 2000
    }
  },
  "required": [
    "name",
    "email",
    "phone",
    "consent",
    "vehicleId",
    "preferredAt"
  ]
}
```

### QuoteRequestDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 160,
      "example": "Thabo Nkosi"
    },
    "email": {
      "type": "string",
      "maxLength": 254,
      "format": "email"
    },
    "phone": {
      "type": "string",
      "example": "+27 82 123 4567"
    },
    "consent": {
      "type": "boolean",
      "description": "Consent to be contacted about this request (POPIA / NFR-17)"
    },
    "makeId": {
      "type": "string",
      "format": "uuid"
    },
    "modelId": {
      "type": "string",
      "format": "uuid"
    },
    "variantId": {
      "type": "string",
      "format": "uuid"
    },
    "dealerId": {
      "type": "string",
      "format": "uuid",
      "description": "Send to a specific dealer; otherwise the platform team handles it"
    },
    "province": {
      "enum": [
        "EASTERN_CAPE",
        "FREE_STATE",
        "GAUTENG",
        "KWAZULU_NATAL",
        "LIMPOPO",
        "MPUMALANGA",
        "NORTHERN_CAPE",
        "NORTH_WEST",
        "WESTERN_CAPE"
      ],
      "type": "string"
    },
    "requirements": {
      "type": "string",
      "maxLength": 4000,
      "description": "Colour, extras, timing, finance needs..."
    }
  },
  "required": [
    "name",
    "email",
    "phone",
    "consent",
    "makeId",
    "modelId",
    "province"
  ]
}
```

### BeatMyQuoteDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 160,
      "example": "Thabo Nkosi"
    },
    "email": {
      "type": "string",
      "maxLength": 254,
      "format": "email"
    },
    "phone": {
      "type": "string",
      "example": "+27 82 123 4567"
    },
    "consent": {
      "type": "boolean",
      "description": "Consent to be contacted about this request (POPIA / NFR-17)"
    },
    "makeId": {
      "type": "string",
      "format": "uuid"
    },
    "modelId": {
      "type": "string",
      "format": "uuid"
    },
    "variantId": {
      "type": "string",
      "format": "uuid"
    },
    "desiredVehicle": {
      "type": "string",
      "minLength": 3,
      "maxLength": 200,
      "description": "Desired vehicle as quoted",
      "example": "2025 Toyota Hilux 2.8 GD-6 Legend"
    },
    "quotedPrice": {
      "type": "number",
      "minimum": 1000,
      "maximum": 100000000,
      "description": "Quoted price in rand"
    },
    "quotingDealer": {
      "type": "string",
      "minLength": 2,
      "maxLength": 200,
      "description": "Dealer that issued the existing quote"
    },
    "quoteDetails": {
      "type": "string",
      "maxLength": 4000,
      "description": "Quote details / reference / included extras"
    },
    "province": {
      "enum": [
        "EASTERN_CAPE",
        "FREE_STATE",
        "GAUTENG",
        "KWAZULU_NATAL",
        "LIMPOPO",
        "MPUMALANGA",
        "NORTHERN_CAPE",
        "NORTH_WEST",
        "WESTERN_CAPE"
      ],
      "type": "string"
    }
  },
  "required": [
    "name",
    "email",
    "phone",
    "consent",
    "desiredVehicle",
    "quotedPrice",
    "quotingDealer",
    "province"
  ]
}
```

### TradeInVehicleDto

```json
{
  "type": "object",
  "properties": {
    "make": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "example": "Volkswagen"
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "example": "Polo"
    },
    "variant": {
      "type": "string",
      "maxLength": 120,
      "example": "1.0 TSI Comfortline"
    },
    "year": {
      "type": "number",
      "minimum": 1950,
      "maximum": 2100
    },
    "mileage": {
      "type": "number",
      "minimum": 0,
      "maximum": 2000000
    },
    "condition": {
      "enum": [
        "EXCELLENT",
        "GOOD",
        "FAIR",
        "POOR"
      ],
      "type": "string"
    },
    "hasServiceHistory": {
      "type": "boolean"
    },
    "hasOutstandingFinance": {
      "type": "boolean"
    }
  },
  "required": [
    "make",
    "model",
    "year",
    "mileage",
    "condition"
  ]
}
```

### TradeInDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 160,
      "example": "Thabo Nkosi"
    },
    "email": {
      "type": "string",
      "maxLength": 254,
      "format": "email"
    },
    "phone": {
      "type": "string",
      "example": "+27 82 123 4567"
    },
    "consent": {
      "type": "boolean",
      "description": "Consent to be contacted about this request (POPIA / NFR-17)"
    },
    "vehicleId": {
      "type": "string",
      "format": "uuid",
      "description": "Listed vehicle the customer wants (routes to its dealer)"
    },
    "desiredVehicle": {
      "type": "string",
      "maxLength": 200,
      "description": "Desired replacement vehicle if not a specific listing"
    },
    "tradeIn": {
      "$ref": "#/components/schemas/TradeInVehicleDto"
    },
    "message": {
      "type": "string",
      "maxLength": 2000
    }
  },
  "required": [
    "name",
    "email",
    "phone",
    "consent",
    "tradeIn"
  ]
}
```

### ConciergeDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 160,
      "example": "Thabo Nkosi"
    },
    "email": {
      "type": "string",
      "maxLength": 254,
      "format": "email"
    },
    "phone": {
      "type": "string",
      "example": "+27 82 123 4567"
    },
    "consent": {
      "type": "boolean",
      "description": "Consent to be contacted about this request (POPIA / NFR-17)"
    },
    "services": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "string",
        "enum": [
          "VEHICLE_SOURCING",
          "RECOMMENDATIONS",
          "PRICE_NEGOTIATION",
          "VEHICLE_CHECKS",
          "FINANCE_ASSISTANCE",
          "WARRANTY_ASSISTANCE",
          "INSURANCE_ASSISTANCE",
          "DOCUMENTATION_ASSISTANCE",
          "DELIVERY_COORDINATION"
        ]
      }
    },
    "budget": {
      "type": "number",
      "minimum": 0
    },
    "province": {
      "enum": [
        "EASTERN_CAPE",
        "FREE_STATE",
        "GAUTENG",
        "KWAZULU_NATAL",
        "LIMPOPO",
        "MPUMALANGA",
        "NORTHERN_CAPE",
        "NORTH_WEST",
        "WESTERN_CAPE"
      ],
      "type": "string"
    },
    "notes": {
      "type": "string",
      "maxLength": 4000
    }
  },
  "required": [
    "name",
    "email",
    "phone",
    "consent",
    "services"
  ]
}
```

### HelpMeFindDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 160,
      "example": "Thabo Nkosi"
    },
    "email": {
      "type": "string",
      "maxLength": 254,
      "format": "email"
    },
    "phone": {
      "type": "string",
      "example": "+27 82 123 4567"
    },
    "consent": {
      "type": "boolean",
      "description": "Consent to be contacted about this request (POPIA / NFR-17)"
    },
    "makeId": {
      "type": "string",
      "format": "uuid"
    },
    "modelId": {
      "type": "string",
      "format": "uuid"
    },
    "vehicleType": {
      "type": "string",
      "maxLength": 80,
      "description": "Category slug, e.g. suvs"
    },
    "budgetMin": {
      "type": "number",
      "minimum": 0
    },
    "budgetMax": {
      "type": "number",
      "minimum": 1000
    },
    "minYear": {
      "type": "number",
      "minimum": 1950
    },
    "maxMileage": {
      "type": "number",
      "minimum": 0
    },
    "province": {
      "enum": [
        "EASTERN_CAPE",
        "FREE_STATE",
        "GAUTENG",
        "KWAZULU_NATAL",
        "LIMPOPO",
        "MPUMALANGA",
        "NORTHERN_CAPE",
        "NORTH_WEST",
        "WESTERN_CAPE"
      ],
      "type": "string"
    },
    "preferences": {
      "type": "string",
      "maxLength": 4000,
      "description": "Colour, transmission, fuel, must-have features..."
    }
  },
  "required": [
    "name",
    "email",
    "phone",
    "consent",
    "budgetMax"
  ]
}
```

### FinanceEnquiryDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 160,
      "example": "Thabo Nkosi"
    },
    "email": {
      "type": "string",
      "maxLength": 254,
      "format": "email"
    },
    "phone": {
      "type": "string",
      "example": "+27 82 123 4567"
    },
    "consent": {
      "type": "boolean",
      "description": "Consent to be contacted about this request (POPIA / NFR-17)"
    },
    "vehicleId": {
      "type": "string",
      "format": "uuid"
    },
    "vehiclePrice": {
      "type": "number",
      "minimum": 0
    },
    "deposit": {
      "type": "number",
      "minimum": 0
    },
    "termMonths": {
      "type": "number",
      "minimum": 6,
      "maximum": 96
    },
    "monthlyIncome": {
      "type": "number",
      "minimum": 0
    },
    "employmentStatus": {
      "type": "string",
      "enum": [
        "EMPLOYED",
        "SELF_EMPLOYED",
        "CONTRACT",
        "PENSIONER",
        "OTHER"
      ]
    },
    "message": {
      "type": "string",
      "maxLength": 2000
    }
  },
  "required": [
    "name",
    "email",
    "phone",
    "consent"
  ]
}
```

### InsuranceEnquiryDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 160,
      "example": "Thabo Nkosi"
    },
    "email": {
      "type": "string",
      "maxLength": 254,
      "format": "email"
    },
    "phone": {
      "type": "string",
      "example": "+27 82 123 4567"
    },
    "consent": {
      "type": "boolean",
      "description": "Consent to be contacted about this request (POPIA / NFR-17)"
    },
    "vehicleId": {
      "type": "string",
      "format": "uuid"
    },
    "vehicleDescription": {
      "type": "string",
      "maxLength": 200,
      "example": "2022 Toyota Corolla Cross 1.8 Xi"
    },
    "coverType": {
      "type": "string",
      "enum": [
        "COMPREHENSIVE",
        "THIRD_PARTY_FIRE_THEFT",
        "THIRD_PARTY",
        "NOT_SURE"
      ]
    },
    "province": {
      "enum": [
        "EASTERN_CAPE",
        "FREE_STATE",
        "GAUTENG",
        "KWAZULU_NATAL",
        "LIMPOPO",
        "MPUMALANGA",
        "NORTHERN_CAPE",
        "NORTH_WEST",
        "WESTERN_CAPE"
      ],
      "type": "string"
    },
    "message": {
      "type": "string",
      "maxLength": 2000
    }
  },
  "required": [
    "name",
    "email",
    "phone",
    "consent"
  ]
}
```

### GeneralContactDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 160,
      "example": "Thabo Nkosi"
    },
    "email": {
      "type": "string",
      "maxLength": 254,
      "format": "email"
    },
    "phone": {
      "type": "string",
      "example": "+27 82 123 4567"
    },
    "consent": {
      "type": "boolean",
      "description": "Consent to be contacted about this request (POPIA / NFR-17)"
    },
    "subject": {
      "type": "string",
      "minLength": 2,
      "maxLength": 200
    },
    "message": {
      "type": "string",
      "minLength": 2,
      "maxLength": 4000
    }
  },
  "required": [
    "name",
    "email",
    "phone",
    "consent",
    "subject",
    "message"
  ]
}
```

### CustomerReplyDto

```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    }
  },
  "required": [
    "message"
  ]
}
```

### RespondDto

```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    },
    "status": {
      "enum": [
        "IN_PROGRESS",
        "RESPONDED",
        "CLOSED"
      ],
      "type": "string",
      "default": "RESPONDED"
    }
  },
  "required": [
    "message"
  ]
}
```

### AdminUpdateEnquiryDto

```json
{
  "type": "object",
  "properties": {
    "status": {
      "enum": [
        "NEW",
        "IN_PROGRESS",
        "RESPONDED",
        "CLOSED",
        "CANCELLED"
      ],
      "type": "string"
    },
    "assignedAdminId": {
      "type": "string",
      "format": "uuid",
      "description": "Platform team member handling it"
    },
    "dealerId": {
      "type": "string",
      "format": "uuid",
      "description": "Route to a dealer (creates a lead for them)"
    }
  }
}
```

### CreateSellRequestDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 160,
      "example": "Thabo Nkosi"
    },
    "email": {
      "type": "string",
      "maxLength": 254,
      "format": "email"
    },
    "phone": {
      "type": "string",
      "example": "+27 82 123 4567"
    },
    "consent": {
      "type": "boolean",
      "description": "Consent to be contacted about this request (POPIA / NFR-17)"
    },
    "type": {
      "enum": [
        "SELL",
        "VALUATION"
      ],
      "type": "string",
      "description": "SELL = wants offers, VALUATION = estimate only"
    },
    "province": {
      "enum": [
        "EASTERN_CAPE",
        "FREE_STATE",
        "GAUTENG",
        "KWAZULU_NATAL",
        "LIMPOPO",
        "MPUMALANGA",
        "NORTHERN_CAPE",
        "NORTH_WEST",
        "WESTERN_CAPE"
      ],
      "type": "string"
    },
    "city": {
      "type": "string",
      "maxLength": 120
    },
    "makeId": {
      "type": "string",
      "format": "uuid",
      "description": "Catalogue ids give the most accurate valuation"
    },
    "modelId": {
      "type": "string",
      "format": "uuid"
    },
    "variantId": {
      "type": "string",
      "format": "uuid"
    },
    "makeName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "description": "Required when makeId is not given"
    },
    "modelName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "description": "Required when modelId is not given"
    },
    "variantName": {
      "type": "string",
      "maxLength": 120
    },
    "year": {
      "type": "number",
      "minimum": 1950,
      "maximum": 2027
    },
    "mileage": {
      "type": "number",
      "minimum": 0,
      "maximum": 2000000
    },
    "condition": {
      "enum": [
        "EXCELLENT",
        "GOOD",
        "FAIR",
        "POOR"
      ],
      "type": "string"
    },
    "colour": {
      "type": "string",
      "maxLength": 40
    },
    "transmission": {
      "enum": [
        "UNKNOWN",
        "MANUAL",
        "AUTOMATIC"
      ],
      "type": "string"
    },
    "fuelType": {
      "enum": [
        "PETROL",
        "DIESEL",
        "HYBRID",
        "PLUGIN_HYBRID",
        "ELECTRIC",
        "LPG",
        "OTHER"
      ],
      "type": "string"
    },
    "registrationNumber": {
      "type": "string",
      "maxLength": 20,
      "description": "Registration number (FR-09). Never shown to dealers before acceptance."
    },
    "vin": {
      "type": "string",
      "pattern": "^[A-HJ-NPR-Z0-9]{11,17}$"
    },
    "hasServiceHistory": {
      "type": "boolean"
    },
    "hasAccidentHistory": {
      "type": "boolean"
    },
    "hasOutstandingFinance": {
      "type": "boolean"
    },
    "askingPrice": {
      "type": "number",
      "minimum": 0,
      "description": "Price the customer hopes for"
    },
    "notes": {
      "type": "string",
      "maxLength": 4000
    }
  },
  "required": [
    "name",
    "email",
    "phone",
    "consent",
    "type",
    "province",
    "year",
    "mileage",
    "condition"
  ]
}
```

### SellImageUploadDto

```json
{
  "type": "object",
  "properties": {
    "contentType": {
      "type": "string",
      "enum": [
        "image/jpeg",
        "image/png",
        "image/webp"
      ]
    }
  },
  "required": [
    "contentType"
  ]
}
```

### ConfirmSellImageDto

```json
{
  "type": "object",
  "properties": {
    "storageKey": {
      "type": "string",
      "minLength": 10,
      "maxLength": 300
    },
    "contentType": {
      "type": "string",
      "enum": [
        "image/jpeg",
        "image/png",
        "image/webp"
      ]
    }
  },
  "required": [
    "storageKey",
    "contentType"
  ]
}
```

### ManualValuationDto

```json
{
  "type": "object",
  "properties": {
    "estimateLow": {
      "type": "number",
      "minimum": 0
    },
    "estimateMid": {
      "type": "number",
      "minimum": 0
    },
    "estimateHigh": {
      "type": "number",
      "minimum": 0
    },
    "notes": {
      "type": "string",
      "maxLength": 2000
    }
  },
  "required": [
    "estimateLow",
    "estimateMid",
    "estimateHigh"
  ]
}
```

### AdminSellStatusDto

```json
{
  "type": "object",
  "properties": {
    "status": {
      "enum": [
        "UNDER_REVIEW",
        "REJECTED",
        "COMPLETED",
        "CANCELLED"
      ],
      "type": "string"
    },
    "reason": {
      "type": "string",
      "maxLength": 1000
    }
  },
  "required": [
    "status"
  ]
}
```

### OpenBiddingDto

```json
{
  "type": "object",
  "properties": {
    "opensAt": {
      "type": "string",
      "description": "Defaults to now. A future time schedules the session."
    },
    "closesAt": {
      "type": "string",
      "description": "When bidding closes (BR-07)"
    },
    "allowBidModification": {
      "type": "boolean",
      "default": true,
      "description": "Dealers may revise their bid (BR-08)"
    },
    "allowBidWithdrawal": {
      "type": "boolean",
      "default": true
    },
    "allowCounterOffers": {
      "type": "boolean",
      "default": true,
      "description": "Customer may counter an offer (FR-56)"
    },
    "offerValidityHours": {
      "type": "number",
      "minimum": 1,
      "maximum": 720,
      "default": 48,
      "description": "Offer validity in hours (BR-10)"
    },
    "reservePrice": {
      "type": "number",
      "minimum": 0,
      "description": "Minimum acceptable bid (rand)"
    },
    "eligibleProvinces": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "EASTERN_CAPE",
          "FREE_STATE",
          "GAUTENG",
          "KWAZULU_NATAL",
          "LIMPOPO",
          "MPUMALANGA",
          "NORTHERN_CAPE",
          "NORTH_WEST",
          "WESTERN_CAPE"
        ]
      },
      "description": "Only dealers in these provinces (BR-06). Empty = all."
    },
    "inviteDealerIds": {
      "maxItems": 500,
      "description": "Invite-only: only these dealers may view and bid",
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      }
    }
  },
  "required": [
    "closesAt"
  ]
}
```

### ReopenBiddingDto

```json
{
  "type": "object",
  "properties": {
    "closesAt": {
      "type": "string"
    },
    "reason": {
      "type": "string",
      "minLength": 1,
      "maxLength": 500
    }
  },
  "required": [
    "closesAt"
  ]
}
```

### RejectOfferDto

```json
{
  "type": "object",
  "properties": {
    "reason": {
      "type": "string",
      "maxLength": 1000
    }
  }
}
```

### SubmitOfferDto

```json
{
  "type": "object",
  "properties": {
    "amount": {
      "type": "number",
      "minimum": 1000,
      "maximum": 100000000,
      "description": "Offer in rand"
    },
    "terms": {
      "type": "string",
      "maxLength": 2000,
      "description": "Additional terms shown to the customer"
    },
    "dealerNotes": {
      "type": "string",
      "maxLength": 2000,
      "description": "Internal dealer notes (never shown to the customer)"
    }
  },
  "required": [
    "amount"
  ]
}
```

### UpdateOfferDto

```json
{
  "type": "object",
  "properties": {
    "amount": {
      "type": "number",
      "minimum": 1000,
      "maximum": 100000000,
      "description": "Offer in rand"
    },
    "terms": {
      "type": "string",
      "maxLength": 2000,
      "description": "Additional terms shown to the customer"
    },
    "dealerNotes": {
      "type": "string",
      "maxLength": 2000,
      "description": "Internal dealer notes (never shown to the customer)"
    },
    "expectedVersion": {
      "type": "number",
      "description": "Optimistic concurrency: the offer version you last saw"
    }
  },
  "required": [
    "amount"
  ]
}
```

### CounterResponseDto

```json
{
  "type": "object",
  "properties": {
    "accept": {
      "type": "boolean",
      "description": "true = accept the customer counter amount"
    },
    "message": {
      "type": "string",
      "maxLength": 1000
    }
  },
  "required": [
    "accept"
  ]
}
```

### CounterOfferDto

```json
{
  "type": "object",
  "properties": {
    "amount": {
      "type": "number",
      "minimum": 1000,
      "maximum": 100000000
    },
    "message": {
      "type": "string",
      "maxLength": 1000
    }
  },
  "required": [
    "amount"
  ]
}
```

### UpdateProfileDto

```json
{
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80
    },
    "lastName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80
    },
    "phone": {
      "type": "string",
      "nullable": true
    },
    "marketingConsent": {
      "type": "boolean"
    }
  }
}
```

### SearchCriteriaDto

```json
{
  "type": "object",
  "properties": {
    "q": {
      "type": "string",
      "maxLength": 100,
      "description": "Free text over the listing title"
    },
    "make": {
      "type": "string",
      "maxLength": 500,
      "description": "Make slugs, comma-separated",
      "example": "bmw,audi"
    },
    "model": {
      "type": "string",
      "maxLength": 500,
      "description": "Model slugs; scope to a make with make:model",
      "example": "bmw:3-series"
    },
    "variant": {
      "type": "string",
      "maxLength": 500,
      "description": "Variant slugs",
      "example": "320i-m-sport-2022"
    },
    "condition": {
      "type": "string",
      "maxLength": 50,
      "description": "NEW, USED, DEMO",
      "example": "USED"
    },
    "category": {
      "type": "string",
      "maxLength": 300,
      "description": "Category slugs (FR-25)",
      "example": "suvs,bakkies"
    },
    "fuelType": {
      "type": "string",
      "maxLength": 200,
      "example": "PETROL,DIESEL"
    },
    "transmission": {
      "type": "string",
      "maxLength": 50,
      "example": "AUTOMATIC"
    },
    "drivetrain": {
      "type": "string",
      "maxLength": 100,
      "example": "FOUR_X_FOUR"
    },
    "province": {
      "type": "string",
      "maxLength": 300,
      "description": "Provinces (FR-27)",
      "example": "GAUTENG,WESTERN_CAPE"
    },
    "city": {
      "type": "string",
      "maxLength": 100
    },
    "colour": {
      "type": "string",
      "maxLength": 200,
      "example": "White,Black"
    },
    "dealer": {
      "type": "string",
      "maxLength": 120,
      "description": "Dealer slug"
    },
    "branchId": {
      "type": "string",
      "format": "uuid"
    },
    "minPrice": {
      "type": "number",
      "minimum": 0
    },
    "maxPrice": {
      "type": "number",
      "minimum": 0
    },
    "minYear": {
      "type": "number",
      "minimum": 1900
    },
    "maxYear": {
      "type": "number",
      "maximum": 2100
    },
    "minMileage": {
      "type": "number",
      "minimum": 0
    },
    "maxMileage": {
      "type": "number",
      "minimum": 0
    },
    "minEngineCc": {
      "type": "number",
      "minimum": 0
    },
    "maxEngineCc": {
      "type": "number",
      "minimum": 0
    },
    "minPowerKw": {
      "type": "number",
      "minimum": 0
    },
    "maxPowerKw": {
      "type": "number",
      "minimum": 0
    },
    "seats": {
      "type": "string",
      "maxLength": 50,
      "description": "Seat counts, comma-separated; \"8+\" for eight or more",
      "example": "5,7"
    },
    "onSpecial": {
      "type": "boolean",
      "description": "Only vehicles on special (FR-23)"
    },
    "featured": {
      "type": "boolean"
    },
    "availableOnly": {
      "type": "boolean",
      "description": "Hide reserved vehicles"
    },
    "collection": {
      "enum": [
        "hot-sellers",
        "specials",
        "featured",
        "new-arrivals",
        "budget",
        "student",
        "bakkies",
        "electric"
      ],
      "type": "string"
    },
    "lat": {
      "type": "number",
      "description": "Centre latitude for radius search"
    },
    "lng": {
      "type": "number",
      "description": "Centre longitude for radius search"
    },
    "radiusKm": {
      "type": "number",
      "minimum": 1,
      "maximum": 1000,
      "description": "Radius in km (with lat/lng)"
    }
  }
}
```

### CreateSavedSearchDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120,
      "example": "Diesel bakkies under R400k"
    },
    "criteria": {
      "$ref": "#/components/schemas/SearchCriteriaDto"
    },
    "alertsEnabled": {
      "type": "boolean",
      "default": true,
      "description": "Notify me about new matches and price drops (FR-39)"
    }
  },
  "required": [
    "name",
    "criteria"
  ]
}
```

### UpdateSavedSearchDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "criteria": {
      "$ref": "#/components/schemas/SearchCriteriaDto"
    },
    "alertsEnabled": {
      "type": "boolean"
    }
  }
}
```

### DeleteAccountDto

```json
{
  "type": "object",
  "properties": {
    "password": {
      "type": "string",
      "minLength": 1,
      "maxLength": 128,
      "description": "Current password, to confirm"
    }
  },
  "required": [
    "password"
  ]
}
```

### ArticleDto

```json
{
  "type": "object",
  "properties": {
    "metaTitle": {
      "type": "string",
      "maxLength": 70,
      "description": "SEO meta title (NFR-12)"
    },
    "metaDescription": {
      "type": "string",
      "maxLength": 170,
      "description": "SEO meta description"
    },
    "title": {
      "type": "string",
      "minLength": 3,
      "maxLength": 200
    },
    "slug": {
      "type": "string",
      "maxLength": 160,
      "description": "Defaults to a slug of the title"
    },
    "excerpt": {
      "type": "string",
      "maxLength": 500
    },
    "body": {
      "type": "array",
      "maxItems": 500,
      "items": {
        "type": "object"
      }
    },
    "type": {
      "enum": [
        "NEWS",
        "REVIEW",
        "ADVICE",
        "GUIDE",
        "ARTICLE"
      ],
      "type": "string"
    },
    "categoryId": {
      "type": "string",
      "format": "uuid"
    },
    "coverImageUrl": {
      "type": "string",
      "format": "uri"
    },
    "featured": {
      "type": "boolean"
    },
    "tags": {
      "maxItems": 20,
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "title",
    "body"
  ]
}
```

### UpdateArticleDto

```json
{
  "type": "object",
  "properties": {
    "metaTitle": {
      "type": "string",
      "maxLength": 70,
      "description": "SEO meta title (NFR-12)"
    },
    "metaDescription": {
      "type": "string",
      "maxLength": 170,
      "description": "SEO meta description"
    },
    "title": {
      "type": "string",
      "minLength": 3,
      "maxLength": 200
    },
    "slug": {
      "type": "string",
      "maxLength": 160,
      "description": "Defaults to a slug of the title"
    },
    "excerpt": {
      "type": "string",
      "maxLength": 500
    },
    "body": {
      "type": "array",
      "maxItems": 500,
      "items": {
        "type": "object"
      }
    },
    "type": {
      "enum": [
        "NEWS",
        "REVIEW",
        "ADVICE",
        "GUIDE",
        "ARTICLE"
      ],
      "type": "string"
    },
    "categoryId": {
      "type": "string",
      "format": "uuid"
    },
    "coverImageUrl": {
      "type": "string",
      "format": "uri"
    },
    "featured": {
      "type": "boolean"
    },
    "tags": {
      "maxItems": 20,
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

### PublishDto

```json
{
  "type": "object",
  "properties": {
    "status": {
      "enum": [
        "DRAFT",
        "PUBLISHED",
        "ARCHIVED"
      ],
      "type": "string"
    },
    "publishedAt": {
      "type": "string",
      "description": "Schedule: publish date (defaults to now)"
    }
  },
  "required": [
    "status"
  ]
}
```

### ArticleCategoryDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 80
    }
  },
  "required": [
    "name"
  ]
}
```

### MediaItemDto

```json
{
  "type": "object",
  "properties": {
    "type": {
      "enum": [
        "VIDEO",
        "PODCAST"
      ],
      "type": "string"
    },
    "title": {
      "type": "string",
      "minLength": 3,
      "maxLength": 200
    },
    "description": {
      "type": "string",
      "maxLength": 2000
    },
    "url": {
      "type": "string",
      "format": "uri",
      "description": "Canonical URL (YouTube, Spotify, ...)"
    },
    "embedUrl": {
      "type": "string",
      "format": "uri"
    },
    "thumbnailUrl": {
      "type": "string",
      "format": "uri"
    },
    "durationSec": {
      "type": "number",
      "minimum": 0
    }
  },
  "required": [
    "type",
    "title",
    "url"
  ]
}
```

### UpdateMediaItemDto

```json
{
  "type": "object",
  "properties": {
    "type": {
      "enum": [
        "VIDEO",
        "PODCAST"
      ],
      "type": "string"
    },
    "title": {
      "type": "string",
      "minLength": 3,
      "maxLength": 200
    },
    "description": {
      "type": "string",
      "maxLength": 2000
    },
    "url": {
      "type": "string",
      "format": "uri",
      "description": "Canonical URL (YouTube, Spotify, ...)"
    },
    "embedUrl": {
      "type": "string",
      "format": "uri"
    },
    "thumbnailUrl": {
      "type": "string",
      "format": "uri"
    },
    "durationSec": {
      "type": "number",
      "minimum": 0
    }
  }
}
```

### FaqDto

```json
{
  "type": "object",
  "properties": {
    "question": {
      "type": "string",
      "minLength": 3,
      "maxLength": 300
    },
    "answer": {
      "type": "string",
      "minLength": 1,
      "maxLength": 5000
    },
    "category": {
      "type": "string",
      "maxLength": 60,
      "example": "selling"
    },
    "sortOrder": {
      "type": "number"
    },
    "isActive": {
      "type": "boolean"
    }
  },
  "required": [
    "question",
    "answer"
  ]
}
```

### UpdateFaqDto

```json
{
  "type": "object",
  "properties": {
    "question": {
      "type": "string",
      "minLength": 3,
      "maxLength": 300
    },
    "answer": {
      "type": "string",
      "minLength": 1,
      "maxLength": 5000
    },
    "category": {
      "type": "string",
      "maxLength": 60,
      "example": "selling"
    },
    "sortOrder": {
      "type": "number"
    },
    "isActive": {
      "type": "boolean"
    }
  }
}
```

### StaticPageDto

```json
{
  "type": "object",
  "properties": {
    "metaTitle": {
      "type": "string",
      "maxLength": 70,
      "description": "SEO meta title (NFR-12)"
    },
    "metaDescription": {
      "type": "string",
      "maxLength": 170,
      "description": "SEO meta description"
    },
    "slug": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "example": "privacy-policy"
    },
    "title": {
      "type": "string",
      "minLength": 2,
      "maxLength": 200
    },
    "body": {
      "type": "array",
      "maxItems": 500,
      "items": {
        "type": "object"
      }
    }
  },
  "required": [
    "slug",
    "title",
    "body"
  ]
}
```

### UpdateStaticPageDto

```json
{
  "type": "object",
  "properties": {
    "metaTitle": {
      "type": "string",
      "maxLength": 70,
      "description": "SEO meta title (NFR-12)"
    },
    "metaDescription": {
      "type": "string",
      "maxLength": 170,
      "description": "SEO meta description"
    },
    "slug": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "example": "privacy-policy"
    },
    "title": {
      "type": "string",
      "minLength": 2,
      "maxLength": 200
    },
    "body": {
      "type": "array",
      "maxItems": 500,
      "items": {
        "type": "object"
      }
    }
  }
}
```

### PromotionDto

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 3,
      "maxLength": 200
    },
    "description": {
      "type": "string",
      "maxLength": 2000
    },
    "bannerUrl": {
      "type": "string",
      "format": "uri"
    },
    "discountType": {
      "type": "string",
      "enum": [
        "PERCENT",
        "AMOUNT",
        "NONE"
      ]
    },
    "discountValue": {
      "type": "number",
      "minimum": 0
    },
    "dealerId": {
      "type": "string",
      "format": "uuid",
      "description": "Dealer-specific promotion"
    },
    "startsAt": {
      "type": "string"
    },
    "endsAt": {
      "type": "string"
    },
    "isActive": {
      "type": "boolean"
    }
  },
  "required": [
    "title",
    "startsAt"
  ]
}
```

### UpdatePromotionDto

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 3,
      "maxLength": 200
    },
    "description": {
      "type": "string",
      "maxLength": 2000
    },
    "bannerUrl": {
      "type": "string",
      "format": "uri"
    },
    "discountType": {
      "type": "string",
      "enum": [
        "PERCENT",
        "AMOUNT",
        "NONE"
      ]
    },
    "discountValue": {
      "type": "number",
      "minimum": 0
    },
    "dealerId": {
      "type": "string",
      "format": "uuid",
      "description": "Dealer-specific promotion"
    },
    "startsAt": {
      "type": "string"
    },
    "endsAt": {
      "type": "string"
    },
    "isActive": {
      "type": "boolean"
    }
  }
}
```

### PromotionVehiclesDto

```json
{
  "type": "object",
  "properties": {
    "vehicleIds": {
      "maxItems": 500,
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      }
    }
  },
  "required": [
    "vehicleIds"
  ]
}
```

### SubscribeDto

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string"
    },
    "source": {
      "type": "string",
      "example": "footer"
    },
    "firstName": {
      "type": "string"
    },
    "lastName": {
      "type": "string"
    }
  },
  "required": [
    "email"
  ]
}
```

### UnsubscribeDto

```json
{
  "type": "object",
  "properties": {
    "token": {
      "type": "string"
    }
  },
  "required": [
    "token"
  ]
}
```

### UserStatusDto

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "SUSPENDED"
      ]
    },
    "reason": {
      "type": "string"
    }
  },
  "required": [
    "status"
  ]
}
```

### UserRoleDto

```json
{
  "type": "object",
  "properties": {
    "role": {
      "type": "string",
      "enum": [
        "CUSTOMER",
        "ADMIN",
        "SUPER_ADMIN"
      ]
    }
  },
  "required": [
    "role"
  ]
}
```

### CreateAdminDto

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string"
    },
    "firstName": {
      "type": "string"
    },
    "lastName": {
      "type": "string"
    },
    "role": {
      "type": "string",
      "enum": [
        "ADMIN",
        "SUPER_ADMIN"
      ]
    }
  },
  "required": [
    "email",
    "firstName",
    "lastName",
    "role"
  ]
}
```

### DealerStatusBody

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "active",
        "suspended",
        "pending"
      ]
    }
  },
  "required": [
    "status"
  ]
}
```
