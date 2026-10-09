# Car Details API (Vehicle Detail Page)

This API returns the complete details of a single vehicle listing for the vehicle detail screen in the mobile app and website. It includes full pricing, calculated monthly installment (`monthlyPrice`), full photo gallery, technical specs, dealership & branch contact information, operating hours, categorized features, and a sample finance breakdown.

---

## 1. Endpoints

### Base URLs
- **Production:** `https://chnagecars-website-production.up.railway.app`
- **Local Dev:** `http://localhost:4000`

### Methods & Paths

| Method | Path | Usage |
|--------|------|-------|
| `GET` | `/api/v1/vehicles/:slugOrId` | **Primary Mobile Endpoint.** Lookup by either vehicle UUID or SEO slug. |
| `GET` | `/api/v1/web/cars/:id` | Website adapter endpoint (returns site's `Car` schema). |
| `GET` | `/api/v1/vehicles/:id/similar` | Returns up to 6 similar vehicles (same model / body type). |
| `GET` | `/api/v1/vehicles/:id/dealer-vehicles`| Returns other listings from the same dealership branch. |
| `GET` | `/api/v1/vehicles/:id/market-price` | Returns average market asking price of comparable listings. |

- **Authentication:** Optional (`Authorization: Bearer <access_token>`). If the user is logged in, viewing the vehicle automatically adds it to their **Recently Viewed** list.
- **Cache-Control:** Cached for 5 minutes (`max-age=300`) and invalidated instantly upon price/status changes.

---

## 2. Primary Mobile Endpoint: `GET /api/v1/vehicles/:slugOrId`

### Path Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `slugOrId` | `string` | **Yes** | Vehicle UUID or URL-friendly slug. Both work interchangeably. | `45fde76f-86ed-54ef-ad21-5253fa05c384` or `2026-jetour-t2-2-0t-odyssey-fbook-1538255` |

### Headers
```http
Accept: application/json
Authorization: Bearer <token> (Optional - tracks recently viewed)
```

---

## 3. Complete JSON Output (`200 OK`)

```json
{
  "id": "45fde76f-86ed-54ef-ad21-5253fa05c384",
  "slug": "2026-jetour-t2-2-0t-odyssey-fbook-1538255",
  "title": "2026 JETOUR T2 2.0T ODYSSEY",
  "condition": "USED",
  "status": "PUBLISHED",
  "availability": "AVAILABLE",
  "year": 2026,
  "mileage": 14729,
  "price": 669900,
  "specialPrice": null,
  "effectivePrice": 669900,
  "monthlyPrice": 13247,
  "formattedMonthlyPrice": "R 13 247 pm",
  "discount": null,
  "isSpecial": false,
  "isFeatured": false,
  "transmission": "AUTOMATIC",
  "fuelType": "PETROL",
  "drivetrain": "FOUR_X_FOUR",
  "colour": "Green",
  "engineCapacityCc": 1998,
  "powerKw": 187,
  "cylinders": 4,
  "seats": 5,
  "doors": 5,
  "province": "GAUTENG",
  "city": "Gezina",
  "latitude": -25.7198,
  "longitude": 28.2104,
  "description": "Clean, low mileage Jetour T2 Odyssey in stunning green. Fully equipped with modern tech, panoramic sunroof, Apple CarPlay, balance of factory warranty and service plan.",
  "primaryImageUrl": "/media/fbook/1538255-1.jpg",
  "imageCount": 8,
  "viewCount": 142,
  "publishedAt": "2026-10-08T22:19:57.542Z",
  "reservedUntil": null,
  "canEnquire": true,
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
  "variant": {
    "id": "01a11d97-e862-73bc-954f-124b8932cf4a",
    "name": "2.0T Odyssey",
    "slug": "2-0t-odyssey",
    "specification": {
      "transmissionType": "7-speed DCT",
      "fuelConsumptionCombined": "8.8L/100km",
      "fuelTankCapacity": "70L",
      "acceleration0to100": "8.7s",
      "topSpeed": "180 km/h"
    }
  },
  "generation": {
    "id": "01a11d97-e85e-7700-a541-112233445566",
    "name": "1st Generation",
    "yearFrom": 2024,
    "yearTo": null
  },
  "categories": [
    {
      "slug": "suvs",
      "name": "SUVs"
    }
  ],
  "dealer": {
    "id": "32e9c2a4-21eb-542e-aca0-171cff318090",
    "name": "Gys Pitzer Motors Wonderboom",
    "slug": "gys-pitzer-motors-wonderboom-fbook-3975",
    "logoUrl": "https://storage.changecars.co.za/dealers/logos/gys-pitzer.png",
    "rating": 4.8,
    "plan": "PREMIUM",
    "phone": "+27 12 335 5555",
    "email": "sales@gyspitzer.co.za",
    "website": "https://www.gyspitzer.co.za",
    "address": "654 Voortrekkers Rd",
    "city": "Gezina",
    "province": "GAUTENG"
  },
  "branch": {
    "id": "df72d6c4-7449-526a-a5e2-04bc3271dc3f",
    "name": "Gys Pitzer Motors Wonderboom",
    "address": "654 Voortrekkers Rd, Gezina, Pretoria",
    "city": "Gezina",
    "province": "GAUTENG",
    "phone": "+27 12 335 5555",
    "email": "sales@gyspitzer.co.za",
    "latitude": -25.7198,
    "longitude": 28.2104,
    "operatingHours": [
      { "day": "Monday to Friday", "time": "08.00 – 17.30" },
      { "day": "Saturday", "time": "08.30 – 13.00" },
      { "day": "Sunday", "time": "Closed" },
      { "day": "Public holidays", "time": "Closed" }
    ]
  },
  "images": [
    {
      "id": "98e4d3a2-11c2-4029-bb32-901452ef3211",
      "url": "https://storage.changecars.co.za/vehicles/1538255-1.jpg",
      "thumbnailUrl": "https://storage.changecars.co.za/vehicles/thumbs/1538255-1.jpg",
      "mediumUrl": "https://storage.changecars.co.za/vehicles/med/1538255-1.jpg",
      "largeUrl": "https://storage.changecars.co.za/vehicles/large/1538255-1.jpg",
      "width": 1920,
      "height": 1080,
      "altText": "2026 JETOUR T2 Front Left",
      "isPrimary": true
    },
    {
      "id": "98e4d3a2-11c2-4029-bb32-901452ef3212",
      "url": "https://storage.changecars.co.za/vehicles/1538255-2.jpg",
      "thumbnailUrl": "https://storage.changecars.co.za/vehicles/thumbs/1538255-2.jpg",
      "mediumUrl": "https://storage.changecars.co.za/vehicles/med/1538255-2.jpg",
      "largeUrl": "https://storage.changecars.co.za/vehicles/large/1538255-2.jpg",
      "width": 1920,
      "height": 1080,
      "altText": "2026 JETOUR T2 Interior",
      "isPrimary": false
    }
  ],
  "features": [
    {
      "category": "Safety & Driver Assistance",
      "items": [
        "Anti-lock Braking System (ABS)",
        "Electronic Stability Control (ESC)",
        "Blind Spot Monitoring",
        "Lane Departure Warning",
        "Adaptive Cruise Control",
        "Surround View Camera (360°)"
      ]
    },
    {
      "category": "Comfort & Convenience",
      "items": [
        "Dual-Zone Climate Control",
        "Panoramic Sunroof",
        "Keyless Entry & Push-Button Start",
        "Heated Leather Seats",
        "Multi-function Steering Wheel"
      ]
    },
    {
      "category": "Audio & Technology",
      "items": [
        "15.6-inch Touchscreen Infotainment",
        "Apple CarPlay & Android Auto",
        "Wireless Smartphone Charger",
        "Sony Premium Sound System"
      ]
    }
  ],
  "finance": {
    "vehiclePrice": 669900,
    "deposit": 66990,
    "financeAmount": 602910,
    "balloonAmount": 0,
    "termMonths": 72,
    "annualInterestRate": 11.75,
    "monthlyRepayment": 11674.32,
    "totalRepayment": 840551.04,
    "totalInterest": 237641.04
  },
  "promotion": null
}
```

---

## 4. Key Fields Breakdown

### Pricing & Monthly Payment
- **`price`** `(number)`: Listed asking cash price in ZAR (Rands).
- **`specialPrice`** `(number | null)`: Discounted price if vehicle is marked on special.
- **`effectivePrice`** `(number)`: The final price customer pays (`specialPrice` if on special, otherwise `price`).
- **`monthlyPrice`** `(number)`: Calculated standard monthly instalment amount in Rands (e.g. `13247`).
- **`formattedMonthlyPrice`** `(string)`: Display-ready formatted string (e.g. `"R 13 247 pm"`).
- **`discount`** `(number | null)`: Savings amount if special is active.

### Vehicle Specifications
- **`engineCapacityCc`** `(number | null)`: Engine capacity in cubic centimetres (e.g. `1998` = 2.0L).
- **`powerKw`** `(number | null)`: Engine power output in kilowatts (e.g. `187`).
- **`drivetrain`** `(string | null)`: Drive system (`FOUR_X_FOUR`, `FOUR_X_TWO`, `AWD`, `FWD`, `RWD`).
- **`fuelType`** `(string)`: `PETROL`, `DIESEL`, `HYBRID`, `ELECTRIC`, `OTHER`.
- **`transmission`** `(string)`: `AUTOMATIC`, `MANUAL`, `UNKNOWN`.

### Dealership & Branch Contact
- **`dealer.phone`** & **`branch.phone`**: Call dealer directly from app button.
- **`dealer.email`** & **`branch.email`**: Send quote / lead enquiries.
- **`branch.operatingHours`**: Array of `{ day, time }` rows showing opening hours.
- **`branch.latitude`** & **`branch.longitude`**: Used to open Google Maps / Apple Maps directions.

### Photo Gallery
- **`images`**: Ordered image array (`isPrimary: true` image is index 0). Each image provides `thumbnailUrl`, `mediumUrl`, and high-resolution `largeUrl` for full-screen pinch-to-zoom carousels.

### Features & Finance Example
- **`features`**: Grouped list of vehicle equipment and specs.
- **`finance`**: Default finance projection based on 10% deposit, 72 months term, and South African prime lending rate (11.75%).

---

## 5. Website Adapter Endpoint: `GET /api/v1/web/cars/:id`

If using the website schema format:

### Request
```bash
curl 'https://chnagecars-website-production.up.railway.app/api/v1/web/cars/101'
```

### Response `200 OK`
```json
{
  "id": "101",
  "title": "2009 Toyota Land Cruiser VX 200 Limited Edition",
  "make": "Toyota",
  "model": "Land Cruiser",
  "year": 2009,
  "price": 1699000,
  "monthlyPrice": 33596,
  "formattedMonthlyPrice": "R 33 596 pm",
  "bodyType": "SUV",
  "fuel": "Petrol",
  "transmission": "Automatic",
  "drive": "4X4",
  "colour": "White",
  "engine": "4.6L",
  "mileage": 99000,
  "image": "/img/featured-cars/toyota-land-cruiser.jpg",
  "gallery": [
    "/img/featured-cars/toyota-land-cruiser.jpg",
    "/img/featured-cars/toyota-land-cruiser-2.jpg"
  ],
  "photoCount": 18,
  "dealer": {
    "id": "1",
    "name": "Dealer Name",
    "address": "654 Voortrekkers Rd, Gezina",
    "hours": [
      { "day": "Monday to Friday", "time": "08.00 – 17.00" },
      { "day": "Saturdays", "time": "08.30 – 13.00" },
      { "day": "Sundays", "time": "Closed" }
    ]
  },
  "location": "Gezina, Gauteng",
  "province": "Gauteng",
  "featured": true,
  "listedAt": "2026-08-01",
  "views": 184,
  "enquiries": 12
}
```

---

## 6. Related Endpoints (for Vehicle Detail Screen)

### Similar Cars: `GET /api/v1/vehicles/:id/similar?limit=6`
Returns comparable vehicles of similar body type or price category.

### Dealer's Other Cars: `GET /api/v1/vehicles/:id/dealer-vehicles?limit=6`
Returns other cars currently listed by this dealer.

### Market Price Valuation: `GET /api/v1/vehicles/:id/market-price`
Returns average market asking price for the same make, model, and year:
```json
{
  "price": 645000
}
```

---

## 7. cURL Examples

```bash
# 1. Fetch by vehicle UUID
curl 'https://chnagecars-website-production.up.railway.app/api/v1/vehicles/45fde76f-86ed-54ef-ad21-5253fa05c384'

# 2. Fetch by SEO Slug
curl 'https://chnagecars-website-production.up.railway.app/api/v1/vehicles/2026-jetour-t2-2-0t-odyssey-fbook-1538255'

# 3. Fetch with logged-in user (records Recently Viewed)
curl 'https://chnagecars-website-production.up.railway.app/api/v1/vehicles/45fde76f-86ed-54ef-ad21-5253fa05c384' \
  -H 'Authorization: Bearer <user_access_token>'
```

---

## 8. Mobile App Code Snippets

### Flutter / Dart

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class VehicleDetailService {
  static const String baseUrl = 'https://chnagecars-website-production.up.railway.app/api/v1';

  Future<Map<String, dynamic>?> fetchVehicleDetail(String slugOrId, {String? userToken}) async {
    final url = Uri.parse('$baseUrl/vehicles/$slugOrId');
    final headers = <String, String>{
      'Accept': 'application/json',
      if (userToken != null) 'Authorization': 'Bearer $userToken',
    };

    final response = await http.get(url, headers: headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else if (response.statusCode == 404) {
      print('Vehicle not found or sold');
      return null;
    }
    throw Exception('Failed to load vehicle detail: ${response.statusCode}');
  }
}

// In Flutter Widget:
// final car = await VehicleDetailService().fetchVehicleDetail(vehicleId);
// print('Price: R ${car['effectivePrice']}');
// print('Monthly: ${car['formattedMonthlyPrice']}'); // "R 13 247 pm"
```

---

### React Native / TypeScript

```typescript
export interface VehicleDetail {
  id: string;
  slug: string;
  title: string;
  year: number;
  mileage: number;
  price: number;
  effectivePrice: number;
  monthlyPrice: number;
  formattedMonthlyPrice: string;
  primaryImageUrl: string;
  images: Array<{
    id: string;
    url: string;
    largeUrl: string;
    thumbnailUrl: string;
  }>;
  dealer: {
    name: string;
    phone?: string;
    email?: string;
  };
  features: Array<{
    category: string;
    items: string[];
  }>;
}

export async function getVehicleDetail(slugOrId: string, token?: string): Promise<VehicleDetail> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(
    `https://chnagecars-website-production.up.railway.app/api/v1/vehicles/${slugOrId}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Vehicle not found (${response.status})`);
  }

  return response.json();
}
```

---

## 9. Error Responses

### `404 Not Found` (Vehicle Sold, Archived or Invalid ID)
```json
{
  "statusCode": 404,
  "code": "NOT_FOUND",
  "message": "Vehicle not found",
  "requestId": "92f76c31-b684-4861-8ff8-e6d628864f19",
  "timestamp": "2026-10-09T14:40:00.000Z",
  "path": "/api/v1/vehicles/unknown-id"
}
```
