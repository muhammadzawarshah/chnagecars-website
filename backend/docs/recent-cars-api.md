# Recently Added Cars

```
GET /api/v1/web/cars/recent?limit=6
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
    "id": "45fde76f86ed54efad215253fa05c384",
    "title": "2026 JETOUR T2 2.0T ODYSSEY",
    "make": "Jetour",
    "model": "T2",
    "year": 2026,
    "price": 669900,
    "bodyType": "SUV",
    "fuel": "Other",
    "transmission": "Unknown",
    "drive": "Unknown",
    "colour": "Green",
    "engine": "",
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
