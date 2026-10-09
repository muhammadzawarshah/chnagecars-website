# Search — Sort By (Mobile)

```
GET /api/v1/vehicles?sort=price-asc&page=1&pageSize=20
```

## Sort By → Query Param

| Sort By option          | Query                                   |
|-------------------------|-----------------------------------------|
| Near Me                 | `sort=nearest&lat=-26.2041&lng=28.0473` |
| Recently Added          | `sort=recent`                           |
| Price - Low to high     | `sort=price-asc`                        |
| Price - High to Low     | `sort=price-desc`                       |
| Km Driven - Low to High | `sort=mileage-asc`                      |
| Km Driven - High to Low | `sort=mileage-desc`                     |
| Year - New to Old       | `sort=year-desc`                        |
| Year - Old to New       | `sort=year-asc`                         |

## Query Params

| Param    | Type   | Required | Default  | Values / Limits |
|----------|--------|----------|----------|-----------------|
| sort     | string | No       | `recent` | `recent`, `oldest`, `price-asc`, `price-desc`, `mileage-asc`, `mileage-desc`, `year-desc`, `year-asc`, `popular`, `nearest` |
| page     | number | No       | `1`      | 1 – 500 |
| pageSize | number | No       | `20`     | 1 – 50 |
| lat      | number | With `sort=nearest` | —        | -90 – 90 |
| lng      | number | With `sort=nearest` | —        | -180 – 180 |
| radiusKm | number | No       | —        | 1 – 1000 (with `lat`, `lng`) |

### Filters (optional, can be combined with `sort`)

| Param         | Type    | Example |
|---------------|---------|---------|
| q             | string  | `ranger wildtrak` |
| make          | string (comma-separated slugs) | `bmw,audi` |
| model         | string (comma-separated, `make:model`) | `bmw:3-series` |
| variant       | string (comma-separated slugs) | `320i-m-sport-2022` |
| condition     | string (comma-separated) | `NEW`, `USED`, `DEMO` |
| category      | string (comma-separated slugs) | `suvs,bakkies` |
| fuelType      | string (comma-separated) | `PETROL,DIESEL` |
| transmission  | string (comma-separated) | `AUTOMATIC,MANUAL` |
| drivetrain    | string (comma-separated) | `FOUR_X_FOUR` |
| province      | string (comma-separated) | `GAUTENG,WESTERN_CAPE` |
| city          | string  | `Pretoria` |
| colour        | string (comma-separated) | `White,Black` |
| dealer        | string (dealer slug) | `gys-pitzer-motors-wonderboom-fbook-3975` |
| branchId      | string (uuid) | `df72d6c4-7449-526a-a5e2-04bc3271dc3f` |
| minPrice      | number  | `100000` |
| maxPrice      | number  | `500000` |
| minYear       | number  | `2018` |
| maxYear       | number  | `2024` |
| minMileage    | number  | `0` |
| maxMileage    | number  | `100000` |
| minEngineCc   | number  | `1400` |
| maxEngineCc   | number  | `3000` |
| minPowerKw    | number  | `80` |
| maxPowerKw    | number  | `200` |
| seats         | string (comma-separated) | `5,7,8+` |
| onSpecial     | boolean | `true` |
| featured      | boolean | `true` |
| availableOnly | boolean | `true` |
| collection    | string  | `hot-sellers`, `specials`, `featured`, `new-arrivals`, `budget`, `student`, `bakkies`, `electric` |

## Request Body

None

## Response `200`

```json
{
  "data": [
    {
      "id": "45fde76f-86ed-54ef-ad21-5253fa05c384",
      "slug": "2026-jetour-t2-2-0t-odyssey-fbook-1538255",
      "title": "2026 JETOUR T2 2.0T ODYSSEY",
      "condition": "USED",
      "status": "PUBLISHED",
      "year": 2026,
      "mileage": 14729,
      "price": 669900,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "UNKNOWN",
      "fuelType": "OTHER",
      "drivetrain": null,
      "colour": "Green",
      "engineCapacityCc": null,
      "powerKw": null,
      "cylinders": null,
      "seats": null,
      "doors": null,
      "province": "GAUTENG",
      "city": "Gezina",
      "primaryImageUrl": "/media/fbook/1538255-1.jpg",
      "imageCount": 1,
      "viewCount": 5,
      "publishedAt": "2026-10-08T22:19:57.542Z",
      "reservedUntil": null,
      "make": { "id": "01a11d97-e859-7128-b2fe-552a51e1a870", "name": "Jetour", "slug": "jetour" },
      "model": { "id": "01a11d97-e85f-77fb-af85-fbfb3c862923", "name": "T2", "slug": "t2" },
      "variant": null,
      "dealer": {
        "id": "32e9c2a4-21eb-542e-aca0-171cff318090",
        "name": "Gys Pitzer Motors Wonderboom",
        "slug": "gys-pitzer-motors-wonderboom-fbook-3975",
        "logoUrl": null,
        "rating": null,
        "plan": "BASIC"
      },
      "branch": {
        "id": "df72d6c4-7449-526a-a5e2-04bc3271dc3f",
        "name": "Gys Pitzer Motors Wonderboom",
        "city": "Gezina",
        "province": "GAUTENG"
      },
      "categories": [{ "slug": "suvs", "name": "SUVs" }],
      "promotion": null,
      "availability": "AVAILABLE",
      "effectivePrice": 669900,
      "discount": null,
      "distanceKm": 4.2
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 30011,
    "pageCount": 1501
  }
}
```

## Response Notes

| Field      | Type           | Present |
|------------|----------------|---------|
| distanceKm | number \| null | Only with `sort=nearest` (`null` = vehicle has no location) |

## Response `400` (invalid `sort` or param)

```json
{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "details": [
    "sort must be one of the following values: recent, oldest, price-asc, price-desc, mileage-asc, mileage-desc, year-desc, year-asc, popular, nearest"
  ],
  "requestId": "13c5264f-753c-4e4b-844f-08ff2d90e959",
  "timestamp": "2026-10-09T11:46:39.371Z",
  "path": "/api/v1/vehicles?sort=near"
}
```

## Response `400` (`sort=nearest` without `lat`/`lng`)

```json
{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "details": ["sort=nearest needs lat and lng"],
  "requestId": "...",
  "timestamp": "2026-10-09T12:00:00.000Z",
  "path": "/api/v1/vehicles?sort=nearest"
}
```
