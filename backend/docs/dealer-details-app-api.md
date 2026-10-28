# Dealer Details App API

Integration guide for the separate dealer app. The app shows one dealership's business details, branches, documents and complete vehicle inventory.

The API is read-only. It needs no login, token, API key or `Authorization` header. The app cannot add, edit or delete anything through it.

## What you need

| Value | Value to use |
|---|---|
| API base URL | `https://changecarapi.wowcar.co.th/api/v1` |
| Dealer ID | Provided by the ChangeCars team per dealership, e.g. `3974`. Always keep IDs as strings. |

## Endpoint

```http
GET https://changecarapi.wowcar.co.th/api/v1/dealer-app/dealers/{dealerId}?page=1&pageSize=50
```

```sh
curl "https://changecarapi.wowcar.co.th/api/v1/dealer-app/dealers/3974?page=1&pageSize=50"
```

| Query parameter | Default | Rules |
|---|---|---|
| `page` | `1` | Integer, 1 or more. |
| `pageSize` | `20` | Integer, 1–100. |

No other query parameters are accepted. Any other parameter (for example `status` or `dealerId`) returns `400`.

Responses are sent with `Cache-Control: private, no-store`. Do not cache them on a shared server, and fetch again when you need fresh data.

## Response

The response has two top-level objects: `dealer` and `vehicles`. Example from the live API (shortened):

```json
{
  "dealer": {
    "id": "3974",
    "name": "Gys Pitzer Motors Lindo Park",
    "slug": "gys-pitzer-motors-lindo-park-fbook-3974",
    "legalName": null,
    "registrationNumber": null,
    "vatNumber": null,
    "dealerLicenceNumber": null,
    "email": "mullerine@gyspitzermotors.co.za",
    "phone": "072 261 4084",
    "website": null,
    "description": "Gys Pitzer Motors Lindo Park Offers A Curated Selection Of Pre-Owned ...",
    "logoUrl": "https://www.changecars.co.za/images/200/dealers/261005/3974.jpg",
    "province": "Gauteng",
    "city": "Lindopark",
    "address": "125 Stormvoël Rd, Lindopark, Pretoria",
    "status": "APPROVED",
    "plan": "BASIC",
    "biddingEnabled": true,
    "rating": null,
    "googleReviewUrl": "https://www.google.com/search?q=gys+pitzer+motors+lindo+park...",
    "hellopeterReviewUrl": "https://www.hellopeter.com/gys-pitzer-motors",
    "approvedAt": "2026-10-19T12:12:02.856Z",
    "createdAt": "2026-10-19T12:12:02.856Z",
    "updatedAt": "2026-10-27T08:36:14.835Z",
    "branches": [
      {
        "id": "dfb7d008-4c62-53a4-a2c0-b3554d0aadeb",
        "dealerId": "3974",
        "name": "Gys Pitzer Motors Lindo Park",
        "email": "mullerine@gyspitzermotors.co.za",
        "phone": "072 261 4084",
        "address": "125 Stormvoël Rd, Lindopark, Pretoria",
        "city": "Lindopark",
        "province": "Gauteng",
        "latitude": -25.7128342,
        "longitude": 28.282191,
        "operatingHours": null,
        "isHeadOffice": true,
        "isActive": true
      }
    ],
    "documents": []
  },
  "vehicles": {
    "data": [
      {
        "id": "1575858",
        "dealerId": "3974",
        "branchId": "dfb7d008-4c62-53a4-a2c0-b3554d0aadeb",
        "stockNumber": "65931",
        "title": "Omoda C5 1.5T Tech",
        "condition": "USED",
        "status": "PUBLISHED",
        "availability": "AVAILABLE",
        "year": 2024,
        "mileage": 49660,
        "price": 299900,
        "specialPrice": null,
        "isSpecial": false,
        "effectivePrice": 299900,
        "formattedMonthlyPrice": "R 5 941 pm",
        "transmission": "AUTOMATIC",
        "transmissionLabel": "Automatic",
        "fuelType": "PETROL",
        "fuelTypeLabel": "Petrol",
        "drivetrain": "4x2",
        "colour": "Blue",
        "colourId": 4,
        "engineCapacityCc": 1498,
        "powerKw": 115,
        "seats": 5,
        "doors": 5,
        "vin": null,
        "registrationNumber": null,
        "primaryImageUrl": "https://www.changecars.co.za/images/1000/vehicles/261028/1575858-1.jpg",
        "imageCount": 10,
        "images": [
          {
            "id": "e3664281-8fd0-57e2-a56a-8b50aff25885",
            "url": "https://www.changecars.co.za/images/1000/vehicles/261028/1575858-1.jpg",
            "position": 0,
            "isPrimary": true,
            "status": "READY"
          }
        ],
        "make": { "id": "…", "name": "Omoda", "slug": "omoda" },
        "model": { "id": "…", "name": "C7", "slug": "c7" },
        "variant": { "id": "…", "name": "C5 1.5T Tech", "specification": { "…": "…" } },
        "branch": { "id": "dfb7d008-4c62-53a4-a2c0-b3554d0aadeb", "name": "Gys Pitzer Motors Lindo Park" },
        "categories": [{ "slug": "suvs", "name": "SUV" }],
        "featureAssignments": [],
        "statusHistory": [],
        "priceHistory": [],
        "publishedAt": "2026-10-28T05:22:08.060Z",
        "createdAt": "2026-10-28T05:24:42.667Z",
        "updatedAt": "2026-10-28T05:24:42.667Z"
      }
    ],
    "meta": { "page": 1, "pageSize": 50, "total": 213, "pageCount": 5 }
  }
}
```

Any stored value can be `null`, and any array can be empty. Build every screen to handle missing values.

## Mapping to app screens

| Screen or element | JSON location |
|---|---|
| Dealership name and logo | `dealer.name`, `dealer.logoUrl` |
| Business details | `dealer.legalName`, `dealer.registrationNumber`, `dealer.vatNumber`, `dealer.dealerLicenceNumber` |
| Contact | `dealer.email`, `dealer.phone`, `dealer.website`, `dealer.address`, `dealer.city`, `dealer.province` |
| About | `dealer.description` |
| Reviews | `dealer.rating`, `dealer.googleReviewUrl`, `dealer.hellopeterReviewUrl` |
| Status and plan | `dealer.status`, `dealer.plan` |
| Branches and map pins | `dealer.branches[]` (`latitude`, `longitude`, `operatingHours`, `isHeadOffice`) |
| Documents | `dealer.documents[]` (see below) |
| Inventory count | `vehicles.meta.total` |
| Vehicle list cards | `vehicles.data[]`: `title`, `primaryImageUrl`, `formattedMonthlyPrice`, `effectivePrice`, `year`, `mileage`, `availability` |
| Vehicle detail | Fields on each vehicle, plus `make`, `model`, `variant.specification`, `technicalSpecifications` |
| Photo gallery | `vehicles.data[].images[]`, already sorted (primary first, then by `position`) |
| Features | `vehicles.data[].featureAssignments[]` |
| VIN and registration | `vehicles.data[].vin`, `vehicles.data[].registrationNumber` |
| Status and price history | `vehicles.data[].statusHistory[]`, `vehicles.data[].priceHistory[]` (latest 50 each) |

### Notes on the data

- **All statuses are included.** Unlike the public website, this endpoint returns every vehicle of the dealer: `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `RESERVED`, `SOLD`, `ARCHIVED` and others. Group or filter by `status` in the app if needed.
- **Order.** Vehicles come newest first (by `createdAt`).
- **Prices** are whole Rand. Show `effectivePrice`, which is the special price when the vehicle is on special. `formattedMonthlyPrice` is a ready-to-display finance estimate.
- **Colour.** `colour` is one of 16 standard colours used for filtering. `colourId` is that colour's ID (1–16). For many vehicles the supplier does not give a standard colour, so `colour` is `"Unknown"` (`colourId: 14`).
- **VIN and registration** are often `null`, because the stock supplier does not send them for most vehicles. Show a "Not provided" label.
- **Business details** (`legalName`, `vatNumber` and similar) are `null` until the dealer's details are captured.
- **Documents** are empty until the dealer uploads them.

## Documents

Each document carries a short-lived download link:

```json
{
  "id": "<document UUID>",
  "dealerId": "3974",
  "type": "COMPANY_REGISTRATION",
  "fileName": "company.pdf",
  "contentType": "application/pdf",
  "storageKey": "private/dealers/3974/company.pdf",
  "uploadedAt": "2026-10-20T09:12:44.000Z",
  "downloadUrl": "<signed HTTPS link>",
  "downloadExpiresIn": 300
}
```

Documents are sorted newest first. `type` is free text set when the document is uploaded, so display it as given.

1. List documents by `fileName` and `type`.
2. To preview or download, open `downloadUrl` in the app's PDF/image viewer or the browser.
3. Links expire after 300 seconds (5 minutes). Call the endpoint again to get fresh links.
4. Never build a link from `storageKey` yourself. Only `downloadUrl` works.

## Loading every vehicle

The `dealer` object is repeated on every page. Use `vehicles.meta.pageCount` to load all pages, or load the next page as the user scrolls.

```js
const API = 'https://changecarapi.wowcar.co.th/api/v1';

async function fetchDealerPage(dealerId, page = 1, pageSize = 50) {
  const url = `${API}/dealer-app/dealers/${encodeURIComponent(dealerId)}?page=${page}&pageSize=${pageSize}`;
  const response = await fetch(url, { cache: 'no-store' });
  const body = await response.json();
  if (!response.ok) throw new Error(`Dealer API ${response.status}: ${body.code ?? body.message}`);
  return body;
}

async function fetchDealerWithAllVehicles(dealerId) {
  const first = await fetchDealerPage(dealerId);
  const vehicles = [...first.vehicles.data];
  for (let page = 2; page <= first.vehicles.meta.pageCount; page++) {
    const next = await fetchDealerPage(dealerId, page);
    vehicles.push(...next.vehicles.data);
  }
  return { dealer: first.dealer, vehicles, total: first.vehicles.meta.total };
}
```

Inventory can change while pages load. If counts look inconsistent, reload from page 1.

## Errors

Errors use the standard shape:

```json
{
  "statusCode": 404,
  "code": "DEALER_NOT_FOUND",
  "message": "Dealer not found",
  "requestId": "fa058c9e-97be-4a4e-a709-2ab916fec6da",
  "timestamp": "2026-10-28T10:27:57.887Z",
  "path": "/api/v1/dealer-app/dealers/999999"
}
```

A `400` adds a `details` array, e.g. `["property status should not exist"]`.

| Status | When | What the app should do |
|---|---|---|
| `200` with empty `vehicles.data` | The dealer has no vehicles | Show the dealer with an empty inventory state |
| `400` | Dealer ID is not a valid ID, `page`/`pageSize` is out of range, or an unsupported query parameter was sent | Fix the request |
| `404` (`DEALER_NOT_FOUND`) | The dealer does not exist | Show "Dealer not found" |
| `429` | Too many requests | Wait and retry |
| `5xx` | Server problem | Show a retry option and send `requestId` to the ChangeCars team |

Only `GET` is supported. `POST`, `PUT`, `PATCH` and `DELETE` return `404`.

## Old endpoints

An earlier token-based version was removed. Do not call these; they return `404`:

- `GET /api/v1/dealer-app/profile`
- `GET /api/v1/dealer-app/bootstrap`
- `GET /api/v1/dealer-app/vehicles`
- `/api/v1/admin/dealers/{dealerId}/app-tokens`

## Checklist

- [ ] Base URL and dealer ID configured; IDs kept as strings.
- [ ] Page 1 renders `dealer` and `vehicles.data`.
- [ ] All pages load (or infinite scroll works) using `vehicles.meta.pageCount`.
- [ ] Missing values (`null`, empty arrays) show a sensible empty state.
- [ ] Documents open through `downloadUrl` and refresh after expiry.
- [ ] No add, edit or delete controls in the app.
