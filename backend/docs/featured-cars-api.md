# Featured Cars

```
GET /api/v1/web/cars/featured?limit=6
```

## Query Params

| Param | Type   | Required | Default | Max |
|-------|--------|----------|---------|-----|
| limit | number | No       | 6       | 48  |

## Request Body

None

## Response `200`

```json
[
  {
    "id": "fc908b397f4e574ea463e61be362cce0",
    "title": "2020 FORD RANGER 2.0D BI-TURBO WILDTRAK A/T P/U D/C",
    "make": "Ford",
    "model": "Ranger",
    "year": 2020,
    "price": 437900,
    "bodyType": "Double Cab Bakkie",
    "fuel": "Diesel",
    "transmission": "Automatic",
    "drive": "4x4",
    "colour": "WHITE",
    "engine": "2.0L",
    "mileage": 111607,
    "image": "/media/fbook/1430475-1.jpg",
    "gallery": ["/media/fbook/1430475-1.jpg"],
    "photoCount": 1,
    "dealer": {
      "id": "3265801f-5246-5121-ad67-9666e4a3391d",
      "name": "Morgan Motor Group Bethlehem",
      "logo": "https://.../logo.png",
      "address": "182 Commissioner Street, Bethlehem, 9701",
      "hours": [
        { "day": "Monday to Friday", "time": "08:00 – 17:00" },
        { "day": "Sunday", "time": "Closed" }
      ]
    },
    "location": "Bethlehem, Free State",
    "province": "Free State",
    "category": "Bakkies",
    "vehicleGroup": "Used",
    "isSpecial": false,
    "engineCc": 1996,
    "powerKw": 157,
    "seats": 5,
    "cylinders": 4,
    "featured": true,
    "listedAt": "2026-10-08",
    "views": 5,
    "enquiries": 0
  }
]
```

## Response Fields

| Field          | Type                              | Optional |
|----------------|-----------------------------------|----------|
| id             | string                            | No       |
| title          | string                            | No       |
| make           | string                            | No       |
| model          | string                            | No       |
| year           | number                            | No       |
| price          | number                            | No       |
| bodyType       | string                            | No       |
| fuel           | string                            | No       |
| transmission   | string                            | No       |
| drive          | string                            | No       |
| colour         | string                            | No       |
| engine         | string                            | No       |
| mileage        | number (`-1` = unknown)           | No       |
| image          | string                            | No       |
| gallery        | string[]                          | No       |
| photoCount     | number                            | No       |
| dealer.id      | string                            | No       |
| dealer.name    | string                            | No       |
| dealer.logo    | string                            | Yes      |
| dealer.address | string                            | Yes      |
| dealer.hours   | `{ day: string, time: string }[]` | Yes      |
| location       | string                            | No       |
| province       | string                            | No       |
| category       | string                            | Yes      |
| vehicleGroup   | string                            | No       |
| isSpecial      | boolean                           | No       |
| engineCc       | number                            | Yes      |
| powerKw        | number                            | Yes      |
| seats          | number                            | Yes      |
| cylinders      | number                            | Yes      |
| featured       | boolean                           | No       |
| listedAt       | string (`YYYY-MM-DD`)             | No       |
| views          | number                            | No       |
| enquiries      | number                            | No       |
