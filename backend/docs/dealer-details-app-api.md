# Dealer Details App API

Integration guide for the separate dealer app. The app shows one dealership, or a group of dealerships, with business details, branches, documents, complete vehicle inventory, and a vehicle detail screen with "You might like" suggestions from the same dealership or group.

The API is read-only. It needs no login, token, API key or `Authorization` header. The app cannot add, edit or delete anything through it.

## What you need

| Value | Value to use |
|---|---|
| API base URL | `https://changecarapi.wowcar.co.th/api/v1` |
| Dealer ID | Provided by the ChangeCars team per dealership, e.g. `3974`. Always keep IDs as strings. |
| Dealer group (optional) | Several dealer IDs joined with commas, e.g. Group1: `3490,3491,3493,3496`. See [Dealer groups](#dealer-groups). |

## Endpoints

| Endpoint | Use it for |
|---|---|
| `GET /dealer-app/dealers/{dealerIds}` | Dealer profile(s) and paginated inventory |
| `GET /dealer-app/dealers/{dealerIds}/vehicles/{vehicleId}` | One vehicle with "You might like" from the same dealer(s) ([details](#vehicle-detail-with-you-might-like)) |

`{dealerIds}` is one dealer ID (`3974`) or a comma-separated group (`3490,3491,3493,3496`).

### Dealer and inventory

```http
GET https://changecarapi.wowcar.co.th/api/v1/dealer-app/dealers/{dealerIds}?page=1&pageSize=50
```

```sh
curl "https://changecarapi.wowcar.co.th/api/v1/dealer-app/dealers/3974?page=1&pageSize=50"
```

| Query parameter | Default | Rules |
|---|---|---|
| `page` | `1` | Integer, 1 or more. |
| `pageSize` | `20` | Integer, 1–100. Use 20–50 in the app: each vehicle carries its full gallery and history, so 20 vehicles are about 280 KB and 100 vehicles about 1.3 MB. |

No other query parameters are accepted. Any other parameter (for example `status` or `dealerId`) returns `400`. A `page` after the last page returns `200` with an empty `vehicles.data`; `vehicles.meta` still shows the real `total` and `pageCount`.

Responses are sent with `Cache-Control: private, no-store`. Do not cache them on a shared server, and fetch again when you need fresh data.

## Response

The response has `dealer` (the dealer object), `dealers` (an array with the same dealer) and `vehicles`. For a [dealer group](#dealer-groups), `dealer` is not present and `dealers` lists every dealer. Example from the live API (shortened):

```json
{
  "dealer": {
    "id": "3974",
    "name": "Gys Pitzer Motors Lindo Park",
    "slug": "gys-pitzer-motors-lindo-park-3974",
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
        "condition": "Used",
        "status": "PUBLISHED",
        "availability": "AVAILABLE",
        "year": 2024,
        "mileage": 49660,
        "price": 299900,
        "specialPrice": null,
        "isSpecial": false,
        "effectivePrice": 299900,
        "formattedMonthlyPrice": "R 5 941 pm",
        "transmission": "Automatic",
        "transmissionLabel": "Automatic",
        "fuelType": "Petrol",
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
- **Availability.** `availability` is derived from `status`. Use it for the badge on cards:

  | `status` | `availability` |
  |---|---|
  | `PUBLISHED` | `AVAILABLE` |
  | `RESERVED` | `RESERVED` |
  | `SOLD` | `SOLD` |
  | `SUSPENDED` | `TEMPORARILY_UNAVAILABLE` |
  | `ARCHIVED` | `ARCHIVED` |
  | Any other (`DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`) | `NOT_LISTED` |

- **Images.** Use `images[].url`. `thumbnailUrl`, `mediumUrl`, `largeUrl`, `width` and `height` are currently `null`. `primaryImageUrl` is the first photo. If `images` is empty, show a placeholder image.
- **Dates.** `createdAt`, `updatedAt`, `publishedAt`, `soldAt` and the history dates are ISO 8601 in UTC (ending in `Z`). `publishedAt` is when the vehicle was listed by the dealer. `sourceCreatedAt` and `sourceUpdatedAt` are the stock supplier's own times, given as `YYYY-MM-DD HH:mm:ss` in South African time (UTC+2) without a zone.
- **Vehicles can disappear.** A vehicle can be removed from the inventory, for example when its stock listing is withdrawn. A saved vehicle ID can then return `404` (`VEHICLE_NOT_FOUND`); remove it from the app and reload the list.
- **Dealer status.** `dealer.status` is normally `APPROVED`. A dealer can also be `SUSPENDED`; the API still returns it, so decide in the app whether to show a notice.
- **Prices** are whole Rand. Show `effectivePrice`, which is the special price when the vehicle is on special. `formattedMonthlyPrice` is a ready-to-display finance estimate.
- **Colour.** `colour` is one of 16 standard colours used for filtering. `colourId` is that colour's ID (1–16). For many vehicles the supplier does not give a standard colour, so `colour` is `"Unknown"` (`colourId: 14`).
- **VIN and registration** are often `null`, because the stock supplier does not send them for most vehicles. Show a "Not provided" label.
- **Business details** (`legalName`, `vatNumber` and similar) are `null` until the dealer's details are captured.
- **Documents** are empty until the dealer uploads them.

## Dealer groups

Put several dealer IDs in the path, separated by commas, to show a dealer group as one app. Both endpoints accept this.

```sh
curl "https://changecarapi.wowcar.co.th/api/v1/dealer-app/dealers/3490,3491,3493,3496?page=1&pageSize=50"
curl "https://changecarapi.wowcar.co.th/api/v1/dealer-app/dealers/3490,3491,3493,3496/vehicles/1043137"
```

| | One dealer ID | Group of IDs |
|---|---|---|
| `dealer` | The dealer object | Not present |
| `dealers` | Array with that one dealer | Every dealer, in the order of the IDs in the URL |
| `vehicles` | That dealer's vehicles | One combined list of all the group's vehicles, newest first, paginated together. `meta.total` is the group total. |
| `youMightLike` | From that dealer | From any dealer of the group |

- Use `vehicle.dealerId` to show which dealership a vehicle belongs to. Match it to `dealers[].id` for the name, logo and branch.
- Up to 20 IDs. Spaces are not allowed, and repeated IDs are ignored.
- If any ID in the group does not exist, the response is `404` (`DEALER_NOT_FOUND`) and `details` lists the missing IDs, for example `["999"]`.
- In the vehicle endpoint, the vehicle must belong to one of the group's dealers. Otherwise the response is `404` (`VEHICLE_NOT_FOUND`).
- For a new app, read `dealers` in both cases. `dealer` is kept for one-ID requests so existing code keeps working.

Example, Group1 (live counts change): 4 dealers, `meta.total` 260 (74 + 115 + 26 + 45).

## Vehicle detail with "You might like"

```http
GET https://changecarapi.wowcar.co.th/api/v1/dealer-app/dealers/{dealerIds}/vehicles/{vehicleId}?limit=6
```

```sh
curl "https://changecarapi.wowcar.co.th/api/v1/dealer-app/dealers/3491/vehicles/1479730"
```

Use this for the vehicle detail screen. `vehicleId` is `vehicles.data[].id` from the dealer endpoint.

| Query parameter | Default | Rules |
|---|---|---|
| `limit` | `6` | Number of suggestions, integer 1–24. |

No other query parameters are accepted. The response is `Cache-Control: private, no-store`.

### Response

```json
{
  "dealer": { "id": "3491", "name": "Group1 Western Cape", "branches": [], "documents": [] },
  "vehicle": { "id": "1479730", "title": "2024 Omoda C9 2.0T Inspire", "price": 610414, "status": "PUBLISHED" },
  "youMightLike": [
    { "id": "1051580", "title": "2026 Omoda C9 2.0T Explore Awd", "price": 839715, "status": "PUBLISHED" },
    { "id": "991111", "title": "2024 Chery Tiggo 8 Pro Max 2.0 Tgdi Executive Dct", "price": 480414, "status": "PUBLISHED" }
  ]
}
```

(Shortened. Fields are shown in full in the [Response](#response) section above.)

- `dealer` is the same object as in the dealer endpoint.
- `vehicle` and every item in `youMightLike` have the same fields as `vehicles.data[]`: images, make, model, variant, features, VIN, histories and so on.

### How suggestions are chosen

All suggestions come from **the same dealer**, or from any dealer of the group when several IDs are given. Vehicles of other dealers are never included. They are filled in this order until `limit` is reached:

1. **Same model** as this vehicle.
2. **Same body type** (for example SUV or hatchback) priced within 25% of this vehicle's price.
3. **Any other vehicle** of the dealer (or group), so the section is not empty when nothing similar exists.

Inside each step, the newest vehicles come first. The open vehicle and duplicates are never included. Only vehicles a buyer can see (`PUBLISHED` or `RESERVED`) are suggested, while `vehicle` itself can have any status.

`youMightLike` has fewer than `limit` items when the dealer has few listed vehicles. It is empty when the dealer has no other listed vehicle, so hide the section in that case.

### Errors

| Status | When |
|---|---|
| `400` | Dealer or vehicle ID is not a valid ID, `limit` is out of range, or an unsupported query parameter was sent |
| `404` (`DEALER_NOT_FOUND`) | A dealer does not exist (`details` lists missing IDs of a group) |
| `404` (`VEHICLE_NOT_FOUND`) | The vehicle does not exist, or belongs to a dealer not in the URL |

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

The `dealer` object (or `dealers` array for a group) is repeated on every page. Use `vehicles.meta.pageCount` to load all pages, or load the next page as the user scrolls.

```js
const API = 'https://changecarapi.wowcar.co.th/api/v1';

// dealerIds: one ID ('3974') or a group ('3490,3491,3493,3496').
async function fetchDealerPage(dealerIds, page = 1, pageSize = 50) {
  const url = `${API}/dealer-app/dealers/${dealerIds}?page=${page}&pageSize=${pageSize}`;
  const response = await fetch(url, { cache: 'no-store' });
  const body = await response.json();
  if (!response.ok) throw new Error(`Dealer API ${response.status}: ${body.code ?? body.message}`);
  return body;
}

async function fetchDealerWithAllVehicles(dealerIds) {
  const first = await fetchDealerPage(dealerIds);
  const vehicles = [...first.vehicles.data];
  for (let page = 2; page <= first.vehicles.meta.pageCount; page++) {
    const next = await fetchDealerPage(dealerIds, page);
    vehicles.push(...next.vehicles.data);
  }
  return { dealers: first.dealers, vehicles, total: first.vehicles.meta.total };
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

A `400` for a wrong query parameter has `code: "VALIDATION_FAILED"` and a `details` array, e.g. `["property status should not exist"]`. A `400` for a malformed dealer or vehicle ID in the path has `code: "BAD_REQUEST"` and no `details`.

Requests are limited to 300 per minute per IP address. Above that the API returns `429`.

| Status | When | What the app should do |
|---|---|---|
| `200` with empty `vehicles.data` | The dealer has no vehicles, or `page` is after the last page | Show the dealer with an empty inventory state, or stop loading more pages |
| `400` | Dealer ID is not a valid ID, a group has more than 20 IDs or a bad comma, `page`/`pageSize` is out of range, or an unsupported query parameter was sent | Fix the request |
| `404` (`DEALER_NOT_FOUND`) | The dealer, or one dealer of a group, does not exist. For a group, `details` lists the missing IDs. | Show "Dealer not found" and report the IDs to the ChangeCars team |
| `404` (`VEHICLE_NOT_FOUND`) | Vehicle endpoint only: the vehicle was removed, or belongs to a dealer not in the URL | Remove the vehicle from the app and reload the list |
| `429` | More than 300 requests in a minute from one IP | Wait a few seconds and retry; do not retry in a tight loop |
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
- [ ] Page 1 renders `dealers[0]` (or every entry of `dealers` for a group) and `vehicles.data`.
- [ ] All pages load (or infinite scroll works) using `vehicles.meta.pageCount`.
- [ ] Missing values (`null`, empty arrays) show a sensible empty state.
- [ ] Documents open through `downloadUrl` and refresh after expiry.
- [ ] For a dealer group, the app reads `dealers[]` and shows each vehicle's dealership from `vehicle.dealerId`.
- [ ] Vehicle detail loads from `/dealers/{dealerIds}/vehicles/{vehicleId}`, and the "You might like" section hides when `youMightLike` is empty.
- [ ] Cards show the `availability` badge, and a `404` for a saved vehicle removes it from the app.
- [ ] `pageSize` is 20–50, and `429` is retried after a short wait.
- [ ] No add, edit or delete controls in the app.
