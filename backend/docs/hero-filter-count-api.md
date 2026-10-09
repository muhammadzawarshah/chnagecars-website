# Vehicle Filter Count API (Hero Bar & Search Filters)

This API provides the real-time count of vehicles matching any selected dropdown or filter criteria from the hero bar or search modal. It is specifically designed for mobile app developers to replace static numbers (e.g. `"Search 36 533 Cars"`) with dynamic, live counts that update instantaneously whenever an option changes.

---

## 1. Endpoints

### Base URLs
- **Production:** `https://chnagecars-website-production.up.railway.app`
- **Local Development:** `http://localhost:4000`

### Methods & Paths

| Method | Path | Usage |
|--------|------|-------|
| `POST` | `/api/v1/vehicles/count` | **Recommended for mobile apps.** Send selected filters in a JSON request body. |
| `GET`  | `/api/v1/vehicles/count` | Send selected filters as query parameters. |
| `POST` | `/api/v1/web/cars/count` | Website adapter endpoint (accepts `WebCarSearch` format). |
| `GET`  | `/api/v1/web/cars/count` | Website adapter query parameter endpoint. |

- **Authentication:** None required (Public endpoint).
- **Caching:** Responses are cached for 30–60 seconds on the server and automatically invalidated when vehicle inventory updates.

---

## 2. Hero Bar Dropdowns & Filter Mapping

Every dropdown in the hero bar maps directly to a field in this API:

| Hero Bar Dropdown / Filter | JSON Body Key / Query Param | Type | Example / Allowed Values |
|-----------------------------|-----------------------------|------|---------------------------|
| **Cash / Max Price** | `maxPrice` | `integer` | `10000`, `50000`, `250000`, `500000` |
| **Cash / Min Price** | `minPrice` | `integer` | `5000`, `10000`, `100000` |
| **Min Year** | `minYear` | `integer` | `1980` – `2026` (e.g. `2018`) |
| **Max Year** | `maxYear` | `integer` | `1980` – `2026` (e.g. `2024`) |
| **Min Mileage (Km)** | `minMileage` | `integer` | `0`, `10000`, `50000` |
| **Max Mileage (Km)** | `maxMileage` | `integer` | `10000`, `100000`, `200000` |
| **Make** | `make` | `string` | Comma-separated slugs: `toyota`, `bmw`, `volkswagen` |
| **Model** | `model` | `string` | Scoped (`toyota:corolla`) or generic (`corolla`) |
| **Variant** | `variant` | `string` | Variant slug: `320i-m-sport-2022`, `2-8gd-6-raider` |
| **Body Type / Category** | `category` | `string` | `suvs`, `bakkies`, `hatchbacks`, `sedans`, `coupes` |
| **Transmission** | `transmission` | `string` | `AUTOMATIC`, `MANUAL` |
| **Fuel Type** | `fuelType` | `string` | `PETROL`, `DIESEL`, `HYBRID`, `ELECTRIC`, `PLUGIN_HYBRID` |
| **Drivetrain** | `drivetrain` | `string` | `FOUR_X_FOUR`, `FOUR_X_TWO`, `AWD`, `FWD`, `RWD` |
| **Province** | `province` | `string` | `GAUTENG`, `WESTERN_CAPE`, `KWAZULU_NATAL`, etc. |
| **City** | `city` | `string` | `Johannesburg`, `Cape Town`, `Pretoria`, `Durban` |
| **Condition** | `condition` | `string` | `NEW`, `USED`, `DEMO` |
| **Colour** | `colour` | `string` | `White`, `Black`, `Silver`, `Grey`, `Blue`, `Red` |
| **Specials Only** | `onSpecial` | `boolean` | `true` or `false` |
| **Featured Only** | `featured` | `boolean` | `true` or `false` |
| **Available Only** | `availableOnly` | `boolean` | `true` (excludes reserved vehicles) |
| **Free text search** | `q` | `string` | `ranger wildtrak`, `golf 8 r` |

---

## 3. Complete JSON Input Specification (`POST /api/v1/vehicles/count`)

### Request Headers
```http
Content-Type: application/json
Accept: application/json
```

### Full JSON Input Schema

```json
{
  "minPrice": 10000,
  "maxPrice": 500000,
  "minYear": 2018,
  "maxYear": 2024,
  "minMileage": 0,
  "maxMileage": 100000,
  "make": "toyota,bmw",
  "model": "toyota:hilux,bmw:3-series",
  "variant": "2-8gd-6-legend-rs",
  "category": "bakkies,suvs",
  "condition": "USED,DEMO",
  "fuelType": "DIESEL",
  "transmission": "AUTOMATIC",
  "drivetrain": "FOUR_X_FOUR",
  "province": "GAUTENG",
  "city": "Pretoria",
  "colour": "White",
  "onSpecial": false,
  "featured": false,
  "availableOnly": true,
  "q": "legend"
}
```

*Note: All fields are optional. Passing an empty JSON `{}` returns the total count of all vehicles listed across the platform.*

---

## 4. Complete JSON Output Specification

### Response `200 OK`

```json
{
  "total": 35,
  "count": 35,
  "formatted": "35"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `total` | `integer` | The exact number of vehicles matching the query. |
| `count` | `integer` | Duplicate of `total` for easy binding in mobile state. |
| `formatted` | `string` | Formatted string with spaces (e.g. `"36 533"` or `"10 000"`), ready to display on the search button: `Search ${formatted} Cars`. |

---

## 5. Complete JSON Input & Output Examples

### Example 1: Default State (No Filters Selected)
When the user first opens the app and hasn't touched any dropdown:

#### Input:
```json
{}
```

#### Output:
```json
{
  "total": 30011,
  "count": 30011,
  "formatted": "30 011"
}
```
*UI Button:* `"Search 30 011 Cars"`

---

### Example 2: User Selects 10,000 Price in Dropdown
When the user selects `10,000` (e.g. cars up to R10,000 or from R10,000):

#### Input (Max Price = 10,000):
```json
{
  "maxPrice": 10000
}
```

#### Output:
```json
{
  "total": 14,
  "count": 14,
  "formatted": "14"
}
```
*UI Button:* `"Search 14 Cars"`

#### Input (Price Range: 10,000 to 100,000):
```json
{
  "minPrice": 10000,
  "maxPrice": 100000
}
```

#### Output:
```json
{
  "total": 1248,
  "count": 1248,
  "formatted": "1 248"
}
```
*UI Button:* `"Search 1 248 Cars"`

---

### Example 3: User Selects Make + Category (Toyota + SUVs)

#### Input:
```json
{
  "make": "toyota",
  "category": "suvs"
}
```

#### Output:
```json
{
  "total": 852,
  "count": 852,
  "formatted": "852"
}
```
*UI Button:* `"Search 852 Cars"`

---

### Example 4: Multi-Filter Combination (Hero Bar + More Filters)

#### Input:
```json
{
  "make": "volkswagen",
  "model": "volkswagen:polo",
  "minYear": 2020,
  "maxYear": 2024,
  "maxMileage": 60000,
  "transmission": "AUTOMATIC",
  "fuelType": "PETROL",
  "province": "GAUTENG"
}
```

#### Output:
```json
{
  "total": 128,
  "count": 128,
  "formatted": "128"
}
```
*UI Button:* `"Search 128 Cars"`

---

### Example 5: No Matching Vehicles (Zero Results)

#### Input:
```json
{
  "make": "ferrari",
  "maxPrice": 50000
}
```

#### Output:
```json
{
  "total": 0,
  "count": 0,
  "formatted": "0"
}
```
*UI Button:* `"Search 0 Cars"` (or `"No Cars Found"`)

---

### Example 6: Error Response `400 Bad Request` (Invalid Param Type)

#### Input:
```json
{
  "maxPrice": "invalid_number"
}
```

#### Output `400`:
```json
{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "details": [
    "maxPrice must be an integer number",
    "maxPrice must not be less than 0"
  ],
  "requestId": "4c3b1772-2ea9-42b4-a212-04e4c27a9da8",
  "timestamp": "2026-10-09T14:15:30.123Z",
  "path": "/api/v1/vehicles/count"
}
```

---

## 6. cURL Examples

### POST (JSON Body - Recommended)
```bash
curl -X POST 'https://chnagecars-website-production.up.railway.app/api/v1/vehicles/count' \
  -H 'Content-Type: application/json' \
  -d '{
    "maxPrice": 10000
  }'
```

### GET (Query Parameters)
```bash
curl -X GET 'https://chnagecars-website-production.up.railway.app/api/v1/vehicles/count?maxPrice=10000' \
  -H 'Accept: application/json'
```

---

## 7. Mobile App Code Snippets

### Flutter / Dart (with 250ms Debounce)

```dart
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

class VehicleCountService {
  static const String baseUrl = 'https://chnagecars-website-production.up.railway.app/api/v1';
  Timer? _debounceTimer;

  void fetchVehicleCount({
    required Map<String, dynamic> filters,
    required Function(int count, String formatted) onSuccess,
  }) {
    // Debounce rapid dropdown touches
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 250), () async {
      try {
        final url = Uri.parse('$baseUrl/vehicles/count');
        final response = await http.post(
          url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(filters),
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          onSuccess(data['total'] as int, data['formatted'] as String);
        }
      } catch (e) {
        print('Error fetching vehicle count: $e');
      }
    });
  }
}

// Usage in Dropdown onChanged:
// VehicleCountService().fetchVehicleCount(
//   filters: {'maxPrice': 10000},
//   onSuccess: (count, formatted) {
//     setState(() {
//       buttonText = 'Search $formatted Cars';
//     });
//   },
// );
```

---

### React Native / TypeScript (with Debounce)

```typescript
import { useState, useEffect, useRef } from 'react';

interface FilterCriteria {
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  make?: string;
  category?: string;
  transmission?: string;
  fuelType?: string;
}

export function useVehicleCount(filters: FilterCriteria) {
  const [total, setTotal] = useState<number>(30011);
  const [formatted, setFormatted] = useState<string>('30 011');
  const [loading, setLoading] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          'https://chnagecars-website-production.up.railway.app/api/v1/vehicles/count',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filters),
            signal: controller.signal,
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTotal(data.total);
          setFormatted(data.formatted);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch count:', error);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters]);

  return { total, formatted, loading };
}
```

---

### Swift / iOS (async/await)

```swift
import Foundation

struct VehicleCountResponse: Codable {
    let total: Int
    let count: Int
    let formatted: String
}

class VehicleCountService {
    static let shared = VehicleCountService()
    private let endpoint = URL(string: "https://chnagecars-website-production.up.railway.app/api/v1/vehicles/count")!

    func getCount(filters: [String: Any]) async throws -> VehicleCountResponse {
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: filters)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        return try JSONDecoder().decode(VehicleCountResponse.self, from: data)
    }
}
```

---

## 8. App Developer Checklist & Best Practices

1. **Debounce Inputs:** Add a 200–300 ms debounce when calling this API as the user scrolls through dropdown pickers (e.g. price picker, year slider) to prevent duplicate requests.
2. **Displaying Count:** Use the `formatted` string directly inside the search CTA button (e.g. `"Search " + data.formatted + " Cars"`).
3. **Reset Behavior:** When the user taps **"Clear Search"** or **"Reset"**, send `{}` to retrieve the full inventory count.
4. **Offline / Fallback:** If the network request fails, retain the previous number on the button rather than clearing or showing an error modal.
