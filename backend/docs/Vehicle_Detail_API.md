# Vehicle Detail API — Request and Response

This document describes the mobile detail endpoint. The JSON example below is a full response captured from the local backend; example IDs, values and recommendations can change.

## Endpoint

`GET <API_BASE_URL>/vehicles/{uuid-or-slug}`

- Local API base URL: `http://localhost:4000/api/v1`.
- Use the reachable backend domain or machine IP when testing on a phone.
- `uuid-or-slug` accepts the hyphenated vehicle UUID or the backend vehicle slug returned by the listing API. It does not accept the original XML vehicle ID as a standalone numeric ID.
- This is the public mobile API, distinct from `/web/cars/{id}`, which uses a website-specific response.

## Request

```http
GET /api/v1/vehicles/45fde76f-86ed-54ef-ad21-5253fa05c384 HTTP/1.1
Host: localhost:4000
Accept: application/json
```

**Request body: none.** This GET endpoint does not require a JSON body or query parameters.

Authentication is optional. Anonymous users can fetch the detail. For a signed-in user, add `Authorization: Bearer <access_token>`; the view is also recorded in recently viewed.

```sh
curl --request GET 'http://localhost:4000/api/v1/vehicles/45fde76f-86ed-54ef-ad21-5253fa05c384' \
  --header 'Accept: application/json'
```

## Success response — HTTP 200

The response is a direct vehicle object, without a `data` or `results` wrapper. Related arrays contain public vehicle cards, without recursively embedding detail sections.

```json
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
  "viewCount": 7,
  "publishedAt": "2026-10-08T22:19:57.542Z",
  "reservedUntil": null,
  "make": {
    "id": "01a11d97-e859-7128-b2fe-552a51e1a870",
    "name": "Jetour",
    "slug": "jetour"
  },
  "model": {
    "id": "01a11d97-e85f-77fb-af85-fbfb3c862923",
    "name": "T2",
    "slug": "t2"
  },
  "variant": null,
  "dealer": {
    "id": "32e9c2a4-21eb-542e-aca0-171cff318090",
    "name": "Gys Pitzer Motors Wonderboom",
    "slug": "gys-pitzer-motors-wonderboom-fbook-3975",
    "logoUrl": null,
    "rating": null,
    "plan": "BASIC",
    "phone": "072 261 4084",
    "email": "feed-dealer-3975@example.invalid",
    "website": null,
    "address": "803 Steve Biko Rd, Gezina, Pretoria",
    "city": "Gezina",
    "province": "GAUTENG"
  },
  "branch": {
    "id": "df72d6c4-7449-526a-a5e2-04bc3271dc3f",
    "name": "Gys Pitzer Motors Wonderboom",
    "address": "803 Steve Biko Rd, Gezina, Pretoria",
    "city": "Gezina",
    "province": "GAUTENG",
    "phone": "072 261 4084",
    "email": null,
    "latitude": -25.71778,
    "longitude": 28.20972,
    "operatingHours": null
  },
  "categories": [
    {
      "slug": "suvs",
      "name": "SUVs"
    }
  ],
  "promotion": null,
  "description": "Buy with confidence from Gys Pitzer Motors Wonderboom, a reputable dealer brought to you by CHANGECARS",
  "latitude": -25.71778,
  "longitude": 28.20972,
  "generation": null,
  "images": [
    {
      "id": "3f48d259-ca84-5bd0-a9c6-bf1e5913ccb5",
      "url": "/media/fbook/1538255-1.jpg",
      "thumbnailUrl": null,
      "mediumUrl": null,
      "largeUrl": null,
      "width": null,
      "height": null,
      "altText": "2026 JETOUR T2 2.0T ODYSSEY",
      "isPrimary": true
    }
  ],
  "availability": "AVAILABLE",
  "effectivePrice": 669900,
  "monthlyPrice": 13272,
  "formattedMonthlyPrice": "R 13 272 pm",
  "discount": null,
  "features": [],
  "location": {
    "city": "Gezina",
    "province": "GAUTENG",
    "address": "803 Steve Biko Rd, Gezina, Pretoria",
    "latitude": -25.71778,
    "longitude": 28.20972,
    "country": "South Africa"
  },
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
  "additionalInformation": "Buy with confidence from Gys Pitzer Motors Wonderboom, a reputable dealer brought to you by CHANGECARS",
  "moreFromThisDealer": [
    {
      "id": "c5bd4623-4886-591c-a588-e88ddabe2d37",
      "slug": "2022-volvo-xc90-d5-r-design-awd-fbook-1538353",
      "title": "2022 VOLVO XC90 D5 R-DESIGN AWD",
      "condition": "USED",
      "status": "PUBLISHED",
      "year": 2022,
      "mileage": 117169,
      "price": 629900,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "UNKNOWN",
      "fuelType": "OTHER",
      "drivetrain": null,
      "colour": "Silver",
      "engineCapacityCc": null,
      "powerKw": null,
      "cylinders": null,
      "seats": null,
      "doors": null,
      "province": "GAUTENG",
      "city": "Gezina",
      "primaryImageUrl": "/media/fbook/1538353-1.jpg",
      "imageCount": 1,
      "viewCount": 0,
      "publishedAt": "2026-10-08T22:19:57.539Z",
      "reservedUntil": null,
      "make": {
        "id": "01a11d97-e9df-7108-8437-58e3ff6285b2",
        "name": "Volvo",
        "slug": "volvo"
      },
      "model": {
        "id": "01a11d97-e9ea-75ed-adae-cd4acb679fdf",
        "name": "XC90",
        "slug": "xc90"
      },
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
      "categories": [
        {
          "slug": "suvs",
          "name": "SUVs"
        }
      ],
      "promotion": null,
      "availability": "AVAILABLE",
      "effectivePrice": 629900,
      "monthlyPrice": 12479,
      "formattedMonthlyPrice": "R 12 479 pm",
      "discount": null
    },
    {
      "id": "e45c3d33-c85d-5524-a42d-2d9285559586",
      "slug": "2025-jaecoo-j7-1-6t-inferno-awd-fbook-1538252",
      "title": "2025 JAECOO J7 1.6T INFERNO AWD",
      "condition": "USED",
      "status": "PUBLISHED",
      "year": 2025,
      "mileage": 27187,
      "price": 499900,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "UNKNOWN",
      "fuelType": "OTHER",
      "drivetrain": null,
      "colour": "Black",
      "engineCapacityCc": null,
      "powerKw": null,
      "cylinders": null,
      "seats": null,
      "doors": null,
      "province": "GAUTENG",
      "city": "Gezina",
      "primaryImageUrl": "/media/fbook/1538252-1.jpg",
      "imageCount": 1,
      "viewCount": 2,
      "publishedAt": "2026-10-08T22:19:57.538Z",
      "reservedUntil": null,
      "make": {
        "id": "01a11d97-e87a-7478-b543-0ebae9b61678",
        "name": "Jaecoo",
        "slug": "jaecoo"
      },
      "model": {
        "id": "01a11d97-e87c-728b-bbb3-930744070da6",
        "name": "J7",
        "slug": "j7"
      },
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
      "categories": [
        {
          "slug": "suvs",
          "name": "SUVs"
        }
      ],
      "promotion": null,
      "availability": "AVAILABLE",
      "effectivePrice": 499900,
      "monthlyPrice": 9904,
      "formattedMonthlyPrice": "R 9 904 pm",
      "discount": null
    },
    {
      "id": "aa9990f0-df83-5ef1-a8e9-b139aaccbd65",
      "slug": "2021-volvo-xc60-d4-awd-momentum-fbook-1538352",
      "title": "2021 Volvo XC60 D4 AWD Momentum",
      "condition": "USED",
      "status": "PUBLISHED",
      "year": 2021,
      "mileage": 63162,
      "price": 539900,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "UNKNOWN",
      "fuelType": "OTHER",
      "drivetrain": null,
      "colour": "White",
      "engineCapacityCc": null,
      "powerKw": null,
      "cylinders": null,
      "seats": null,
      "doors": null,
      "province": "GAUTENG",
      "city": "Gezina",
      "primaryImageUrl": "/media/fbook/1538352-1.jpg",
      "imageCount": 1,
      "viewCount": 0,
      "publishedAt": "2026-10-08T22:19:57.533Z",
      "reservedUntil": null,
      "make": {
        "id": "01a11d97-e9df-7108-8437-58e3ff6285b2",
        "name": "Volvo",
        "slug": "volvo"
      },
      "model": {
        "id": "01a11d97-e9e6-752b-81fc-790660f85577",
        "name": "XC60",
        "slug": "xc60"
      },
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
      "categories": [
        {
          "slug": "suvs",
          "name": "SUVs"
        }
      ],
      "promotion": null,
      "availability": "AVAILABLE",
      "effectivePrice": 539900,
      "monthlyPrice": 10696,
      "formattedMonthlyPrice": "R 10 696 pm",
      "discount": null
    },
    {
      "id": "b1c34d97-043c-5339-ac06-4d329f2a4bcb",
      "slug": "2022-volkswagen-caravelle-6-1-2-0-bitdi-highline-dsg-4motion-146kw-fbook-1538350",
      "title": "2022 Volkswagen Caravelle 6.1 2.0 BiTDI Highline DSG 4Motion (146KW)",
      "condition": "USED",
      "status": "PUBLISHED",
      "year": 2022,
      "mileage": 48364,
      "price": 1049900,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "UNKNOWN",
      "fuelType": "OTHER",
      "drivetrain": null,
      "colour": "Charcoal",
      "engineCapacityCc": null,
      "powerKw": null,
      "cylinders": null,
      "seats": null,
      "doors": null,
      "province": "GAUTENG",
      "city": "Gezina",
      "primaryImageUrl": "/media/fbook/1538350-1.jpg",
      "imageCount": 1,
      "viewCount": 0,
      "publishedAt": "2026-10-08T22:19:57.531Z",
      "reservedUntil": null,
      "make": {
        "id": "01a11d8e-48aa-71fe-9d92-62be71a46f45",
        "name": "Volkswagen",
        "slug": "volkswagen"
      },
      "model": {
        "id": "01a11d97-e937-73ed-860b-c2b87a0267f2",
        "name": "Caravelle",
        "slug": "caravelle"
      },
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
      "categories": [
        {
          "slug": "panel-vans",
          "name": "Panel Vans"
        }
      ],
      "promotion": null,
      "availability": "AVAILABLE",
      "effectivePrice": 1049900,
      "monthlyPrice": 20800,
      "formattedMonthlyPrice": "R 20 800 pm",
      "discount": null
    },
    {
      "id": "b15687b7-aa18-57c9-a3c1-c975a893f5c6",
      "slug": "2016-volkswagen-t6-caravelle-2-0-bitdi-highline-dsg-4-motion-fbook-1538344",
      "title": "2016 VOLKSWAGEN T6 CARAVELLE 2.0 BiTDi HIGHLINE DSG 4 MOTION",
      "condition": "USED",
      "status": "PUBLISHED",
      "year": 2016,
      "mileage": 234482,
      "price": 439900,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "UNKNOWN",
      "fuelType": "OTHER",
      "drivetrain": null,
      "colour": "Red",
      "engineCapacityCc": null,
      "powerKw": null,
      "cylinders": null,
      "seats": null,
      "doors": null,
      "province": "GAUTENG",
      "city": "Gezina",
      "primaryImageUrl": "/media/fbook/1538344-1.jpg",
      "imageCount": 1,
      "viewCount": 0,
      "publishedAt": "2026-10-08T22:19:57.527Z",
      "reservedUntil": null,
      "make": {
        "id": "01a11d8e-48aa-71fe-9d92-62be71a46f45",
        "name": "Volkswagen",
        "slug": "volkswagen"
      },
      "model": {
        "id": "01a11d97-e937-73ed-860b-c2b87a0267f2",
        "name": "Caravelle",
        "slug": "caravelle"
      },
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
      "categories": [
        {
          "slug": "panel-vans",
          "name": "Panel Vans"
        }
      ],
      "promotion": null,
      "availability": "AVAILABLE",
      "effectivePrice": 439900,
      "monthlyPrice": 8715,
      "formattedMonthlyPrice": "R 8 715 pm",
      "discount": null
    },
    {
      "id": "6a3a77b8-e209-5c48-ad02-dc3abe66a7ee",
      "slug": "2023-volkswagen-tiguan-2-0-tsi-r-line-4motion-dsg-162kw-fbook-1538348",
      "title": "2023 VOLKSWAGEN TIGUAN 2.0 TSI R-LINE 4MOTION DSG (162KW)",
      "condition": "USED",
      "status": "PUBLISHED",
      "year": 2023,
      "mileage": 25657,
      "price": 639900,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "UNKNOWN",
      "fuelType": "OTHER",
      "drivetrain": null,
      "colour": "White",
      "engineCapacityCc": null,
      "powerKw": null,
      "cylinders": null,
      "seats": null,
      "doors": null,
      "province": "GAUTENG",
      "city": "Gezina",
      "primaryImageUrl": "/media/fbook/1538348-1.jpg",
      "imageCount": 1,
      "viewCount": 0,
      "publishedAt": "2026-10-08T22:19:57.522Z",
      "reservedUntil": null,
      "make": {
        "id": "01a11d8e-48aa-71fe-9d92-62be71a46f45",
        "name": "Volkswagen",
        "slug": "volkswagen"
      },
      "model": {
        "id": "01a11d97-e8b3-757a-8230-f26a4b2c7101",
        "name": "Tiguan",
        "slug": "tiguan"
      },
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
      "categories": [
        {
          "slug": "suvs",
          "name": "SUVs"
        }
      ],
      "promotion": null,
      "availability": "AVAILABLE",
      "effectivePrice": 639900,
      "monthlyPrice": 12677,
      "formattedMonthlyPrice": "R 12 677 pm",
      "discount": null
    }
  ],
  "youMightLike": [
    {
      "id": "00ba89a5-f76c-58d6-a51a-03689bc4bee7",
      "slug": "2026-jetour-t2-2-0t-dark-night-fbook-1500345",
      "title": "2026 JETOUR T2 2.0T DARK NIGHT",
      "condition": "NEW",
      "status": "PUBLISHED",
      "year": 2026,
      "mileage": 6,
      "price": 704900,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "UNKNOWN",
      "fuelType": "OTHER",
      "drivetrain": null,
      "colour": "MATT BLACK",
      "engineCapacityCc": null,
      "powerKw": null,
      "cylinders": null,
      "seats": null,
      "doors": null,
      "province": "GAUTENG",
      "city": "Waterfall",
      "primaryImageUrl": "/media/fbook/1500345-1.jpg",
      "imageCount": 1,
      "viewCount": 0,
      "publishedAt": "2026-10-08T22:19:42.087Z",
      "reservedUntil": null,
      "make": {
        "id": "01a11d97-e859-7128-b2fe-552a51e1a870",
        "name": "Jetour",
        "slug": "jetour"
      },
      "model": {
        "id": "01a11d97-e85f-77fb-af85-fbfb3c862923",
        "name": "T2",
        "slug": "t2"
      },
      "variant": null,
      "dealer": {
        "id": "bcdd1692-3c9f-5ffd-a962-9445ae3db94f",
        "name": "Jetour Rustenburg",
        "slug": "jetour-rustenburg-fbook-3649",
        "logoUrl": null,
        "rating": null,
        "plan": "BASIC"
      },
      "branch": {
        "id": "007f67f0-4065-51ed-ac23-9118821dcabc",
        "name": "Jetour Rustenburg",
        "city": "Waterfall",
        "province": "GAUTENG"
      },
      "categories": [
        {
          "slug": "suvs",
          "name": "SUVs"
        }
      ],
      "promotion": null,
      "availability": "AVAILABLE",
      "effectivePrice": 704900,
      "monthlyPrice": 13965,
      "formattedMonthlyPrice": "R 13 965 pm",
      "discount": null
    },
    {
      "id": "018e5591-8e28-5676-a50d-32fea94c943f",
      "slug": "jetour-t2-2-0t-odyssey-fbook-1506337",
      "title": "JETOUR T2 2.0T ODYSSEY",
      "condition": "NEW",
      "status": "PUBLISHED",
      "year": null,
      "mileage": 50,
      "price": 679900,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "UNKNOWN",
      "fuelType": "OTHER",
      "drivetrain": null,
      "colour": "Glacier White",
      "engineCapacityCc": null,
      "powerKw": null,
      "cylinders": null,
      "seats": null,
      "doors": null,
      "province": "WESTERN_CAPE",
      "city": "Durbanville",
      "primaryImageUrl": "/media/fbook/1506337-1.jpg",
      "imageCount": 1,
      "viewCount": 0,
      "publishedAt": "2026-10-08T22:19:37.338Z",
      "reservedUntil": null,
      "make": {
        "id": "01a11d97-e859-7128-b2fe-552a51e1a870",
        "name": "Jetour",
        "slug": "jetour"
      },
      "model": {
        "id": "01a11d97-e85f-77fb-af85-fbfb3c862923",
        "name": "T2",
        "slug": "t2"
      },
      "variant": null,
      "dealer": {
        "id": "05b4c69f-b236-597d-a404-17e108d6aef3",
        "name": "Jetour Tygervalley",
        "slug": "jetour-tygervalley-fbook-3514",
        "logoUrl": null,
        "rating": null,
        "plan": "BASIC"
      },
      "branch": {
        "id": "ae34ebc2-e0de-572e-a745-e76f9701db64",
        "name": "Jetour Tygervalley",
        "city": "Durbanville",
        "province": "WESTERN_CAPE"
      },
      "categories": [
        {
          "slug": "suvs",
          "name": "SUVs"
        }
      ],
      "promotion": null,
      "availability": "AVAILABLE",
      "effectivePrice": 679900,
      "monthlyPrice": 13470,
      "formattedMonthlyPrice": "R 13 470 pm",
      "discount": null
    },
    {
      "id": "01fa0faa-10d5-5e83-aba9-b36c891d40bb",
      "slug": "2026-jetour-t2-odyssey-2-0td-7dct-4wd-fbook-1324950",
      "title": "2026 Jetour T2 Odyssey 2.0TD+7DCT 4WD",
      "condition": "NEW",
      "status": "PUBLISHED",
      "year": 2026,
      "mileage": 91,
      "price": 769900,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "UNKNOWN",
      "fuelType": "OTHER",
      "drivetrain": null,
      "colour": "Black",
      "engineCapacityCc": null,
      "powerKw": null,
      "cylinders": null,
      "seats": null,
      "doors": null,
      "province": "GAUTENG",
      "city": "Pretoria",
      "primaryImageUrl": "/media/fbook/1324950-1.jpg",
      "imageCount": 1,
      "viewCount": 0,
      "publishedAt": "2026-10-08T22:19:03.319Z",
      "reservedUntil": null,
      "make": {
        "id": "01a11d97-e859-7128-b2fe-552a51e1a870",
        "name": "Jetour",
        "slug": "jetour"
      },
      "model": {
        "id": "01a11d97-e85f-77fb-af85-fbfb3c862923",
        "name": "T2",
        "slug": "t2"
      },
      "variant": null,
      "dealer": {
        "id": "0c10b5a3-6d38-5b63-aa8b-75eada2adb97",
        "name": "Mit Mak Motors",
        "slug": "mit-mak-motors-fbook-2478",
        "logoUrl": null,
        "rating": null,
        "plan": "BASIC"
      },
      "branch": {
        "id": "f8fb3785-71a0-51f0-a2ce-df6ce7a305ce",
        "name": "Mit Mak Motors",
        "city": "Pretoria",
        "province": "GAUTENG"
      },
      "categories": [
        {
          "slug": "suvs",
          "name": "SUVs"
        }
      ],
      "promotion": null,
      "availability": "AVAILABLE",
      "effectivePrice": 769900,
      "monthlyPrice": 15253,
      "formattedMonthlyPrice": "R 15 253 pm",
      "discount": null
    },
    {
      "id": "027db10a-4da9-50e8-a4e6-7937c8788283",
      "slug": "2026-jetour-t2-odyssey-2-0td-7dct-4wd-fbook-1334577",
      "title": "2026 Jetour T2 Odyssey 2.0TD+7DCT 4WD",
      "condition": "NEW",
      "status": "PUBLISHED",
      "year": 2026,
      "mileage": 0,
      "price": 704900,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "UNKNOWN",
      "fuelType": "OTHER",
      "drivetrain": null,
      "colour": "Black",
      "engineCapacityCc": null,
      "powerKw": null,
      "cylinders": null,
      "seats": null,
      "doors": null,
      "province": "GAUTENG",
      "city": "Oakdene",
      "primaryImageUrl": "/media/fbook/1334577-1.jpg",
      "imageCount": 1,
      "viewCount": 0,
      "publishedAt": "2026-10-08T22:19:51.659Z",
      "reservedUntil": null,
      "make": {
        "id": "01a11d97-e859-7128-b2fe-552a51e1a870",
        "name": "Jetour",
        "slug": "jetour"
      },
      "model": {
        "id": "01a11d97-e85f-77fb-af85-fbfb3c862923",
        "name": "T2",
        "slug": "t2"
      },
      "variant": null,
      "dealer": {
        "id": "4a70d2c1-8f40-53da-abb6-00381f63dc7c",
        "name": "Jetour The Glen",
        "slug": "jetour-the-glen-fbook-3825",
        "logoUrl": null,
        "rating": null,
        "plan": "BASIC"
      },
      "branch": {
        "id": "94da4adf-1ea4-5a85-a305-b4cc558b249f",
        "name": "Jetour The Glen",
        "city": "Oakdene",
        "province": "GAUTENG"
      },
      "categories": [
        {
          "slug": "suvs",
          "name": "SUVs"
        }
      ],
      "promotion": null,
      "availability": "AVAILABLE",
      "effectivePrice": 704900,
      "monthlyPrice": 13965,
      "formattedMonthlyPrice": "R 13 965 pm",
      "discount": null
    },
    {
      "id": "039f0546-41e3-529d-ae9b-487f439feac0",
      "slug": "jetour-t2-2-0t-odyssey-fbook-1420688",
      "title": "JETOUR T2 2.0T ODYSSEY",
      "condition": "NEW",
      "status": "PUBLISHED",
      "year": null,
      "mileage": 5,
      "price": 679900,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "UNKNOWN",
      "fuelType": "OTHER",
      "drivetrain": null,
      "colour": "Glacier White",
      "engineCapacityCc": null,
      "powerKw": null,
      "cylinders": null,
      "seats": null,
      "doors": null,
      "province": "WESTERN_CAPE",
      "city": "Durbanville",
      "primaryImageUrl": "/media/fbook/1420688-1.jpg",
      "imageCount": 1,
      "viewCount": 0,
      "publishedAt": "2026-10-08T22:19:37.327Z",
      "reservedUntil": null,
      "make": {
        "id": "01a11d97-e859-7128-b2fe-552a51e1a870",
        "name": "Jetour",
        "slug": "jetour"
      },
      "model": {
        "id": "01a11d97-e85f-77fb-af85-fbfb3c862923",
        "name": "T2",
        "slug": "t2"
      },
      "variant": null,
      "dealer": {
        "id": "05b4c69f-b236-597d-a404-17e108d6aef3",
        "name": "Jetour Tygervalley",
        "slug": "jetour-tygervalley-fbook-3514",
        "logoUrl": null,
        "rating": null,
        "plan": "BASIC"
      },
      "branch": {
        "id": "ae34ebc2-e0de-572e-a745-e76f9701db64",
        "name": "Jetour Tygervalley",
        "city": "Durbanville",
        "province": "WESTERN_CAPE"
      },
      "categories": [
        {
          "slug": "suvs",
          "name": "SUVs"
        }
      ],
      "promotion": null,
      "availability": "AVAILABLE",
      "effectivePrice": 679900,
      "monthlyPrice": 13470,
      "formattedMonthlyPrice": "R 13 470 pm",
      "discount": null
    },
    {
      "id": "08a7df0c-3510-50bf-a1d3-0b427a0cb009",
      "slug": "2026-jetour-t2-i-dm-1-5t-phev-fbook-1510482",
      "title": "2026 JETOUR T2 i-DM 1.5T (PHEV)",
      "condition": "NEW",
      "status": "PUBLISHED",
      "year": 2026,
      "mileage": 0,
      "price": 749900,
      "specialPrice": null,
      "isSpecial": false,
      "isFeatured": false,
      "transmission": "UNKNOWN",
      "fuelType": "OTHER",
      "drivetrain": null,
      "colour": "TITAN SILVER",
      "engineCapacityCc": null,
      "powerKw": null,
      "cylinders": null,
      "seats": null,
      "doors": null,
      "province": "FREE_STATE",
      "city": "Bethlehem",
      "primaryImageUrl": "/media/fbook/1510482-1.jpg",
      "imageCount": 1,
      "viewCount": 0,
      "publishedAt": "2026-10-08T22:18:42.731Z",
      "reservedUntil": null,
      "make": {
        "id": "01a11d97-e859-7128-b2fe-552a51e1a870",
        "name": "Jetour",
        "slug": "jetour"
      },
      "model": {
        "id": "01a11d97-e85f-77fb-af85-fbfb3c862923",
        "name": "T2",
        "slug": "t2"
      },
      "variant": null,
      "dealer": {
        "id": "3265801f-5246-5121-ad67-9666e4a3391d",
        "name": "Morgan Motor Group Bethlehem - Nissan/Jetour/Suzuki/BYD",
        "slug": "morgan-motor-group-bethlehem-nissan-jetour-suzuki-byd-fbook-26",
        "logoUrl": null,
        "rating": null,
        "plan": "BASIC"
      },
      "branch": {
        "id": "27669470-89be-5d78-aec7-1f4b579d9db2",
        "name": "Morgan Motor Group Bethlehem - Nissan/Jetour/Suzuki/BYD",
        "city": "Bethlehem",
        "province": "FREE_STATE"
      },
      "categories": [
        {
          "slug": "suvs",
          "name": "SUVs"
        }
      ],
      "promotion": null,
      "availability": "AVAILABLE",
      "effectivePrice": 749900,
      "monthlyPrice": 14856,
      "formattedMonthlyPrice": "R 14 856 pm",
      "discount": null
    }
  ],
  "finance": {
    "vehiclePrice": 669900,
    "deposit": 66990,
    "financeAmount": 602910,
    "balloonAmount": 0,
    "termMonths": 72,
    "annualInterestRate": 11.75,
    "monthlyRepayment": 11708.77,
    "totalRepayment": 843031.55,
    "totalInterest": 240121.55
  },
  "canEnquire": true
}
```

## Mobile screen field mapping

| Screen section | Response field | Notes |
|---|---|---|
| Map | `mapDetails` | Address, city, province, country, latitude, longitude, `googleMapsUrl`, `embedUrl`. |
| Location label | `location` | Same location data without the map URLs. Province uses an enum such as `GAUTENG`. |
| Additional info | `additionalInformation` | Dealer-provided description; same content as `description`, or `null` when absent. |
| More from this dealer | `moreFromThisDealer` | Up to 6 other published/reserved cars from this approved dealer. Current car excluded. |
| You might like this | `youMightLike` | Up to 6 cars. Same model first; remaining slots use the same body category within 25% of asking price. Current car and duplicates excluded; only approved dealers and public stock. |
| Photo gallery | `images` | Image objects with `url`, optional size-specific URLs, `altText`, and `isPrimary`. |
| Main photo | `primaryImageUrl` | Also available on recommendation cards. |
| Vehicle specs | `year`, `mileage`, `transmission`, `fuelType`, `drivetrain`, `colour`, `engineCapacityCc`, `powerKw`, `cylinders`, `seats`, `doors`, `categories`, `variant` | Preserve null/unknown values; do not fabricate specifications. |
| Dealer contact | `dealer`, `branch` | Dealer phone/address and optional contact/location details. |
| Features | `features` | Resolved feature array; may be empty. |
| Price | `price`, `specialPrice`, `effectivePrice`, `discount` | Numeric whole rand (ZAR). `effectivePrice` is the display price. |
| Monthly price label | `monthlyPrice`, `formattedMonthlyPrice` | Display estimate. `finance` provides a separate calculation and its explicit assumptions; values may differ. |
| Finance | `finance` | Calculation object, or `null` for sold cars. |
| Enquiry button | `canEnquire` | Boolean; false for sold cars. |

## Missing data and images

- `moreFromThisDealer` and `youMightLike` are `[]` if no matches exist. They are bounded suggestions, not the entire dealer inventory.
- `latitude` and `longitude` can be `null`. Map URLs use coordinates when both exist, otherwise the address, then city/country.
- Missing year/mileage/specifications can be `null`; transmission can be `UNKNOWN`, and fuel can be `OTHER`.
- Image URLs beginning with `/` are relative to the website/media host. For this local setup, resolve them against `http://localhost:3000`, not the API host. Production apps should configure their media base URL.
- `/img/feed-image-unavailable.png` is the local placeholder for unavailable original photos.
- Examples are sample responses; optional fields can be null and list lengths can vary.

## Not found response — HTTP 404

An unknown or non-public vehicle, or stock belonging to a non-approved dealer, is not returned. Error values such as timestamp and request ID change per request.

```json
{
  "statusCode": 404,
  "code": "VEHICLE_NOT_FOUND",
  "message": "Vehicle not found",
  "requestId": "055f96c4-d50b-4b6b-954b-52a51b992e62",
  "timestamp": "2026-10-09T16:00:47.638Z",
  "path": "/api/v1/vehicles/00000000-0000-4000-8000-000000000000"
}
```

Other possible responses include authentication errors for invalid supplied tokens, rate-limit errors, and server errors. Use `statusCode`, `code`, and `message` to handle failures.
