> Historical read-only integration notes. For the current token-authenticated dealer app API, use [the current guide](docs/dealer-app-api.md) and the API OpenAPI schema. Public scoped dealer reads are documented in [Group1 branches](docs/group1-branches-api.md).

# Dealer app: developer integration guide

## What to build

A read-only dealer app that displays one dealership's complete business details, documents and vehicle inventory. Use `dealer` in response mappings and UI terminology. There is no `seller` object in this API.

No token, login, API key, token-generation screen or Authorization header is needed. This endpoint exposes the requested dealer details/documents and vehicle identifiers to anyone who knows the dealer ID. Add, update, delete, document-upload and publish operations are not available through this integration.

## Information needed from the backend team

| Value | Example |
|---|---|
| API base URL, including `/api/v1` | `https://<actual-backend-host>/api/v1` |
| Dealer ID, kept as a string | `3095` or the dealer's UUID |

The host is a placeholder. Obtain the actual live address and confirm the updated backend is deployed before integrating against production.

## First request

```http
GET {API_BASE_URL}/dealer-app/dealers/{dealerId}?page=1&pageSize=50
```

```sh
curl --fail-with-body "$API_BASE_URL/dealer-app/dealers/3095?page=1&pageSize=50"
```

The response has two top-level fields:

```json
{
  "dealer": {
    "id": "3095",
    "name": "Example Motors",
    "legalName": "Example Motors Pty Ltd",
    "registrationNumber": "2020/123456/07",
    "vatNumber": "<VAT number>",
    "dealerLicenceNumber": "<licence number>",
    "email": "sales@example.test",
    "phone": "+27110000000",
    "status": "APPROVED",
    "branches": [],
    "documents": []
  },
  "vehicles": {
    "data": [
      {
        "id": "1556378",
        "dealerId": "3095",
        "title": "Example vehicle",
        "status": "PUBLISHED",
        "vin": "<VIN>",
        "registrationNumber": "<vehicle registration>",
        "images": []
      }
    ],
    "meta": { "page": 1, "pageSize": 50, "total": 1, "pageCount": 1 }
  }
}
```

This sample is shortened. Missing stored values can be `null`; document/image arrays may be empty.

## Connect the app screens

| Screen/element | JSON location |
|---|---|
| Dealership name and business details | `dealer.name`, `dealer.legalName`, `dealer.registrationNumber`, `dealer.vatNumber`, `dealer.dealerLicenceNumber` |
| Contact, address, website and logo | Fields on `dealer` |
| Dealer status and plan | `dealer.status`, `dealer.plan` |
| Branches and operating hours | `dealer.branches` |
| Dealer documents | `dealer.documents` |
| Vehicle cards/detail screens | `vehicles.data` |
| VIN | `vehicles.data[index].vin` |
| Vehicle registration | `vehicles.data[index].registrationNumber` |
| Images | `vehicles.data[index].images` |
| Make/model/variant/specifications | Related objects on each vehicle |
| Features | `vehicles.data[index].featureAssignments` |
| History | Each vehicle's `statusHistory` and `priceHistory`, up to 50 latest entries per history |
| Total dealer vehicles | `vehicles.meta.total` |

All vehicle statuses are returned, including draft, pending review, approved, published, reserved, rejected, suspended, sold and archived. Any existing dealer can be read, irrespective of dealer status. The app may group/filter the returned data for display, but this endpoint does not accept a `status` filter.

## Document preview/download flow

Each available document has metadata and a download URL:

```json
{
  "id": "<document UUID>",
  "dealerId": "3095",
  "type": "COMPANY_REGISTRATION",
  "fileName": "company.pdf",
  "contentType": "application/pdf",
  "storageKey": "private/dealers/3095/company.pdf",
  "downloadUrl": "<signed HTTPS download URL>",
  "downloadExpiresIn": 300
}
```

1. List documents using `fileName` and `type`.
2. On preview/download, open `downloadUrl` with the app's PDF/image viewer or browser.
3. URLs expire after five minutes. Call the dealer endpoint again to obtain fresh URLs when needed.
4. Do not construct a download URL from `storageKey`. Working download signing depends on the backend's configured S3/Firebase account.

## Fetch vehicles page by page

`page` starts at 1. `pageSize` defaults to 20 and may be 1–100. Use `vehicles.meta.pageCount` to load every page, or load pages as the user scrolls. `dealer` details and document links are returned on each page.

```js
async function fetchDealerPage(apiBaseUrl, dealerId, page = 1) {
  const base = apiBaseUrl.replace(/\/$/, '');
  const response = await fetch(
    `${base}/dealer-app/dealers/${encodeURIComponent(dealerId)}?page=${page}&pageSize=50`,
    { cache: 'no-store' },
  );
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Dealer API ${response.status}: ${body.code ?? body.message}`);
  }
  return body;
}

async function fetchAllDealerVehicles(apiBaseUrl, dealerId) {
  const first = await fetchDealerPage(apiBaseUrl, dealerId);
  const vehicles = [...first.vehicles.data];
  for (let page = 2; page <= first.vehicles.meta.pageCount; page++) {
    const next = await fetchDealerPage(apiBaseUrl, dealerId, page);
    vehicles.push(...next.vehicles.data);
  }
  return { dealer: first.dealer, vehicles, total: first.vehicles.meta.total };
}
```

Pagination reflects the database at request time; refresh if inventory changes while pages are loading. Responses are `private, no-store`; fetch again to refresh vehicle data or document URLs. Cache headers do not provide authentication.

## Error handling

| Result | App behavior |
|---|---|
| `200` with an empty vehicle array | Show the dealer and an empty inventory state |
| `400` | Check ID format, page/pageSize and remove unsupported query fields |
| `404` | Dealer does not exist, or the requested route/method is unavailable |
| `429` | Respect rate limiting and retry with a delay |
| `5xx` | Show a retry state; backend team checks database/storage signing |

Do not send `dealerId` in the query or request body; it belongs only in the path. POST, PUT, PATCH and DELETE are not implemented. Do not call the removed token, bootstrap or vehicle-write endpoints.

## Handoff checklist

- Configure the actual API base URL and dealer ID.
- Fetch page 1 and render `dealer` plus `vehicles.data`.
- Display documents using signed URLs and refresh expired links.
- Display the stored VIN/registration; show an empty-state label when missing.
- Load all required pages and preserve IDs as strings.
- Use dealer terminology; no seller mapping or mutation controls.

Full contract and release notes: [dealer-app-api.md](dealer-app-api.md). Verification coverage: [dealer-app-testing.md](dealer-app-testing.md).
