# Car Search & Sorting

```
GET /api/v1/web/cars?sort=price-asc&page=1
```

## Query Params

| Param | Type   | Required | Default  | Values |
|-------|--------|----------|----------|--------|
| sort  | string | No       | `recent` | `recent`, `price-asc`, `price-desc`, `mileage-asc`, `mileage-desc`, `year-asc`, `year-desc` |
| page  | number | No       | `1`      | 1 … `pageCount` |

### Filters (optional, can be combined with `sort`)

| Param        | Type   | Example |
|--------------|--------|---------|
| q            | string | `ranger wildtrak` |
| make         | string (comma-separated) | `toyota,ford` |
| model        | string (comma-separated, `make:model`) | `ford:ranger` |
| variant      | string (comma-separated) | `ford:ranger:wildtrak` |
| bodyType     | string (comma-separated) | `SUV,Hatchback` |
| fuel         | string (comma-separated) | `Petrol,Diesel` |
| transmission | string (comma-separated) | `Automatic,Manual` |
| drive        | string (comma-separated) | `4x4` |
| province     | string (comma-separated) | `Gauteng,Western Cape` |
| colour       | string (comma-separated) | `White,Black` |
| collection   | string | `hot-sellers`, `student`, `bakkies`, `cheap`, `exotics`, `classics`, `leisure` |
| vehicleGroup | string (comma-separated) | `new`, `almost-new`, `used`, `classic` |
| specials     | string (comma-separated) | `on-special`, `not-on-special` |
| seats        | string (comma-separated) | `5,7,8+` |
| cylinders    | string (comma-separated) | `1-2`, `3-5`, `6-8`, `10-12` |
| dealership   | string (comma-separated) | dealer name or slug |
| minPrice     | number | `100000` |
| maxPrice     | number | `500000` |
| minYear      | number | `2018` |
| maxYear      | number | `2024` |
| minMileage   | number | `0` |
| maxMileage   | number | `100000` |
| minEngine    | number (cc) | `1400` |
| maxEngine    | number (cc) | `3000` |
| minKw        | number | `80` |
| maxKw        | number | `200` |

## Request Body

None

## Response `200`

```json
{
  "cars": [
    {
      "id": "45fde76f86ed54efad215253fa05c384",
      "title": "2026 JETOUR T2 2.0T ODYSSEY",
      "make": "Jetour",
      "model": "T2",
      "year": 2026,
      "price": 669900,
      "bodyType": "SUV",
      "fuel": "Petrol",
      "transmission": "Automatic",
      "drive": "4x4",
      "colour": "Green",
      "engine": "2.0L",
      "mileage": 14729,
      "image": "/media/fbook/1538255-1.jpg",
      "gallery": ["/media/fbook/1538255-1.jpg"],
      "photoCount": 1,
      "dealer": {
        "id": "32e9c2a4-21eb-542e-aca0-171cff318090",
        "name": "Gys Pitzer Motors Wonderboom",
        "logo": "https://.../logo.png",
        "address": "803 Steve Biko Rd, Gezina, Pretoria",
        "hours": [
          { "day": "Monday to Friday", "time": "08:00 – 17:00" },
          { "day": "Sunday", "time": "Closed" }
        ]
      },
      "location": "Gezina, Gauteng",
      "province": "Gauteng",
      "category": "SUVs",
      "vehicleGroup": "Used",
      "isSpecial": false,
      "engineCc": 1998,
      "powerKw": 187,
      "seats": 5,
      "cylinders": 4,
      "featured": false,
      "listedAt": "2026-10-08",
      "views": 5,
      "enquiries": 0
    }
  ],
  "total": 30011,
  "page": 1,
  "pageCount": 1501
}
```

## Response Fields

| Field                 | Type                              | Optional |
|-----------------------|-----------------------------------|----------|
| cars                  | Car[] (20 per page)               | No       |
| total                 | number                            | No       |
| page                  | number                            | No       |
| pageCount             | number                            | No       |
| cars[].id             | string                            | No       |
| cars[].title          | string                            | No       |
| cars[].make           | string                            | No       |
| cars[].model          | string                            | No       |
| cars[].year           | number                            | No       |
| cars[].price          | number                            | No       |
| cars[].bodyType       | string                            | No       |
| cars[].fuel           | string                            | No       |
| cars[].transmission   | string                            | No       |
| cars[].drive          | string                            | No       |
| cars[].colour         | string                            | No       |
| cars[].engine         | string                            | No       |
| cars[].mileage        | number (`-1` = unknown)           | No       |
| cars[].image          | string                            | No       |
| cars[].gallery        | string[]                          | No       |
| cars[].photoCount     | number                            | No       |
| cars[].dealer.id      | string                            | No       |
| cars[].dealer.name    | string                            | No       |
| cars[].dealer.logo    | string                            | Yes      |
| cars[].dealer.address | string                            | Yes      |
| cars[].dealer.hours   | `{ day: string, time: string }[]` | Yes      |
| cars[].location       | string                            | No       |
| cars[].province       | string                            | No       |
| cars[].category       | string                            | Yes      |
| cars[].vehicleGroup   | string                            | No       |
| cars[].isSpecial      | boolean                           | No       |
| cars[].engineCc       | number                            | Yes      |
| cars[].powerKw        | number                            | Yes      |
| cars[].seats          | number                            | Yes      |
| cars[].cylinders      | number                            | Yes      |
| cars[].featured       | boolean                           | No       |
| cars[].listedAt       | string (`YYYY-MM-DD`)             | No       |
| cars[].views          | number                            | No       |
| cars[].enquiries      | number                            | No       |
