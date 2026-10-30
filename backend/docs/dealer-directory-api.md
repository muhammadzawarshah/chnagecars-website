# Dealer Directory API ("Search Car Dealers" page)

This guide covers everything the app needs for the **Search Car Dealers** screen, the same page as
[changecars.co.za/dealer-listing](https://www.changecars.co.za/dealer-listing/).

- **Base URL:** `https://changecarapi.wowcar.co.th/api/v1`
- **Auth:** none. All endpoints here are public `GET` requests.
- **Format:** JSON, UTF-8. Dates are ISO 8601 in UTC.
- **Rate limit:** 300 requests per minute per IP. Over the limit you get `429`; wait and retry.

## 1. Screen to API map

| Screen part | API call |
|---|---|
| "Dealer Group" dropdown: All (n), Non-Franchised Dealers (n), each group (n) | `GET /dealers/groups` |
| "Search by Province" dropdown | Fixed list, see [Provinces](#7-provinces) |
| "Search Dealer Name" box | `GET /dealers?q=...` |
| "Quick Search" make/model picker with counts | `GET /dealers/makes` |
| ☐ Dealers that sell with on-road costs included | `GET /dealers?onRoadCosts=true` |
| ☐ Motor Bike Dealers | `GET /dealers?motorbike=true` |
| ☐ Vehicle Concierge Service | `GET /dealers?concierge=true` |
| A–Z letter bar | `GET /dealers?letter=A` |
| Dealer cards (LIST view) | `GET /dealers?page=1&pageSize=20` plus the filters above |
| MAP view (all pins) | `GET /dealers/map` plus the same filters, no paging |
| "View dealer" button | `GET /dealers/{slug}` for the profile |
| The dealer's cars | `GET /vehicles?dealer={slug}` |
| CLEAR ALL | Call `GET /dealers` again without filters |

The directory shows only **approved dealers that have cars on sale**, like the website. "All (n)" and every count below
follow that rule.

## 2. Dealer cards: `GET /dealers`

### Query parameters

All filters are optional and can be combined. Combined filters must **all** match (AND). Within one parameter,
comma-separated values match **any** of them (OR).

| Parameter | Type | Meaning | Example |
|---|---|---|---|
| `page` | integer ≥ 1 | Page number. Default `1` | `page=2` |
| `pageSize` | 1–100 | Cards per page. Default `20` | `pageSize=20` |
| `q` | text, max 100 chars | Dealer name contains this text (case-insensitive) | `q=group1` |
| `province` | province name | One province, see [Provinces](#7-provinces). Case-insensitive | `province=Gauteng` |
| `group` | comma list | Group `id` or `slug` from `/dealers/groups`. `non-franchised-dealers` = dealers in no group | `group=134` · `group=group-1,non-franchised-dealers` |
| `make` | comma list | Make `slug` from `/dealers/makes`. Dealers that have this make on sale | `make=abarth,ford` |
| `model` | comma list | Model `value` (`make:model`) from `/dealers/makes` | `model=abarth:124` |
| `letter` | one character | First letter of the dealer name, `A`–`Z`. Use `#` (send as `%23`) for names starting with a number | `letter=A` · `letter=%23` |
| `onRoadCosts` | `true` / `1` | Only dealers whose advertised prices include on-road costs | `onRoadCosts=true` |
| `motorbike` | `true` / `1` | Only motorbike dealers (they list motorbikes, or are in a bike dealer group) | `motorbike=true` |
| `concierge` | `true` / `1` | Only Vehicle Concierge Service partners | `concierge=true` |

Send checkbox filters only when ticked. Any value other than `true` or `1` (for example `false`) means "no filter".

### Example

```bash
curl "https://changecarapi.wowcar.co.th/api/v1/dealers?province=Gauteng&concierge=true&letter=G&page=1&pageSize=20"
```

```json
{
  "data": [
    {
      "id": "3490",
      "name": "Group1 Cars Midrand",
      "slug": "group1-cars-midrand-3490",
      "description": "Our Used Cars Showroom In Midrand Is Not A Single Entity But Part Of One Of The Biggest Groups ...",
      "logoUrl": "https://changecarapi.wowcar.co.th/media/dealertrade/d5bc4c1d11d75f738f3915f1b29d5e848758473b5d1acf7098b90d7df2c3ba2a.jpg",
      "website": null,
      "phone": "087 057 9788",
      "email": "1487@autoslm.co.za",
      "whatsappNumber": "+27600798934",
      "province": "Gauteng",
      "city": "Randjespark",
      "address": "Unit B, 450 16Th Rd, Randjespark, Midrand, 1685",
      "rating": null,
      "plan": "BASIC",
      "activeListings": 74,
      "groups": [
        { "id": "178", "name": "Changan Dealer", "slug": "changan-dealer", "logoUrl": "https://changecarapi.wowcar.co.th/media/dealertrade/….png" },
        { "id": "134", "name": "Group 1", "slug": "group-1", "logoUrl": "https://changecarapi.wowcar.co.th/media/dealertrade/….png" }
      ],
      "conciergePartner": true,
      "onRoadCostsIncluded": false,
      "latitude": -25.977052499529,
      "longitude": 28.131768399911,
      "createdAt": "2026-10-19T12:12:02.084Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 1, "pageCount": 1 }
}
```

### Card fields

| Field | Type | Use on the card |
|---|---|---|
| `id` | string | Dealer ID (DealerTrade number, e.g. `"3490"`) |
| `slug` | string | Use for "View dealer" and the dealer's cars |
| `name` | string | Dealer name |
| `logoUrl` | string or `null` | Logo. **Can be `null`** (about 3% of dealers): show a placeholder |
| `address`, `city`, `province` | string | Address line under the name |
| `activeListings` | number | "Vehicles Available: n" |
| `conciergePartner` | boolean | Show the concierge (bell) badge when `true` |
| `onRoadCostsIncluded` | boolean | Prices include on-road costs |
| `groups` | array | DealerTrade groups and brand franchises (`Group 1`, `Toyota Dealer`). Empty array = non-franchised |
| `rating` | number or `null` | Currently `null` for every dealer (DealerTrade sends no ratings). Hide the star badge when `null` |
| `phone`, `email`, `whatsappNumber`, `website` | string or `null` | Contact buttons. `whatsappNumber` and `website` are often `null` |
| `latitude`, `longitude` | number or `null` | Head office location; `null` when unknown |
| `description` | string or `null` | Long text for the profile; not needed on the card |
| `plan` | string | Listing plan; cards are sorted by plan, then name |

Sort order is fixed: higher plan first, then name A–Z.

### Paging

`meta.total` is the number of matching dealers and `meta.pageCount` the number of pages. Asking for a page after the
last one returns `"data": []` with the same `meta`, so stop when `page >= pageCount`.

## 3. Dealer Group dropdown: `GET /dealers/groups`

```json
{
  "total": 791,
  "groups": [
    { "id": "non-franchised", "name": "Non-Franchised Dealers", "slug": "non-franchised-dealers", "logoUrl": null, "dealerCount": 50 },
    { "id": "94", "name": "4Wheels Motor Group", "slug": "4wheels-motor-group", "logoUrl": "https://changecarapi.wowcar.co.th/media/dealertrade/….jpg", "dealerCount": 1 },
    { "id": "161", "name": "Abarth Dealer", "slug": "abarth-dealer", "logoUrl": "https://changecarapi.wowcar.co.th/media/dealertrade/….jpg", "dealerCount": 2 }
  ]
}
```

- Show `All (total)` first, then each group as `name (dealerCount)`, in the order returned.
- "Non-Franchised Dealers" is always first. The rest are sorted by name.
- On select, call `/dealers?group={slug}` (or `{id}`). For "All", leave `group` out.
- Groups include both dealer groups (`CFAO Mobility Group`, `Group 1`) and brand franchises (`Toyota Dealer`), as on the website.

## 4. Make/model picker: `GET /dealers/makes`

Every make and model on sale, with the number of directory dealers selling it.

```json
[
  {
    "slug": "abarth",
    "name": "Abarth",
    "dealerCount": 1,
    "models": [
      { "slug": "124", "value": "abarth:124", "name": "124", "dealerCount": 1 }
    ]
  }
]
```

- Show makes as `name (dealerCount)`. Expand a make to show its `models` the same way.
- A ticked make sends its `slug` in `make`. A ticked model sends its `value` in `model`. Several ticks go comma-separated.
- `Any` = leave `make` and `model` out.

```bash
curl "https://changecarapi.wowcar.co.th/api/v1/dealers?make=alfa-romeo&model=abarth:124"
```

## 5. Map view: `GET /dealers/map`

Takes the same filters as `/dealers` (no `page`/`pageSize`) and returns **every** matching dealer that has a
location, in one array.

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

- One pin per dealer at `latitude`/`longitude`. Tap a pin to show `name`, `address` and "View dealer" (`slug`).
- Without filters this is all dealers (about 790, roughly 250 KB), so cluster pins when zoomed out.
- A few dealers have no location. They appear in the list view but not on the map.

## 6. "View dealer": `GET /dealers/{slug}`

Returns the card fields plus all branches.

```bash
curl "https://changecarapi.wowcar.co.th/api/v1/dealers/group1-cars-midrand-3490"
```

`branches` is an array:

```json
{
  "id": "86bbdcb5-3c02-5505-a149-5d343c4e5614",
  "name": "Group1 Cars Midrand",
  "slug": "feed-head-office",
  "address": "Unit B, 450 16Th Rd, Randjespark, Midrand, 1685",
  "city": "Randjespark",
  "province": "Gauteng",
  "phone": "087 057 9788",
  "email": "1487@autoslm.co.za",
  "latitude": -25.977052499529,
  "longitude": 28.131768399911,
  "operatingHours": null,
  "isHeadOffice": true
}
```

The dealer ID also works in place of the slug (`/dealers/3490`).

### The dealer's cars

```bash
curl "https://changecarapi.wowcar.co.th/api/v1/vehicles?dealer=group1-cars-midrand-3490&page=1&pageSize=20"
```

`dealer` accepts the slug or the ID. Each car includes its photos (`images`), `imageCount`, price and the usual
vehicle fields. The total matches the dealer's `activeListings`.

## 7. Provinces

Send the name exactly as shown (any letter case works):

`Eastern Cape`, `Free State`, `Gauteng`, `KwaZulu-Natal`, `Limpopo`, `Mpumalanga`, `North West`, `Northern Cape`,
`Western Cape`.

## 8. Errors

Invalid input returns `400` with a list of problems:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "details": ["letter must match /^[A-Za-z#]$/ regular expression"],
  "requestId": "999ec1c1-5e35-460c-8469-c40dcfc2fb2e",
  "timestamp": "2026-10-29T13:19:50.001Z",
  "path": "/api/v1/dealers?letter=AB"
}
```

| Status | When | What to do |
|---|---|---|
| `400 VALIDATION_FAILED` | Unknown parameter, `pageSize` over 100, bad `letter` or `province` | Fix the request; `details` says what is wrong |
| `404 DEALER_NOT_FOUND` | `/dealers/{slug}` for a dealer that does not exist or is no longer listed | Show "Dealer not found" and go back to the list |
| `429` | More than 300 requests a minute | Wait a few seconds and retry |
| `5xx` | Server problem | Show a retry button |

Filters with no matches are **not** errors: you get `"data": []` and `"total": 0`. Show "No dealers found".

## 9. Data notes

- **Where data comes from:** dealers, groups, concierge partners, logos and locations come from DealerTrade and update
  automatically every few minutes. A change can take about a minute to show.
- **On-road costs:** DealerTrade does not send this, so ChangeCars admins set it per dealer. Until they do,
  `onRoadCosts=true` returns no dealers. Keep the checkbox; it starts working as admins fill it in.
- **Ratings:** not available yet (`rating` is `null`).
- **Logos:** dealer and group logos are served from our own server (`https://changecarapi.wowcar.co.th/media/dealertrade/...`), copied from DealerTrade; they never change at the same link, so they can be cached for good. About 25 dealers and the "Non-Franchised Dealers" group have no logo (`null`). Use a placeholder.
- **Text case:** names, addresses and descriptions come from DealerTrade and may have unusual capitalisation
  ("16Th Rd"). Show them as they are.

## 10. Checklist for the screen

1. On open: call `/dealers/groups`, `/dealers/makes` and `/dealers?page=1&pageSize=20` in parallel.
2. When any filter changes: reset to `page=1` and call `/dealers` with **all** active filters.
3. Infinite scroll or "Load more": increase `page` until `page >= meta.pageCount`.
4. MAP tab: call `/dealers/map` with the same filters (no paging).
5. CLEAR ALL: drop every filter and reload page 1.
6. Placeholder images for `logoUrl: null`; hide the star badge when `rating` is `null`.
7. Show the concierge badge when `conciergePartner` is `true`.
8. "Vehicles Available" = `activeListings`.
9. Encode `#` as `%23` and spaces as `%20` in query strings.
