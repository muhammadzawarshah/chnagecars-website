# Single Vehicle APIs — Mobile App Guide

There are two endpoints that return one vehicle. Both are public (no login needed) and return the same car, in two different response shapes.

| | API 1: Vehicle detail | API 2: Car detail (website shape) |
|---|---|---|
| Path | `GET /api/v1/vehicles/{idOrSlug}` | `GET /api/v1/web/cars/{id}` |
| Accepts | Vehicle **ID** (`1311843`) **or slug** (`2012-nissan-qashqai-2-0-acenta-auto-fbook-1311843`) | Vehicle **ID only** (`1311843`). A slug returns `404`. |
| Shape | Full data: nested `make`, `model`, `dealer`, `branch`, `images`, `finance`, raw enum values | Flat, display-ready data: plain strings like `"Petrol"`, `"Automatic"`, `"Nissan"` |
| Use when | You need the complete record, or you only have the slug (deep links, `/car/{slug}` URLs) | You want ready-to-show labels, the same shape as the `/web/cars` list |

Base URL: `<API_BASE_URL>/api/v1` (local: `http://localhost:4000/api/v1`). On a physical phone, use the machine IP or the deployed backend domain instead of `localhost`.

The vehicle `id` is the same number in both APIs and in every list (`/vehicles`, `/web/cars`, `/web/cars/recent`, …), so you can pass the `id` from any list straight to either detail API.

---

## Common rules (both APIs)

- **Method:** `GET`. No request body and no query parameters.
- **Auth:** optional. Send `Authorization: Bearer <access_token>` when the user is signed in. The view is then saved to the user's *Recently viewed*, and API 1 also returns the correct `isFavourite`.
- **Views:** every call counts one view for the car.
- **Caching:** responses can be cached for up to 5 minutes. Pull-to-refresh can simply call the API again.
- **Sold or reserved cars** still open, so old links keep working. Use `canEnquire` (API 1) to decide whether to show the *Enquire* button.

### Errors

| Status | When | Body |
|---|---|---|
| `404` | ID or slug does not exist, or the car is not public | `{"statusCode":404,"code":"VEHICLE_NOT_FOUND","message":"Vehicle not found", ...}` |
| `5xx` | Server problem | Show a retry message |

### Value formats (changed on 19 Oct 2026)

| Field | Values |
|---|---|
| `province` | `Eastern Cape`, `Free State`, `Gauteng`, `KwaZulu-Natal`, `Limpopo`, `Mpumalanga`, `Northern Cape`, `North West`, `Western Cape` |
| `drivetrain` (API 1) | `4x2`, `4x4`, `AWD`, `FWD`, `RWD`, or `null` |
| `drive` (API 2), `technicalSpecifications.drivenWheels` | `4X2`, `4X4` (API 2 groups AWD under `4X4`; `Unknown` when missing) |

Older values such as `WESTERN_CAPE` and `FOUR_X_TWO` are **no longer returned**. If the app maps those keys to labels, show the new value directly. Search filters still accept the old keys, so existing search calls keep working.

Some fields can be `null` or empty when the dealer did not supply them, e.g. `year`, `colour`, `latitude`/`longitude`, `rating`, `specialPrice`. Hide those rows instead of showing "null".

---

## API 1 — Vehicle detail by slug (ID also works)

Use the `slug` from any list response (or from a `/car/{slug}` link):

```http
GET /api/v1/vehicles/2012-nissan-qashqai-2-0-acenta-auto-fbook-1311843
Accept: application/json
```

```sh
curl 'http://localhost:4000/api/v1/vehicles/2012-nissan-qashqai-2-0-acenta-auto-fbook-1311843' -H 'Accept: application/json'
```

The same endpoint also accepts the numeric ID (`GET /api/v1/vehicles/1311843`) and returns the same response.

### Key fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | Vehicle ID, e.g. `"1311843"` |
| `slug` | string | SEO slug; also accepted by this API |
| `title` | string | Display title |
| `year`, `mileage` | number \| null | Mileage in km |
| `price` | number | Rand, no cents |
| `specialPrice`, `isSpecial` | number \| null, boolean | When `isSpecial` is true, show `specialPrice` as the sale price |
| `effectivePrice` | number | Price to show (special price if active, otherwise `price`) |
| `monthlyPrice`, `formattedMonthlyPrice` | number, string | Estimated instalment, e.g. `"R 2 177 pm"` |
| `condition` | string | `NEW`, `USED`, `DEMO` |
| `availability` | string | `AVAILABLE`, `RESERVED`, `SOLD` |
| `canEnquire` | boolean | Show the enquiry button only when `true` |
| `transmission` | string | `AUTOMATIC`, `MANUAL`, `UNKNOWN` |
| `fuelType` | string | `PETROL`, `DIESEL`, `HYBRID`, `PLUGIN_HYBRID`, `ELECTRIC`, `LPG`, `OTHER` |
| `drivetrain` | string \| null | `4x2`, `4x4`, `AWD`, `FWD`, `RWD` |
| `province`, `city` | string | Province is a display name, e.g. `"Western Cape"` |
| `make`, `model`, `variant` | object | `{ id, name, slug }` |
| `images[]` | array | `url`, `thumbnailUrl`, `mediumUrl`, `largeUrl`, `isPrimary`. Use `thumbnailUrl` in carousels and `largeUrl` full-screen |
| `primaryImageUrl`, `imageCount` | string, number | Cover image and total photos |
| `dealer` | object | `name`, `phone`, `email`, `whatsappNumber`, `logoUrl`, `address`, `rating` |
| `branch` | object | Branch contact, address and `operatingHours` |
| `technicalSpecifications` | object | Doors, seats, body type, engine, tyres, fuel tank, `drivenWheels` |
| `features[]` | array | Can be empty |
| `location`, `mapDetails` | object | `mapDetails.googleMapsUrl` opens Google Maps; `embedUrl` is for a web view |
| `finance` | object | Sample finance breakdown (deposit, term, rate, monthly repayment) |
| `insights` | object | Days listed, views and enquiries in the last 7 days, price comparison (fields can be `null`) |
| `moreFromThisDealer[]`, `youMightLike[]` | array | Up to 6 vehicle cards each; can be empty |
| `isFavourite` | boolean | Correct only when the request has a Bearer token |

### Example response (`200`)

Lists are shortened to one item and long text is cut with `…`.

```json
{
  "id": "1311843",
  "slug": "2012-nissan-qashqai-2-0-acenta-auto-fbook-1311843",
  "stockNumber": "MEK007|USED|23SCUNF438472",
  "description": "Standard factory specifications - ABS, Electronic brakeforce distribution, Auto Windscreen Wipers, Air bags 6, Auto ligh…",
  "title": "2012 Nissan QASHQAI 2.0 ACENTA CVT",
  "condition": "USED",
  "status": "PUBLISHED",
  "year": 2012,
  "mileage": 170716,
  "price": 109900,
  "specialPrice": null,
  "isSpecial": false,
  "isFeatured": false,
  "transmission": "AUTOMATIC",
  "fuelType": "PETROL",
  "drivetrain": "4x2",
  "colour": null,
  "engineCapacityCc": 1997,
  "powerKw": 102,
  "cylinders": 4,
  "seats": 5,
  "doors": 5,
  "province": "Western Cape",
  "city": "Retreat",
  "primaryImageUrl": "https://www.changecars.co.za/images/1000/vehicles/260429/1311843-1.jpg",
  "imageCount": 21,
  "viewCount": 11,
  "publishedAt": "2026-10-19T12:12:43.613Z",
  "reservedUntil": null,
  "make": {
    "id": "01a11d97-e81f-742d-9399-1dd3ec290549",
    "name": "Nissan",
    "slug": "nissan"
  },
  "model": {
    "id": "01a11d97-e824-707a-b0e9-807d97eec61f",
    "name": "Qashqai",
    "slug": "qashqai"
  },
  "variant": {
    "id": "dd6dac53-2560-5029-a1c6-113757a0cace",
    "name": "QASHQAI 2.0 ACENTA CVT",
    "slug": "qashqai-2-0-acenta-cvt-dealertrade-3941",
    "specification": null
  },
  "dealer": {
    "id": "2345",
    "name": "Mekor Suzuki Constantiaberg",
    "slug": "mekor-suzuki-constantiaberg-fbook-2345",
    "logoUrl": "https://www.changecars.co.za/images/200/dealers/260715/Mekor.png",
    "rating": null,
    "plan": "BASIC",
    "phone": "021 110 0777",
    "email": "johank@mekor.co.za",
    "website": null,
    "address": "211 Main Rd, Retreat, Cape Town, 7965, South Africa",
    "city": "Retreat",
    "province": "Western Cape",
    "whatsappNumber": "+27797905880"
  },
  "branch": {
    "id": "b06c3539-9d53-5493-ad6c-924ff9c80525",
    "name": "Mekor Suzuki Constantiaberg",
    "address": "211 Main Rd, Retreat, Cape Town, 7965, South Africa",
    "city": "Retreat",
    "province": "Western Cape",
    "phone": "021 110 0777",
    "email": "johank@mekor.co.za",
    "latitude": null,
    "longitude": null,
    "operatingHours": null
  },
  "categories": [
    {
      "id": "01a11d8e-47de-7671-b0fc-c832b46f00e4",
      "slug": "suvs",
      "name": "SUV"
    }
  ],
  "promotion": null,
  "latitude": null,
  "longitude": null,
  "generation": null,
  "images": [
    {
      "id": "9f7e0605-af58-5220-a1ce-3533de630545",
      "url": "https://www.changecars.co.za/images/1000/vehicles/260429/1311843-1.jpg",
      "thumbnailUrl": null,
      "mediumUrl": null,
      "largeUrl": null,
      "width": null,
      "height": null,
      "altText": "Nissan QASHQAI 2.0 ACENTA CVT",
      "isPrimary": true
    }
  ],
  "singleVehicleUrl": "new-or-used-cars-for-sale/western-cape/retreat/suv/nissan/qashqai/2-0/1311843",
  "sourceUrl": "https://www.changecars.co.za/new-or-used-cars-for-sale/western-cape/retreat/suv/nissan/qashqai/2-0/1311843",
  "technicalSpecifications": {
    "doors": 5,
    "seats": 5,
    "bodyType": "SUV",
    "colour": null,
    "introductionDate": "2010-04-20",
    "powerKw": 102,
    "cylinders": 4,
    "engineCapacityCc": 1997,
    "turboSupercharged": null,
    "fuelTankLitres": 65,
    "frontTyreSize": "215/55 R18",
    "rearTyreSize": "215/55 R18",
    "drivenWheels": "4X2"
  },
  "gears": 6,
  "turboSupercharged": null,
  "bodyTypeId": "27",
  "bodyTypeRaw": "SUV",
  "bodyType": "SUV",
  "frontTyreSize": "215/55 R18",
  "rearTyreSize": "215/55 R18",
  "fuelTankLitres": 65,
  "drivetrainSourceId": "4",
  "mmcode": "47060330",
  "additionalInformation": "Standard factory specifications - ABS, Electronic brakeforce distribution, Auto Windscreen Wipers, Air bags 6, Auto ligh…",
  "sourceVehicleId": "1311843",
  "availability": "AVAILABLE",
  "effectivePrice": 109900,
  "monthlyPrice": 2177,
  "formattedMonthlyPrice": "R 2 177 pm",
  "discount": null,
  "features": [],
  "location": {
    "city": "Retreat",
    "province": "Western Cape",
    "address": "211 Main Rd, Retreat, Cape Town, 7965, South Africa",
    "latitude": null,
    "longitude": null,
    "country": "South Africa"
  },
  "mapDetails": {
    "city": "Retreat",
    "province": "Western Cape",
    "address": "211 Main Rd, Retreat, Cape Town, 7965, South Africa",
    "latitude": null,
    "longitude": null,
    "country": "South Africa",
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=211%20Main%20Rd%2C%20Retreat%2C%20Cape%20Town%2C%207965%2C%20South%20Africa",
    "embedUrl": "https://maps.google.com/maps?q=211%20Main%20Rd%2C%20Retreat%2C%20Cape%20Town%2C%207965%2C%20South%20Africa&output=embed"
  },
  "moreFromThisDealer": [
    {
      "id": "1110970",
      "slug": "2021-renault-sandero-900t-stepway-expression-fbook-1110970",
      "stockNumber": "MEK007|USED|23SCUNF350514",
      "description": "Standard factory specifications - ABS, Electronic brakeforce distribution, Air b…",
      "title": "2021 Renault SANDERO 900T STEPWAY EXPRESSION",
      "condition": "USED",
      "status": "PUBLISHED",
      "year": 2021,
      "mileage": 74271,
      "price": 159900,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "MANUAL",
      "fuelType": "PETROL",
      "drivetrain": "4x2",
      "colour": null,
      "engineCapacityCc": 898,
      "powerKw": 66,
      "cylinders": 3,
      "seats": 5,
      "doors": 5,
      "province": "Western Cape",
      "city": "Retreat",
      "primaryImageUrl": "https://www.changecars.co.za/images/1000/vehicles/251024/1110970-1.jpg",
      "imageCount": 24,
      "viewCount": 0,
      "publishedAt": "2026-10-19T12:12:43.811Z",
      "reservedUntil": null,
      "make": {
        "id": "01a11d97-e82c-708e-8823-aca16f1b6cf1",
        "name": "Renault",
        "slug": "renault"
      },
      "model": {
        "id": "01a11d97-e89f-72f8-94e8-4d139acd4005",
        "name": "Sandero",
        "slug": "sandero"
      },
      "variant": {
        "id": "706f174f-f13d-5c43-a9bf-ec861fa00848",
        "name": "SANDERO 900T STEPWAY EXPRESSION",
        "slug": "sandero-900t-stepway-expression-dealertrade-4308",
        "specification": null
      },
      "dealer": {
        "id": "2345",
        "name": "Mekor Suzuki Constantiaberg",
        "slug": "mekor-suzuki-constantiaberg-fbook-2345",
        "logoUrl": "https://www.changecars.co.za/images/200/dealers/260715/Mekor.png",
        "rating": null,
        "plan": "BASIC",
        "whatsappNumber": "+27797905880"
      },
      "branch": {
        "id": "b06c3539-9d53-5493-ad6c-924ff9c80525",
        "name": "Mekor Suzuki Constantiaberg",
        "city": "Retreat",
        "province": "Western Cape"
      },
      "categories": [
        {
          "id": "01a11d8e-479a-734f-a993-de1927e98305",
          "slug": "hatchbacks",
          "name": "Hatchback"
        }
      ],
      "promotion": null,
      "singleVehicleUrl": "new-or-used-cars-for-sale/western-cape/retreat/hatchback/renault/sandero/900/1110970",
      "sourceUrl": "https://www.changecars.co.za/new-or-used-cars-for-sale/western-cape/retreat/hatchback/renault/sandero/900/1110970",
      "technicalSpecifications": {
        "doors": 5,
        "seats": 5,
        "bodyType": "Hatchback",
        "colour": null,
        "introductionDate": "2017-02-06",
        "powerKw": 66,
        "cylinders": 3,
        "engineCapacityCc": 898,
        "turboSupercharged": "T",
        "fuelTankLitres": 45,
        "frontTyreSize": "185/65 R15",
        "rearTyreSize": "185/65 R15",
        "drivenWheels": "4X2"
      },
      "gears": 5,
      "turboSupercharged": "TURBO",
      "bodyTypeId": "12",
      "bodyTypeRaw": "H/B",
      "bodyType": "Hatchback",
      "frontTyreSize": "185/65 R15",
      "rearTyreSize": "185/65 R15",
      "fuelTankLitres": 45,
      "drivetrainSourceId": "4",
      "mmcode": "54033240",
      "additionalInformation": "Standard factory specifications - ABS, Electronic brakeforce distribution, Air bags 2, Auto lock, ISO fix, Power steering, Steering adjustment, Seats 5, Spare wheel FULLSIZE, Keyless entry, Air conditioner, Electric windows, Radio, Remote side mirrors, Fuel UNLEADED, Engine TRANSVERSE INLINE 3, Engine size 898cc, CO2 124g/Km, Power 66kW@5250, Torque 135Nm@2500, SOHC, 2 VALVES PER CYLINDER, VVT, Gears 5, Drive FRONT, Top speed 168Km/h, Boot capacity 292 litres, Average fuel consumption 5.4l/100km, Service interval 15000km",
      "sourceVehicleId": "1110970",
      "availability": "AVAILABLE",
      "effectivePrice": 159900,
      "monthlyPrice": 3168,
      "formattedMonthlyPrice": "R 3 168 pm",
      "discount": null,
      "isFavourite": false
    }
  ],
  "youMightLike": [
    {
      "id": "1060266",
      "slug": "nissan-qashqai-1-3t-acenta-xtronic-fbook-1060266",
      "stockNumber": "22GOUCPO182054",
      "description": "The 2023 Nissan Qashqai 1.3T Acenta Xtronic is a modern compact SUV that focuses…",
      "title": "2023 Nissan Qashqai 1.3t Acenta Xtronic",
      "condition": "USED",
      "status": "PUBLISHED",
      "year": 2023,
      "mileage": 44438,
      "price": 370354,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "AUTOMATIC",
      "fuelType": "PETROL",
      "drivetrain": "4x2",
      "colour": null,
      "engineCapacityCc": 1332,
      "powerKw": 138,
      "cylinders": 4,
      "seats": 5,
      "doors": 5,
      "province": "Western Cape",
      "city": "Stellenbosch",
      "primaryImageUrl": "https://www.changecars.co.za/images/1000/vehicles/261007/1060266-1.jpg",
      "imageCount": 20,
      "viewCount": 0,
      "publishedAt": "2026-10-19T12:13:56.525Z",
      "reservedUntil": null,
      "make": {
        "id": "01a11d97-e81f-742d-9399-1dd3ec290549",
        "name": "Nissan",
        "slug": "nissan"
      },
      "model": {
        "id": "01a11d97-e824-707a-b0e9-807d97eec61f",
        "name": "Qashqai",
        "slug": "qashqai"
      },
      "variant": {
        "id": "5c61903e-5755-5993-ae62-af03c599b0cd",
        "name": "Qashqai 1.3t Acenta Xtronic",
        "slug": "qashqai-1-3t-acenta-xtronic-dealertrade-8295",
        "specification": null
      },
      "dealer": {
        "id": "3491",
        "name": "Group1 Western Cape",
        "slug": "group1-western-cape-fbook-3491",
        "logoUrl": "https://www.changecars.co.za/images/200/dealers/250711/3491.jpg",
        "rating": null,
        "plan": "BASIC",
        "whatsappNumber": "+27600798934"
      },
      "branch": {
        "id": "b4c1f17f-bce4-57b7-a104-a8914dbc4ae0",
        "name": "Group1 Western Cape",
        "city": "Stellenbosch",
        "province": "Western Cape"
      },
      "categories": [
        {
          "id": "01a11d8e-47de-7671-b0fc-c832b46f00e4",
          "slug": "suvs",
          "name": "SUV"
        }
      ],
      "promotion": null,
      "singleVehicleUrl": "new-or-used-cars-for-sale/western-cape/stellenbosch/suv/nissan/qashqai/1-3/1060266",
      "sourceUrl": "https://www.changecars.co.za/new-or-used-cars-for-sale/western-cape/stellenbosch/suv/nissan/qashqai/1-3/1060266",
      "technicalSpecifications": {
        "doors": 5,
        "seats": 5,
        "bodyType": "SUV",
        "colour": null,
        "introductionDate": "2022-09-21",
        "powerKw": 138,
        "cylinders": 4,
        "engineCapacityCc": 1332,
        "turboSupercharged": "T",
        "fuelTankLitres": 60,
        "frontTyreSize": "205/45 R18",
        "rearTyreSize": "205/45 R18",
        "drivenWheels": "4X2"
      },
      "gears": 6,
      "turboSupercharged": "TURBO",
      "bodyTypeId": "27",
      "bodyTypeRaw": "SUV",
      "bodyType": "SUV",
      "frontTyreSize": "205/45 R18",
      "rearTyreSize": "205/45 R18",
      "fuelTankLitres": 60,
      "drivetrainSourceId": "4",
      "mmcode": "47060027",
      "additionalInformation": "Standard factory specifications - ABS, Electronic brakeforce distribution, Auto Windscreen Wipers, Air bags 6, Auto lights, Day lights, ISO fix, Brake hazard lights, Power steering, Steering adjustment, Cruise control, Seats 5, Electric mirror fold, Spare wheel FULLSIZE, Keyless entry, Air conditioner, Electric windows, Radio, Remote side mirrors, Park distance - rear, Alloy wheels, Fuel UNLEADED, Engine TRANSVERSE INLINE 4, Engine size 1332cc, CO2 138g/Km, Power 110kW@5500, Torque 250Nm@3750, DOHC, 4 VALVES PER CYLINDER, Gears 1, Drive FRONT, Boot capacity 0 litres, Average fuel consumption 6.1l/100km, Service interval 15000km",
      "sourceVehicleId": "1060266",
      "availability": "AVAILABLE",
      "effectivePrice": 370354,
      "monthlyPrice": 7337,
      "formattedMonthlyPrice": "R 7 337 pm",
      "discount": null,
      "isFavourite": false
    }
  ],
  "finance": {
    "vehiclePrice": 109900,
    "deposit": 10990,
    "financeAmount": 98910,
    "balloonAmount": 0,
    "termMonths": 72,
    "annualInterestRate": 11.75,
    "monthlyRepayment": 1920.87,
    "totalRepayment": 138302.98,
    "totalInterest": 39392.98
  },
  "canEnquire": true,
  "insights": {
    "source": "this-site",
    "comparableCount": 2,
    "averagePrice": null,
    "priceDifference": null,
    "averageMileage": null,
    "mileageDifference": null,
    "daysListed": 0,
    "viewsLast7Days": 11,
    "enquiriesLast7Days": 0
  },
  "isFavourite": false
}
```

---

## API 2 — Car detail by ID (website shape)

```http
GET /api/v1/web/cars/1311843
Accept: application/json
```

```sh
curl 'http://localhost:4000/api/v1/web/cars/1311843' -H 'Accept: application/json'
```

Only the numeric `id` works here. If you only have a slug, use API 1.

### Key fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | Vehicle ID |
| `title`, `make`, `model`, `year` | string / number | Display values, e.g. `"Nissan"` |
| `price`, `monthlyPrice`, `formattedMonthlyPrice` | number / string | Rand |
| `isSpecial` | boolean | Car is on special |
| `bodyType`, `fuel`, `transmission`, `drive`, `engine`, `colour` | string | Display labels: `"SUV"`, `"Petrol"`, `"Automatic"`, `"4X2"`, `"2.0L"`. `colour` can be `""` |
| `mileage`, `engineCc`, `powerKw`, `seats`, `cylinders` | number \| null | |
| `image`, `gallery[]`, `photoCount` | string, string[], number | `gallery` is a list of image URLs |
| `location`, `province` | string | `"Retreat, Western Cape"`, `"Western Cape"` |
| `vehicleGroup` | string | e.g. `"Used"` |
| `dealer` | object | `name`, `phone`, `email`, `whatsappNumber`, `logo`, `address`, `rating`, `hours[]` (`{ day, time }`), `googleReviewUrl`, `hellopeterReviewUrl` |
| `listedAt`, `views`, `enquiries` | string / number | `listedAt` is `YYYY-MM-DD` |
| `technicalSpecifications`, `insights`, `mapDetails` | object | Same meaning as API 1 |
| `description`, `additionalInformation` | string | Dealer text |
| `moreFromThisDealer[]`, `youMightLike[]` | array | Up to 6 car cards each (same shape as `/web/cars` list items) |

### Example response (`200`)

Lists are shortened to one item and long text is cut with `…`.

```json
{
  "id": "1311843",
  "singleVehicleUrl": "new-or-used-cars-for-sale/western-cape/retreat/suv/nissan/qashqai/2-0/1311843",
  "sourceUrl": "https://www.changecars.co.za/new-or-used-cars-for-sale/western-cape/retreat/suv/nissan/qashqai/2-0/1311843",
  "title": "2012 Nissan QASHQAI 2.0 ACENTA CVT",
  "make": "Nissan",
  "model": "Qashqai",
  "year": 2012,
  "price": 109900,
  "monthlyPrice": 2177,
  "formattedMonthlyPrice": "R 2 177 pm",
  "bodyType": "SUV",
  "fuel": "Petrol",
  "transmission": "Automatic",
  "drive": "4X2",
  "colour": "",
  "engine": "2.0L",
  "mileage": 170716,
  "image": "https://www.changecars.co.za/images/1000/vehicles/260429/1311843-1.jpg",
  "gallery": [
    "https://www.changecars.co.za/images/1000/vehicles/260429/1311843-1.jpg"
  ],
  "photoCount": 21,
  "dealer": {
    "id": "2345",
    "whatsappNumber": "+27797905880",
    "name": "Mekor Suzuki Constantiaberg",
    "phone": "021 110 0777",
    "email": "johank@mekor.co.za",
    "rating": null,
    "logo": "https://www.changecars.co.za/images/200/dealers/260715/Mekor.png",
    "address": "211 Main Rd, Retreat, Cape Town, 7965, South Africa",
    "hours": [
      {
        "day": "Monday to Friday",
        "time": "08.00 – 17.00"
      },
      {
        "day": "Saturdays",
        "time": "08.30 – 13.00"
      },
      {
        "day": "Sundays",
        "time": "Closed"
      },
      {
        "day": "Public holidays",
        "time": "Closed"
      }
    ],
    "googleReviewUrl": "https://www.google.com/search?q=mekor+suzuki+constantiaberg&sca_esv=ad5fa5b217b92b02&rlz=1C1CHZN_enZA954ZA954&sxsrf=ACQVn0-c0CzYrdZln0mZ1NhdhB04f8JHZg:1711829766526&ei=BnMIZr3XH7KJi-gP8o-2yAQ&gs_ssp=eJwFwUEKgCAQAEC6Br2gi5fO7oaW-YR-YZuKiAlqIL2-mXHiniM6iF-K9YBBL9DxJhKorCUjHMGuoe_CSaGQVljNBhLOOdmYC6vv98bAKD-1macFc9nifwY_Gko&oq=mekor+suzuki+constantiaberg&gs_lp=Egxnd3Mtd2l6LXNlcnAiG21la29yIHN1enVraSBjb25zdGFudGlhYmVyZyoCCAAyCxAuGIAEGMcBGK8BMhoQLhiABBjHARivARiXBRjcBBjeBBjgBNgBAUj8ZVD3B1iCWHABeAGQAQCYAbwDoAGPVaoBCTItMjQuMTEuMbgBAcgBAPgBAZgCF6AC5TTCAgoQABhHGNYEGLADwgIQEC4YrwEYxwEYgAQYigUYJ8ICEBAuGBQYrwEYxwEYhwIYgATCAgUQABiABMICCxAuGK8BGMcBGIAEwgIHEAAYgAQYCsICHRAuGK8BGMcBGIAEGIoFGJcFGNwEGN4EGOAE2AEBwgIQEC4YgAQYFBiHAhjHARivAcICHxAuGBQYrwEYxwEYhwIYgAQYlwUY3AQY3gQY4ATYAQHCAgsQABiABBiKBRiGA8ICBhAAGBYYHsICGhAuGK8BGMcBGIAEGJcFGNwEGN4EGOAE2AEBmAMA4gMEGAAgaogGAZAGCLoGBggBEAEYFJIHCjEuMC4xMy44LjGgB9rfAg&sclient=gws-wiz-serp#lrd=0x1dcc418eeca4fc07:0x74f5481c202a6050,1,,,,",
    "hellopeterReviewUrl": "https://www.hellopeter.com/mekor-suzuki"
  },
  "location": "Retreat, Western Cape",
  "province": "Western Cape",
  "vehicleGroup": "Used",
  "isSpecial": false,
  "engineCc": 1997,
  "powerKw": 102,
  "seats": 5,
  "cylinders": 4,
  "featured": false,
  "listedAt": "2026-10-19",
  "views": 11,
  "enquiries": 0,
  "technicalSpecifications": {
    "doors": 5,
    "seats": 5,
    "bodyType": "SUV",
    "colour": null,
    "introductionDate": "2010-04-20",
    "powerKw": 102,
    "cylinders": 4,
    "engineCapacityCc": 1997,
    "turboSupercharged": null,
    "fuelTankLitres": 65,
    "frontTyreSize": "215/55 R18",
    "rearTyreSize": "215/55 R18",
    "drivenWheels": "4X2"
  },
  "insights": {
    "source": "this-site",
    "comparableCount": 2,
    "averagePrice": null,
    "priceDifference": null,
    "averageMileage": null,
    "mileageDifference": null,
    "daysListed": 0,
    "viewsLast7Days": 11,
    "enquiriesLast7Days": 0
  },
  "description": "Standard factory specifications - ABS, Electronic brakeforce distribution, Auto Windscreen Wipers, Air bags 6, Auto ligh…",
  "additionalInformation": "Standard factory specifications - ABS, Electronic brakeforce distribution, Auto Windscreen Wipers, Air bags 6, Auto ligh…",
  "mapDetails": {
    "city": "Retreat",
    "province": "Western Cape",
    "address": "211 Main Rd, Retreat, Cape Town, 7965, South Africa",
    "latitude": null,
    "longitude": null,
    "country": "South Africa",
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=211%20Main%20Rd%2C%20Retreat%2C%20Cape%20Town%2C%207965%2C%20South%20Africa",
    "embedUrl": "https://maps.google.com/maps?q=211%20Main%20Rd%2C%20Retreat%2C%20Cape%20Town%2C%207965%2C%20South%20Africa&output=embed"
  },
  "moreFromThisDealer": [
    {
      "id": "1110970",
      "singleVehicleUrl": "new-or-used-cars-for-sale/western-cape/retreat/hatchback/renault/sandero/900/1110970",
      "sourceUrl": "https://www.changecars.co.za/new-or-used-cars-for-sale/western-cape/retreat/hatchback/renault/sandero/900/1110970",
      "title": "2021 Renault SANDERO 900T STEPWAY EXPRESSION",
      "make": "Renault",
      "model": "Sandero",
      "year": 2021,
      "price": 159900,
      "monthlyPrice": 3168,
      "formattedMonthlyPrice": "R 3 168 pm",
      "bodyType": "Hatchback",
      "fuel": "Petrol",
      "transmission": "Manual",
      "drive": "4X2",
      "colour": "",
      "engine": "0.9L",
      "mileage": 74271,
      "image": "https://www.changecars.co.za/images/1000/vehicles/251024/1110970-1.jpg",
      "gallery": [
        "https://www.changecars.co.za/images/1000/vehicles/251024/1110970-1.jpg"
      ],
      "photoCount": 24,
      "dealer": {
        "id": "2345",
        "whatsappNumber": "+27797905880",
        "name": "Mekor Suzuki Constantiaberg",
        "phone": "021 110 0777",
        "email": "johank@mekor.co.za",
        "rating": null,
        "logo": "https://www.changecars.co.za/images/200/dealers/260715/Mekor.png",
        "address": "211 Main Rd, Retreat, Cape Town, 7965, South Africa",
        "hours": [
          {
            "day": "Monday to Friday",
            "time": "08.00 – 17.00"
          },
          {
            "day": "Saturdays",
            "time": "08.30 – 13.00"
          },
          {
            "day": "Sundays",
            "time": "Closed"
          },
          {
            "day": "Public holidays",
            "time": "Closed"
          }
        ],
        "googleReviewUrl": "https://www.google.com/search?q=mekor+suzuki+constantiaberg&sca_esv=ad5fa5b217b92b02&rlz=1C1CHZN_enZA954ZA954&sxsrf=ACQVn0-c0CzYrdZln0mZ1NhdhB04f8JHZg:1711829766526&ei=BnMIZr3XH7KJi-gP8o-2yAQ&gs_ssp=eJwFwUEKgCAQAEC6Br2gi5fO7oaW-YR-YZuKiAlqIL2-mXHiniM6iF-K9YBBL9DxJhKorCUjHMGuoe_CSaGQVljNBhLOOdmYC6vv98bAKD-1macFc9nifwY_Gko&oq=mekor+suzuki+constantiaberg&gs_lp=Egxnd3Mtd2l6LXNlcnAiG21la29yIHN1enVraSBjb25zdGFudGlhYmVyZyoCCAAyCxAuGIAEGMcBGK8BMhoQLhiABBjHARivARiXBRjcBBjeBBjgBNgBAUj8ZVD3B1iCWHABeAGQAQCYAbwDoAGPVaoBCTItMjQuMTEuMbgBAcgBAPgBAZgCF6AC5TTCAgoQABhHGNYEGLADwgIQEC4YrwEYxwEYgAQYigUYJ8ICEBAuGBQYrwEYxwEYhwIYgATCAgUQABiABMICCxAuGK8BGMcBGIAEwgIHEAAYgAQYCsICHRAuGK8BGMcBGIAEGIoFGJcFGNwEGN4EGOAE2AEBwgIQEC4YgAQYFBiHAhjHARivAcICHxAuGBQYrwEYxwEYhwIYgAQYlwUY3AQY3gQY4ATYAQHCAgsQABiABBiKBRiGA8ICBhAAGBYYHsICGhAuGK8BGMcBGIAEGJcFGNwEGN4EGOAE2AEBmAMA4gMEGAAgaogGAZAGCLoGBggBEAEYFJIHCjEuMC4xMy44LjGgB9rfAg&sclient=gws-wiz-serp#lrd=0x1dcc418eeca4fc07:0x74f5481c202a6050,1,,,,",
        "hellopeterReviewUrl": "https://www.hellopeter.com/mekor-suzuki"
      },
      "location": "Retreat, Western Cape",
      "province": "Western Cape",
      "vehicleGroup": "Used",
      "isSpecial": false,
      "engineCc": 898,
      "powerKw": 66,
      "seats": 5,
      "cylinders": 3,
      "featured": false,
      "listedAt": "2026-10-19",
      "views": 0,
      "enquiries": 0
    }
  ],
  "youMightLike": [
    {
      "id": "1060266",
      "singleVehicleUrl": "new-or-used-cars-for-sale/western-cape/stellenbosch/suv/nissan/qashqai/1-3/1060266",
      "sourceUrl": "https://www.changecars.co.za/new-or-used-cars-for-sale/western-cape/stellenbosch/suv/nissan/qashqai/1-3/1060266",
      "title": "2023 Nissan Qashqai 1.3t Acenta Xtronic",
      "make": "Nissan",
      "model": "Qashqai",
      "year": 2023,
      "price": 370354,
      "monthlyPrice": 7337,
      "formattedMonthlyPrice": "R 7 337 pm",
      "bodyType": "SUV",
      "fuel": "Petrol",
      "transmission": "Automatic",
      "drive": "4X2",
      "colour": "",
      "engine": "1.3L",
      "mileage": 44438,
      "image": "https://www.changecars.co.za/images/1000/vehicles/261007/1060266-1.jpg",
      "gallery": [
        "https://www.changecars.co.za/images/1000/vehicles/261007/1060266-1.jpg"
      ],
      "photoCount": 20,
      "dealer": {
        "id": "3491",
        "whatsappNumber": "+27600798934",
        "name": "Group1 Western Cape",
        "phone": "021 203 3481",
        "email": "1488@autoslm.co.za",
        "rating": null,
        "logo": "https://www.changecars.co.za/images/200/dealers/250711/3491.jpg",
        "address": "1 Jan Celliers Rd, Stellenbosch Central, Stellenbosch, 7600",
        "hours": [
          {
            "day": "Monday to Friday",
            "time": "08.00 – 17.00"
          },
          {
            "day": "Saturdays",
            "time": "08.30 – 13.00"
          },
          {
            "day": "Sundays",
            "time": "Closed"
          },
          {
            "day": "Public holidays",
            "time": "Closed"
          }
        ],
        "googleReviewUrl": "https://www.google.com/search?q=group1+cars+stellenbosch&sca_esv=8fe472cf0c0bad30&sxsrf=AE3TifPtCBTny6RtnYxtnitvalm_NmZpXw:1752253634793&ei=wkRxaKiaMOWlhbIPmIydgQc&gs_ssp=eJzj4tVP1zc0TCuuLDMpyUg2YLRSNagwTElOSTJOMUwyNUwyMDc2tTKoSE6xSDMyNkixTDE0NTBPSfWSSC_KLy0wVEhOLCpWKC5JzclJzUvKL07OAADLKBlT&oq=group1+cars+ste&gs_lp=Egxnd3Mtd2l6LXNlcnAiD2dyb3VwMSBjYXJzIHN0ZSoCCAoyERAuGIAEGJECGMcBGIoFGK8BMgUQABiABDIGEAAYFhgeMgsQABiABBiGAxiKBTILEAAYgAQYhgMYigUyCxAAGIAEGIYDGIoFMgsQABiABBiGAxiKBTILEAAYgAQYhgMYigUyCBAAGKIEGIkFMggQABiABBiiBDIgEC4YgAQYkQIYxwEYigUYrwEYlwUY3AQY3gQY4ATYAQFIqShQiANYvRdwAngAkAEBmAGxBKABsyWqAQkyLTMuNi4yLjK4AQHIAQD4AQGYAgagAqcMwgIKEAAYsAMY1gQYR8ICEBAAGIAEGLADGEMYyQMYigXCAhMQLhiABBiwAxhDGMcBGIoFGK8BwgIQEC4YgAQYxwEYJxiKBRivAcICEBAuGIAEGBQYhwIYxwEYrwHCAgsQLhiABBjHARivAcICBxAAGIAEGArCAgoQABiABBgUGIcCwgIdEC4YgAQYxwEYigUYrwEYlwUY3AQY3gQY4ATYAQGYAwDiAwQYASBOiAYBkAYKugYGCAEQARgUkgcHMi4zLTMuMaAH2JEBsgcFMy0zLjG4B5cMwgcFMi00LjLIBy8&sclient=gws-wiz-serp#lrd=0x1dcdb3d1b51b0735:0xcd8f230d9d1507de,1,,,,",
        "hellopeterReviewUrl": "https://www.hellopeter.com/group-1-stellenbosch"
      },
      "location": "Stellenbosch, Western Cape",
      "province": "Western Cape",
      "vehicleGroup": "Used",
      "isSpecial": false,
      "engineCc": 1332,
      "powerKw": 138,
      "seats": 5,
      "cylinders": 4,
      "featured": false,
      "listedAt": "2026-10-19",
      "views": 0,
      "enquiries": 0
    }
  ]
}
```

---

## Related endpoints

| Endpoint | Returns |
|---|---|
| `GET /api/v1/vehicles/{id}/similar` | Similar vehicles (API 1 card shape) |
| `GET /api/v1/vehicles/{id}/dealer-vehicles` | Other cars from the same dealer |
| `GET /api/v1/vehicles/{id}/market-price` | `comparableCount`, `averagePrice`, `minPrice`, `maxPrice`, `differenceFromAverage` |
| `GET /api/v1/web/cars/{id}/similar` | Similar cars (API 2 card shape) |
| `GET /api/v1/web/cars/{id}/dealer-cars` | Other cars from the same dealer (API 2 card shape) |

Example responses were captured from the local backend on 19 October 2026. IDs, prices and recommendations change as stock updates.
