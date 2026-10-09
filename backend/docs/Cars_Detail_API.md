# Cars Detail API — Request and Response

Use this endpoint for the existing `/cars` integration. The full path includes `/web`. This response uses website/mobile car cards; `/vehicles` has a different schema.

## Request

`GET <API_BASE_URL>/web/cars/{id}`

Base URL (local): `http://localhost:4000/api/v1`. On a physical phone, use the reachable machine IP or backend domain.

`id`: use the 32-character ID from `GET /api/v1/web/cars`. A hyphenated UUID is also accepted. Original numeric XML IDs are not accepted.

**Request body: none (GET).** No JSON body or query parameters are required. Authentication is optional; signed-in requests can send `Authorization: Bearer <access_token>`.

```http
GET /api/v1/web/cars/45fde76f86ed54efad215253fa05c384 HTTP/1.1
Host: localhost:4000
Accept: application/json
```

```sh
curl 'http://localhost:4000/api/v1/web/cars/45fde76f86ed54efad215253fa05c384' \
  --header 'Accept: application/json'
```

## Response — HTTP 200

Direct car object; no `data` wrapper. This full example was captured from the local API. Values and recommendations vary.

```json
{
  "id": "45fde76f86ed54efad215253fa05c384",
  "title": "2026 JETOUR T2 2.0T ODYSSEY",
  "make": "Jetour",
  "model": "T2",
  "year": 2026,
  "price": 669900,
  "monthlyPrice": 13272,
  "formattedMonthlyPrice": "R 13 272 pm",
  "bodyType": "SUV",
  "fuel": "Other",
  "transmission": "Unknown",
  "drive": "Unknown",
  "colour": "Green",
  "engine": "",
  "mileage": 14729,
  "image": "/media/fbook/1538255-1.jpg",
  "gallery": [
    "/media/fbook/1538255-1.jpg"
  ],
  "photoCount": 1,
  "dealer": {
    "id": "32e9c2a4-21eb-542e-aca0-171cff318090",
    "name": "Gys Pitzer Motors Wonderboom",
    "address": "803 Steve Biko Rd, Gezina, Pretoria"
  },
  "location": "Gezina, Gauteng",
  "province": "Gauteng",
  "vehicleGroup": "Used",
  "isSpecial": false,
  "featured": false,
  "listedAt": "2026-10-08",
  "views": 9,
  "enquiries": 0,
  "description": "Buy with confidence from Gys Pitzer Motors Wonderboom, a reputable dealer brought to you by CHANGECARS",
  "additionalInformation": "Buy with confidence from Gys Pitzer Motors Wonderboom, a reputable dealer brought to you by CHANGECARS",
  "mapDetails": {
    "city": "Gezina",
    "province": "GAUTENG",
    "address": "803 Steve Biko Rd, Gezina, Pretoria",
    "latitude": -25.71778,
    "longitude": 28.20972,
    "country": "South Africa",
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=-25.71778%2C28.20972",
    "embedUrl": "https://maps.google.com/maps?q=-25.71778%2C28.20972&output=embed"
  },
  "moreFromThisDealer": [
    {
      "id": "c5bd46234886591ca588e88ddabe2d37",
      "title": "2022 VOLVO XC90 D5 R-DESIGN AWD",
      "make": "Volvo",
      "model": "XC90",
      "year": 2022,
      "price": 629900,
      "monthlyPrice": 12479,
      "formattedMonthlyPrice": "R 12 479 pm",
      "bodyType": "SUV",
      "fuel": "Other",
      "transmission": "Unknown",
      "drive": "Unknown",
      "colour": "Silver",
      "engine": "",
      "mileage": 117169,
      "image": "/media/fbook/1538353-1.jpg",
      "gallery": [
        "/media/fbook/1538353-1.jpg"
      ],
      "photoCount": 1,
      "dealer": {
        "id": "32e9c2a4-21eb-542e-aca0-171cff318090",
        "name": "Gys Pitzer Motors Wonderboom",
        "address": "803 Steve Biko Rd, Gezina, Pretoria"
      },
      "location": "Gezina, Gauteng",
      "province": "Gauteng",
      "vehicleGroup": "Used",
      "isSpecial": false,
      "featured": false,
      "listedAt": "2026-10-08",
      "views": 0,
      "enquiries": 0
    },
    {
      "id": "e45c3d33c85d5524a42d2d9285559586",
      "title": "2025 JAECOO J7 1.6T INFERNO AWD",
      "make": "Jaecoo",
      "model": "J7",
      "year": 2025,
      "price": 499900,
      "monthlyPrice": 9904,
      "formattedMonthlyPrice": "R 9 904 pm",
      "bodyType": "SUV",
      "fuel": "Other",
      "transmission": "Unknown",
      "drive": "Unknown",
      "colour": "Black",
      "engine": "",
      "mileage": 27187,
      "image": "/media/fbook/1538252-1.jpg",
      "gallery": [
        "/media/fbook/1538252-1.jpg"
      ],
      "photoCount": 1,
      "dealer": {
        "id": "32e9c2a4-21eb-542e-aca0-171cff318090",
        "name": "Gys Pitzer Motors Wonderboom",
        "address": "803 Steve Biko Rd, Gezina, Pretoria"
      },
      "location": "Gezina, Gauteng",
      "province": "Gauteng",
      "vehicleGroup": "Used",
      "isSpecial": false,
      "featured": false,
      "listedAt": "2026-10-08",
      "views": 2,
      "enquiries": 0
    },
    {
      "id": "aa9990f0df835ef1a8e9b139aaccbd65",
      "title": "2021 Volvo XC60 D4 AWD Momentum",
      "make": "Volvo",
      "model": "XC60",
      "year": 2021,
      "price": 539900,
      "monthlyPrice": 10696,
      "formattedMonthlyPrice": "R 10 696 pm",
      "bodyType": "SUV",
      "fuel": "Other",
      "transmission": "Unknown",
      "drive": "Unknown",
      "colour": "White",
      "engine": "",
      "mileage": 63162,
      "image": "/media/fbook/1538352-1.jpg",
      "gallery": [
        "/media/fbook/1538352-1.jpg"
      ],
      "photoCount": 1,
      "dealer": {
        "id": "32e9c2a4-21eb-542e-aca0-171cff318090",
        "name": "Gys Pitzer Motors Wonderboom",
        "address": "803 Steve Biko Rd, Gezina, Pretoria"
      },
      "location": "Gezina, Gauteng",
      "province": "Gauteng",
      "vehicleGroup": "Used",
      "isSpecial": false,
      "featured": false,
      "listedAt": "2026-10-08",
      "views": 0,
      "enquiries": 0
    },
    {
      "id": "b1c34d97043c5339ac064d329f2a4bcb",
      "title": "2022 Volkswagen Caravelle 6.1 2.0 BiTDI Highline DSG 4Motion (146KW)",
      "make": "Volkswagen",
      "model": "Caravelle",
      "year": 2022,
      "price": 1049900,
      "monthlyPrice": 20800,
      "formattedMonthlyPrice": "R 20 800 pm",
      "bodyType": "Panel Van",
      "fuel": "Other",
      "transmission": "Unknown",
      "drive": "Unknown",
      "colour": "Charcoal",
      "engine": "",
      "mileage": 48364,
      "image": "/media/fbook/1538350-1.jpg",
      "gallery": [
        "/media/fbook/1538350-1.jpg"
      ],
      "photoCount": 1,
      "dealer": {
        "id": "32e9c2a4-21eb-542e-aca0-171cff318090",
        "name": "Gys Pitzer Motors Wonderboom",
        "address": "803 Steve Biko Rd, Gezina, Pretoria"
      },
      "location": "Gezina, Gauteng",
      "province": "Gauteng",
      "vehicleGroup": "Used",
      "isSpecial": false,
      "featured": false,
      "listedAt": "2026-10-08",
      "views": 0,
      "enquiries": 0
    },
    {
      "id": "b15687b7aa1857c9a3c1c975a893f5c6",
      "title": "2016 VOLKSWAGEN T6 CARAVELLE 2.0 BiTDi HIGHLINE DSG 4 MOTION",
      "make": "Volkswagen",
      "model": "Caravelle",
      "year": 2016,
      "price": 439900,
      "monthlyPrice": 8715,
      "formattedMonthlyPrice": "R 8 715 pm",
      "bodyType": "Panel Van",
      "fuel": "Other",
      "transmission": "Unknown",
      "drive": "Unknown",
      "colour": "Red",
      "engine": "",
      "mileage": 234482,
      "image": "/media/fbook/1538344-1.jpg",
      "gallery": [
        "/media/fbook/1538344-1.jpg"
      ],
      "photoCount": 1,
      "dealer": {
        "id": "32e9c2a4-21eb-542e-aca0-171cff318090",
        "name": "Gys Pitzer Motors Wonderboom",
        "address": "803 Steve Biko Rd, Gezina, Pretoria"
      },
      "location": "Gezina, Gauteng",
      "province": "Gauteng",
      "vehicleGroup": "Used",
      "isSpecial": false,
      "featured": false,
      "listedAt": "2026-10-08",
      "views": 0,
      "enquiries": 0
    },
    {
      "id": "6a3a77b8e2095c48ad02dc3abe66a7ee",
      "title": "2023 VOLKSWAGEN TIGUAN 2.0 TSI R-LINE 4MOTION DSG (162KW)",
      "make": "Volkswagen",
      "model": "Tiguan",
      "year": 2023,
      "price": 639900,
      "monthlyPrice": 12677,
      "formattedMonthlyPrice": "R 12 677 pm",
      "bodyType": "SUV",
      "fuel": "Other",
      "transmission": "Unknown",
      "drive": "Unknown",
      "colour": "White",
      "engine": "",
      "mileage": 25657,
      "image": "/media/fbook/1538348-1.jpg",
      "gallery": [
        "/media/fbook/1538348-1.jpg"
      ],
      "photoCount": 1,
      "dealer": {
        "id": "32e9c2a4-21eb-542e-aca0-171cff318090",
        "name": "Gys Pitzer Motors Wonderboom",
        "address": "803 Steve Biko Rd, Gezina, Pretoria"
      },
      "location": "Gezina, Gauteng",
      "province": "Gauteng",
      "vehicleGroup": "Used",
      "isSpecial": false,
      "featured": false,
      "listedAt": "2026-10-08",
      "views": 0,
      "enquiries": 0
    }
  ],
  "youMightLike": [
    {
      "id": "00ba89a5f76c58d6a51a03689bc4bee7",
      "title": "2026 JETOUR T2 2.0T DARK NIGHT",
      "make": "Jetour",
      "model": "T2",
      "year": 2026,
      "price": 704900,
      "monthlyPrice": 13965,
      "formattedMonthlyPrice": "R 13 965 pm",
      "bodyType": "SUV",
      "fuel": "Other",
      "transmission": "Unknown",
      "drive": "Unknown",
      "colour": "MATT BLACK",
      "engine": "",
      "mileage": 6,
      "image": "/media/fbook/1500345-1.jpg",
      "gallery": [
        "/media/fbook/1500345-1.jpg"
      ],
      "photoCount": 1,
      "dealer": {
        "id": "bcdd1692-3c9f-5ffd-a962-9445ae3db94f",
        "name": "Jetour Rustenburg",
        "address": "1 Korokoro St, Waterval East, Rustenburg, 2999"
      },
      "location": "Waterfall, Gauteng",
      "province": "Gauteng",
      "vehicleGroup": "New",
      "isSpecial": false,
      "featured": false,
      "listedAt": "2026-10-08",
      "views": 0,
      "enquiries": 0
    },
    {
      "id": "018e55918e285676a50d32fea94c943f",
      "title": "JETOUR T2 2.0T ODYSSEY",
      "make": "Jetour",
      "model": "T2",
      "year": 0,
      "price": 679900,
      "monthlyPrice": 13470,
      "formattedMonthlyPrice": "R 13 470 pm",
      "bodyType": "SUV",
      "fuel": "Other",
      "transmission": "Unknown",
      "drive": "Unknown",
      "colour": "Glacier White",
      "engine": "",
      "mileage": 50,
      "image": "/media/fbook/1506337-1.jpg",
      "gallery": [
        "/media/fbook/1506337-1.jpg"
      ],
      "photoCount": 1,
      "dealer": {
        "id": "05b4c69f-b236-597d-a404-17e108d6aef3",
        "name": "Jetour Tygervalley",
        "address": "Cobblewalk Centre,, Conner Verdi Blvd &amp; Legato Road, Durbanville, Capetown, 7550,"
      },
      "location": "Durbanville, Western Cape",
      "province": "Western Cape",
      "vehicleGroup": "New",
      "isSpecial": false,
      "featured": false,
      "listedAt": "2026-10-08",
      "views": 0,
      "enquiries": 0
    },
    {
      "id": "01fa0faa10d55e83aba9b36c891d40bb",
      "title": "2026 Jetour T2 Odyssey 2.0TD+7DCT 4WD",
      "make": "Jetour",
      "model": "T2",
      "year": 2026,
      "price": 769900,
      "monthlyPrice": 15253,
      "formattedMonthlyPrice": "R 15 253 pm",
      "bodyType": "SUV",
      "fuel": "Other",
      "transmission": "Unknown",
      "drive": "Unknown",
      "colour": "Black",
      "engine": "",
      "mileage": 91,
      "image": "/media/fbook/1324950-1.jpg",
      "gallery": [
        "/media/fbook/1324950-1.jpg"
      ],
      "photoCount": 1,
      "dealer": {
        "id": "0c10b5a3-6d38-5b63-aa8b-75eada2adb97",
        "name": "Mit Mak Motors",
        "address": "590 Gerrit Maritz Street,, Pretoria North,, 0182"
      },
      "location": "Pretoria, Gauteng",
      "province": "Gauteng",
      "vehicleGroup": "New",
      "isSpecial": false,
      "featured": false,
      "listedAt": "2026-10-08",
      "views": 0,
      "enquiries": 0
    },
    {
      "id": "027db10a4da950e8a4e67937c8788283",
      "title": "2026 Jetour T2 Odyssey 2.0TD+7DCT 4WD",
      "make": "Jetour",
      "model": "T2",
      "year": 2026,
      "price": 704900,
      "monthlyPrice": 13965,
      "formattedMonthlyPrice": "R 13 965 pm",
      "bodyType": "SUV",
      "fuel": "Other",
      "transmission": "Unknown",
      "drive": "Unknown",
      "colour": "Black",
      "engine": "",
      "mileage": 0,
      "image": "/media/fbook/1334577-1.jpg",
      "gallery": [
        "/media/fbook/1334577-1.jpg"
      ],
      "photoCount": 1,
      "dealer": {
        "id": "4a70d2c1-8f40-53da-abb6-00381f63dc7c",
        "name": "Jetour The Glen",
        "address": "22 Boundary Rd, Oakdene,"
      },
      "location": "Oakdene, Gauteng",
      "province": "Gauteng",
      "vehicleGroup": "New",
      "isSpecial": false,
      "featured": false,
      "listedAt": "2026-10-08",
      "views": 0,
      "enquiries": 0
    },
    {
      "id": "039f054641e3529dae9b487f439feac0",
      "title": "JETOUR T2 2.0T ODYSSEY",
      "make": "Jetour",
      "model": "T2",
      "year": 0,
      "price": 679900,
      "monthlyPrice": 13470,
      "formattedMonthlyPrice": "R 13 470 pm",
      "bodyType": "SUV",
      "fuel": "Other",
      "transmission": "Unknown",
      "drive": "Unknown",
      "colour": "Glacier White",
      "engine": "",
      "mileage": 5,
      "image": "/media/fbook/1420688-1.jpg",
      "gallery": [
        "/media/fbook/1420688-1.jpg"
      ],
      "photoCount": 1,
      "dealer": {
        "id": "05b4c69f-b236-597d-a404-17e108d6aef3",
        "name": "Jetour Tygervalley",
        "address": "Cobblewalk Centre,, Conner Verdi Blvd &amp; Legato Road, Durbanville, Capetown, 7550,"
      },
      "location": "Durbanville, Western Cape",
      "province": "Western Cape",
      "vehicleGroup": "New",
      "isSpecial": false,
      "featured": false,
      "listedAt": "2026-10-08",
      "views": 0,
      "enquiries": 0
    },
    {
      "id": "08a7df0c351050bfa1d30b427a0cb009",
      "title": "2026 JETOUR T2 i-DM 1.5T (PHEV)",
      "make": "Jetour",
      "model": "T2",
      "year": 2026,
      "price": 749900,
      "monthlyPrice": 14856,
      "formattedMonthlyPrice": "R 14 856 pm",
      "bodyType": "SUV",
      "fuel": "Other",
      "transmission": "Unknown",
      "drive": "Unknown",
      "colour": "TITAN SILVER",
      "engine": "",
      "mileage": 0,
      "image": "/media/fbook/1510482-1.jpg",
      "gallery": [
        "/media/fbook/1510482-1.jpg"
      ],
      "photoCount": 1,
      "dealer": {
        "id": "3265801f-5246-5121-ad67-9666e4a3391d",
        "name": "Morgan Motor Group Bethlehem - Nissan/Jetour/Suzuki/BYD",
        "address": "182 Commissioner Street, Bethlehem, 9701"
      },
      "location": "Bethlehem, Free State",
      "province": "Free State",
      "vehicleGroup": "New",
      "isSpecial": false,
      "featured": false,
      "listedAt": "2026-10-08",
      "views": 0,
      "enquiries": 0
    }
  ]
}
```

## Detail sections

| Section | Field | Contents |
|---|---|---|
| Map | `mapDetails` | City, province enum, address, country, nullable coordinates, `googleMapsUrl` and `embedUrl`. Falls back to address when coordinates are missing. |
| Location text | `location` | Existing city/province display string, kept compatible. |
| Additional information | `additionalInformation` | Dealer description, also returned as `description`; null if missing. |
| More from this dealer | `moreFromThisDealer` | Up to six other public cars from the same approved dealer. |
| You might like this | `youMightLike` | Up to six cars: same model first, then matching category within 25% of price. |

Both related sections return the same card shape as `/web/cars`: `id`, `title`, `make`, `model`, `image`, `gallery`, `price`, `dealer`, etc. They exclude the current car and are empty arrays when no matches exist. Related cards do not recursively contain detail sections.

## Client handling

- `make` and `model` are strings here, not objects. `id` is a 32-character website ID.
- `image` is the cover photo and `gallery` is an array of image URL strings.
- Resolve relative image URLs against the website/media host (`http://localhost:3000` locally), not the API host.
- `mapDetails.latitude` and `longitude` can be null. Open `googleMapsUrl` externally or use `embedUrl` in a map web view.
- Missing year uses `0`, missing mileage uses `-1`; render them as Unknown. Other missing optional specifications can be omitted.
- Unavailable source photos use `/img/feed-image-unavailable.png`.
- An unknown/non-public car or a car from a non-approved dealer returns HTTP 404 with the standard error fields (`statusCode`, `code`, `message`, `details`, `requestId`, `timestamp`, `path`).
