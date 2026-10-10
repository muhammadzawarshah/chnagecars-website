# Mobile app filters

Use `GET /api/v1/vehicles` for results, `GET /api/v1/vehicles/count` for the Apply button count, and `GET /api/v1/vehicles/facets` for dropdown options and counts. These three endpoints accept the same filter query parameters. GET requests have no JSON body.

Different fields combine with AND; comma-separated choices within one field combine with OR. For example `make=audi&colour=Black,White&maxPrice=500000` means Audi AND (Black OR White) AND price <= 500000. Counts include only published/reserved cars from approved dealers; `availableOnly=true` excludes reserved cars.

## Calls

```http
GET /api/v1/vehicles/facets
GET /api/v1/vehicles/facets?make=audi
GET /api/v1/vehicles/facets?make=audi&model=audi:q3
GET /api/v1/vehicles/facets?make=ferrari&category=coupes&colour=Black,White
GET /api/v1/vehicles?make=audi&model=audi:q3&colour=Black,White&maxPrice=500000&page=1&pageSize=20
GET /api/v1/vehicles/count?make=audi&model=audi:q3&colour=Black,White&maxPrice=500000
```

Every time the selection changes, send the current filters to all three endpoints. For expanding a make, send that make along with other active criteria to facets and display its `models`. Select a model using its returned `value`, such as `audi:q3`. For variants, send the make and model and display `variants`.

Facets returns `total`, `makes`, `models`, `variants`, `colour`, `city`, `drivetrain`, `fuelType`, `transmission`, `province`, `condition`, `categories` and `ranges`. Every option has `count`. Makes/categories use `slug` and `name`; models include `make`, `slug`, `name`, and scoped `value`; variants include `make`, `model`, `slug`, `name`; enum options use `value`; colours use `value` and `name`. Use the exact returned slugs/enums in requests.

Counts reflect ALL supplied filters, including the currently selected field. Zero-count options are omitted. Reset removes filter parameters. Clear a dropdown removes only that field. When changing make, clear model/variant selections that belong to the previous make.

Supported filters: `q`, `make`, `model`, `variant`, `category`, `transmission`, `fuelType`, `drivetrain`, `province`, `city`, `condition`, `colour`, `minPrice`, `maxPrice`, `minYear`, `maxYear`, `minMileage`, `maxMileage`, `onSpecial`, `featured`, `availableOnly`.

The `/web/cars` website adapter has a different query contract (`fuel`, `drive`, `bodyType`, etc.). Do not send this mobile filter contract to that endpoint.

Missing source information is not inferred: imported cars with UNKNOWN transmission or OTHER fuel appear under those values; a filter for AUTOMATIC/DIESEL will not include them. Variants are empty when listings have no stored variant.

## Separate dropdown APIs

All routes below accept the same active filter query parameters and return `{ "total": 123, "options": [...] }`. Each option includes `count`. Counts reflect the supplied filters; no matches returns `total: 0`; transmission, fuel and drive endpoints retain allowed options with zero counts, while other dropdowns return an empty options array. UNKNOWN transmission and OTHER fuel are included when present in source data. Missing variants have no selectable option; known drive choices remain available with zero counts.

| Dropdown | Endpoint |
|---|---|
| Colours | `GET /api/v1/vehicles/filters/colours` |
| Makes | `GET /api/v1/vehicles/filters/makes` |
| Models for Audi | `GET /api/v1/vehicles/filters/models?make=audi` |
| Variants for Audi Q3 | `GET /api/v1/vehicles/filters/variants?make=audi&model=audi:q3` |
| Transmission and counts | `GET /api/v1/vehicles/filters/transmissions` |
| Fuel types and counts | `GET /api/v1/vehicles/filters/fuel-types` |
| Drive and counts | `GET /api/v1/vehicles/filters/drives` |

Selecting one filter or many uses the same Apply endpoint: `GET /api/v1/vehicles` with selected query parameters. Example: `?make=audi&model=audi:q3&colour=Black,White&transmission=AUTOMATIC&fuelType=DIESEL&drivetrain=AWD`. Refresh dropdowns by sending those same active parameters to their routes. Counts before Apply: `GET /api/v1/vehicles/count` with those parameters. Reset removes parameters.


## Seats, engine, kW and dealership filters

These filters already exist on the mobile `/vehicles`, `/vehicles/count`, `/vehicles/facets` and separate dropdown endpoints. Mobile parameter names differ from the website adapter:

| Filter | Mobile parameter | Example |
|---|---|---|
| Seats | `seats` | `5,7` or `8+` (encode plus as `%2B`) |
| Minimum engine capacity in cc | `minEngineCc` | `1000` |
| Maximum engine capacity in cc | `maxEngineCc` | `3000` |
| Minimum power in kW | `minPowerKw` | `50` |
| Maximum power in kW | `maxPowerKw` | `200` |
| Dealership | `dealer` | Dealer slug returned in `data[].dealer.slug` |

```http
GET /vehicles?seats=5,7
GET /vehicles?minEngineCc=1000&maxEngineCc=3000
GET /vehicles?minPowerKw=50&maxPowerKw=200
GET /vehicles?dealer=morgan-motor-group-bethlehem-nissan-jetour-suzuki-byd-fbook-26
GET /vehicles?make=audi&seats=5&minEngineCc=1000&maxPowerKw=200
```

Response car fields are `seats`, `engineCapacityCc`, `powerKw` and `dealer`. On imported feed listings, missing specifications are `null`; filtering by these specifications excludes missing values. Live checks returned zero for seats/engine/kW examples and 81 cars for the example dealership (counts may change). This is missing source data, not an absent API filter. Seats/engine/kW/dealership options and counts are included in the combined `/vehicles/facets` response.

The website adapter uses `minEngine`, `maxEngine`, `minKw`, `maxKw`, and `dealership`; use the mobile names above with `/vehicles`.


## Complete dependent advanced filters

`GET /api/v1/vehicles/facets` also returns `seats`, `engineCapacityCc`, `powerKw` and `dealerships`. Every group uses all supplied filters; null values are omitted, so missing specification data produces empty arrays. Numeric options are sorted ascending.

Illustrative response fields:

```json
{
  "seats": [{"value": 5, "count": 12}],
  "engineCapacityCc": [{"value": 1400, "count": 4}],
  "powerKw": [{"value": 110, "count": 4}],
  "dealerships": [{"slug": "dealer-one", "name": "Dealer One", "count": 12}]
}
```

Use seats values as `seats`, engine values as `minEngineCc`/`maxEngineCc`, power values as `minPowerKw`/`maxPowerKw` and dealership slugs as `dealer`. Engine units are cc, not litres. All counts reflect current filter combinations. Send the same criteria to `/vehicles` to Apply.
