# Filter Dropdown APIs — Mobile App

Base URL: `https://chnagecars-website-production.up.railway.app/api/v1`

Local base URL: `http://localhost:4000/api/v1`

All requests below use GET. No request body or authentication is required. Header: `Accept: application/json`.

These endpoints require deployed commit `6d3d96d` or later. Response examples below illustrate the format; counts depend on database contents and selected filters.

## Separate dropdown endpoints

| Dropdown | Request |
|---|---|
| Colours | `/vehicles/filters/colours` |
| Makes | `/vehicles/filters/makes` |
| Models for a make | `/vehicles/filters/models?make=audi` |
| Variants for a model | `/vehicles/filters/variants?make=audi&model=audi:q3` |
| Transmission | `/vehicles/filters/transmissions` |
| Fuel types | `/vehicles/filters/fuel-types` |
| Drive | `/vehicles/filters/drives` |

Every endpoint accepts the active filter parameters listed below. `total` is the number of matching cars; `options[].count` is the number of matching cars for that option.

## Response formats

### Colours

```json
{"total":12,"options":[{"value":"black","name":"Black","count":7},{"value":"white","name":"White","count":5}]}
```

Use `value` as the `colour` parameter.

### Makes

```json
{"total":12,"options":[{"slug":"audi","name":"Audi","count":7},{"slug":"bmw","name":"BMW","count":5}]}
```

Use `slug` as the `make` parameter.

### Models

```json
{"total":7,"options":[{"slug":"q3","name":"Q3","make":"audi","value":"audi:q3","count":7}]}
```

Use `value` as the `model` parameter. Expand Audi by requesting models with `make=audi` plus other active filters.

### Variants

```json
{"total":7,"options":[{"slug":"example-variant","name":"Example variant","make":"audi","model":"q3","count":7}]}
```

The variant above is illustrative, not a seeded variant. Use the returned `slug` as `variant`. Listings without stored variants return an empty array.

### Transmission

```json
{"total":7,"options":[{"value":"AUTOMATIC","count":0},{"value":"MANUAL","count":0},{"value":"UNKNOWN","count":7}]}
```

### Fuel types

```json
{"total":7,"options":[{"value":"PETROL","count":0},{"value":"DIESEL","count":0},{"value":"HYBRID","count":0},{"value":"PLUGIN_HYBRID","count":0},{"value":"ELECTRIC","count":0},{"value":"LPG","count":0},{"value":"OTHER","count":7}]}
```

### Drive

```json
{"total":7,"options":[{"value":"FOUR_X_FOUR","count":0},{"value":"FOUR_X_TWO","count":0},{"value":"AWD","count":0},{"value":"FWD","count":0},{"value":"RWD","count":0}]}
```

Use enum `value` as `transmission`, `fuelType` or `drivetrain`. These three endpoints retain allowed choices with zero counts. Cars with missing drive information contribute to total but have no drive bucket. Unknown source specifications are not inferred from titles.

## Supported query parameters

| Parameter | Type | Example |
|---|---|---|
| `make` | CSV string | `ferrari,chevrolet` |
| `model` | CSV string | `audi:q3,audi:q5` |
| `variant` | CSV string | Returned variant slug |
| `colour` | CSV string | `Black,White` |
| `category` | CSV string | `suvs,coupes` |
| `transmission` | CSV string | `AUTOMATIC,MANUAL` |
| `fuelType` | CSV string | `PETROL,DIESEL` |
| `drivetrain` | CSV string | `AWD,FOUR_X_FOUR` |
| `province` | CSV string | `GAUTENG,WESTERN_CAPE` |
| `city` | string | `Pretoria` |
| `condition` | CSV string | `NEW,USED,DEMO` |
| `minPrice`, `maxPrice` | integer | `100000`, `500000` |
| `minYear`, `maxYear` | integer | `2018`, `2026` |
| `minMileage`, `maxMileage` | integer | `0`, `100000` |
| `onSpecial`, `featured`, `availableOnly` | boolean | `true`, `false` |
| `q` | string | `ranger wildtrak` |

Different fields combine with AND. CSV choices within a field combine with OR. Make-scoped models apply to their own make: `make=bmw,toyota&model=toyota:corolla` means any BMW or Toyota Corolla.

## Select and Apply

1. Load each dropdown endpoint without filters for initial options.
2. On selection, refresh dropdowns with the current filter parameters. Counts reflect ALL supplied filters, including the dropdown's own selection.
3. Expand a make using `/vehicles/filters/models?make=audi`; expand a model using `/vehicles/filters/variants?make=audi&model=audi:q3`. Preserve other active criteria.
4. Before Apply, get `/vehicles/count` with the selected parameters. Response: `{"total":12,"count":12,"formatted":"12"}`.
5. Apply using `/vehicles` with the same parameters. Results use `{ "data": [...], "meta": {...} }`. Pagination accepts `page` and `pageSize` (maximum 50).
6. Clear one dropdown by removing its parameter. Reset removes all filters. Clear incompatible model/variant selections when changing make/model.

### Single selection

```http
GET /vehicles?make=ferrari
GET /vehicles/count?make=ferrari
GET /vehicles/filters/colours?make=ferrari
```

### Two selected makes

```http
GET /vehicles?make=ferrari,chevrolet
```

Use one `make` parameter containing both slugs.

### Multiple filters at once

```http
GET /vehicles?make=audi&model=audi:q3&colour=Black,White&maxPrice=500000&minYear=2018&page=1&pageSize=20
GET /vehicles/count?make=audi&model=audi:q3&colour=Black,White&maxPrice=500000&minYear=2018
GET /vehicles/filters/colours?make=audi&model=audi:q3&maxPrice=500000&minYear=2018
```

The last example omits `colour` to show all available colours under the other selections. Include `colour` to restrict the counts to selected colours too.

### Transmission, fuel and drive together

```http
GET /vehicles?transmission=AUTOMATIC&fuelType=DIESEL&drivetrain=AWD
GET /vehicles/filters/colours?transmission=AUTOMATIC&fuelType=DIESEL&drivetrain=AWD
```

Zero matches are valid. Imported cars may have UNKNOWN transmission, OTHER fuel or missing drive information.

## Postman

Import `postman/ChangeCars_Multi_Filters.postman_collection.json` from this docs directory. Set collection variable `baseUrl`, then run the collection. It tests single filters, combinations, matching results, counts and separate dropdowns.

Use `/vehicles` for this mobile filter contract. The `/web/cars` adapter uses different parameter names.


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
