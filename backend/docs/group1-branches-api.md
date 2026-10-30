# Group1 App: Branches API

The Group1 app's **Branches** screen uses the **same endpoint and the same response** as the ChangeCars app's
**Dealers** screen. The only difference is the base URL: the Group1 app puts `scope/{dealerIds}/` after
`/api/v1/`, and every response then contains only Group1's branches.

| App | Screen | Endpoint |
|---|---|---|
| ChangeCars | Dealers | `GET https://changecarapi.wowcar.co.th/api/v1/dealers` |
| Group1 | Branches | `GET https://changecarapi.wowcar.co.th/api/v1/scope/3490,3491,3493,3496/dealers` |

Keep the base URL in one place in the app and reuse the ChangeCars dealers code unchanged:

```js
const API = 'https://changecarapi.wowcar.co.th/api/v1/scope/3490,3491,3493,3496';
fetch(`${API}/dealers?page=1&pageSize=20`);
```

No login or token is needed.

## 1. Group1 branches

| ID | Branch | City | Province |
|---|---|---|---|
| `3490` | Group1 Cars Midrand | Randjespark | Gauteng |
| `3491` | Group1 Western Cape | Stellenbosch | Western Cape |
| `3493` | Group1 Cars Uitenhage | Kariega | Eastern Cape |
| `3496` | Group1 Cars George | George | Western Cape |

The order of the IDs in the URL does not matter. Branch details and car counts come live from the server, so
never hard-code them in the app.

## 2. Branch list: `GET /dealers`

```bash
curl "https://changecarapi.wowcar.co.th/api/v1/scope/3490,3491,3493,3496/dealers?page=1&pageSize=20"
```

### Response

```json
{
  "data": [
    {
      "id": "3496",
      "name": "Group1 Cars George",
      "slug": "group1-cars-george-3496",
      "description": "While The Group1 Branch In George Proudly Serves The Locals, …",
      "logoUrl": "https://changecarapi.wowcar.co.th/media/dealertrade/….jpg",
      "website": null,
      "phone": "044 868 0288",
      "whatsappNumber": "+27600798934",
      "email": "1857@autoslm.co.za",
      "province": "Western Cape",
      "city": "George",
      "address": "Cnr Jan Smuts Street And, York St, George South, George, 6529",
      "latitude": -33.965592707491,
      "longitude": 22.45132872949,
      "rating": null,
      "plan": "BASIC",
      "onRoadCostsIncluded": false,
      "conciergePartner": true,
      "activeListings": 45,
      "groups": [
        { "id": "134", "name": "Group 1", "slug": "group-1", "logoUrl": "https://changecarapi.wowcar.co.th/media/dealertrade/….png" },
        { "id": "116", "name": "Mazda Dealer", "slug": "mazda-dealer", "logoUrl": "https://changecarapi.wowcar.co.th/media/dealertrade/….png" }
      ],
      "createdAt": "2026-10-19T12:12:02.092Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 4, "pageCount": 1 }
}
```

### Branch fields

| Field | Type | Use |
|---|---|---|
| `id` | string | Branch ID (the DealerTrade dealer number) |
| `name` | string | Branch name for the card |
| `slug` | string | Opens the branch detail (§4) |
| `description` | string or null | About text |
| `logoUrl` | string or null | Branch logo. Served from our server (`/media/dealertrade/…`) |
| `phone`, `whatsappNumber`, `email`, `website` | string or null | Contact buttons. Hide a button when its value is `null` |
| `address`, `city`, `province` | string | Card location line |
| `latitude`, `longitude` | number or null | Map pin and directions |
| `activeListings` | integer | "N vehicles" on the card |
| `groups` | array | Group badges (`name`, `logoUrl`) |
| `conciergePartner` | boolean | Show the Vehicle Concierge badge |
| `onRoadCostsIncluded` | boolean | Prices include on-road costs |
| `rating` | null | Not available yet |
| `plan`, `createdAt` | string | Not needed on screen |

### Filters

All filters are optional and work exactly as in the ChangeCars dealers API:

| Parameter | Example | Meaning |
|---|---|---|
| `page`, `pageSize` | `page=1&pageSize=20` | Paging. `pageSize` 1–100, default 20 |
| `q` | `q=george` | Branch name contains the text |
| `province` | `province=Western Cape` | Branches in one province |
| `make` | `make=chery,nissan` | Branches selling any of these makes (slugs from §5) |
| `model` | `model=chery:tiggo-4-pro` | Branches selling this model (`value` from §5) |
| `group` | `group=nissan-dealer` | Branches in this dealer group (from §5) |
| `letter` | `letter=G` | Name starts with this letter |
| `concierge` | `concierge=true` | Vehicle Concierge partners only |

Example: `…/scope/3490,3491,3493,3496/dealers?province=Western Cape` returns 2 branches (Stellenbosch and George).

## 3. Map: `GET /dealers/map`

All Group1 branches with a location in one array, no paging. Accepts the same filters as §2.

```bash
curl "https://changecarapi.wowcar.co.th/api/v1/scope/3490,3491,3493,3496/dealers/map"
```

```json
[
  {
    "id": "3496",
    "name": "Group1 Cars George",
    "slug": "group1-cars-george-3496",
    "logoUrl": "https://changecarapi.wowcar.co.th/media/dealertrade/….jpg",
    "city": "George",
    "province": "Western Cape",
    "address": "Cnr Jan Smuts Street And, York St, George South, George, 6529",
    "latitude": -33.965592707491,
    "longitude": 22.45132872949
  }
]
```

## 4. Branch detail: `GET /dealers/{slug}`

```bash
curl "https://changecarapi.wowcar.co.th/api/v1/scope/3490,3491,3493,3496/dealers/group1-cars-george-3496"
```

Returns the same fields as §2 plus `branches` (the branch's addresses, phone numbers and opening hours). The
ID works in place of the slug (`/dealers/3496`). A dealer outside Group1 returns `404`.

The branch's cars:

```bash
curl "https://changecarapi.wowcar.co.th/api/v1/scope/3490,3491,3493,3496/vehicles?dealer=group1-cars-george-3496&page=1&pageSize=20"
```

The car total matches the branch's `activeListings`.

## 5. Filter options

| Endpoint | Returns |
|---|---|
| `GET /scope/3490,3491,3493,3496/dealers/makes` | Makes and models Group1 has on sale, with branch counts |
| `GET /scope/3490,3491,3493,3496/dealers/groups` | Dealer groups of the Group1 branches (`Group 1`, `Changan Dealer`, `Mazda Dealer`, `Nissan Dealer`) with `dealerCount` |

The response formats are the same as in the ChangeCars app (see `dealer-directory-api.md`).

## 6. Errors

| Status | Code | When |
|---|---|---|
| `400` | `BAD_REQUEST` | An ID in the scope is not a number, or there are more than 20 IDs |
| `404` | `DEALER_NOT_FOUND` | An ID in the scope is not a dealer on ChangeCars |
| `404` | `DEALER_NOT_FOUND` | `/dealers/{slug}` for a branch outside Group1 |

## 7. Quick test

```bash
B=https://changecarapi.wowcar.co.th/api/v1/scope/3490,3491,3493,3496
curl "$B/dealers"                                   # meta.total = 4
curl "$B/dealers?province=Western%20Cape"           # 2 branches
curl "$B/dealers/map"                               # 4 pins
curl "$B/dealers/group1-cars-midrand-3490"          # one branch with its addresses
```
