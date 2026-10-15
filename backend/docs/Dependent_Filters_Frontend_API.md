# Dependent advanced filters and matching car names

## Base URLs

Backend: `https://chnagecars-website-production.up.railway.app/api/v1`

Local backend: `http://localhost:4000/api/v1`

Local frontend: `http://localhost:3000`

Backend endpoints below use GET query parameters, no request body, and no authentication. Header: `Accept: application/json`.

## Refresh all dropdowns

`GET /vehicles/facets`

Send all current selections after every change:

```http
GET /vehicles/facets?maxPrice=500000
GET /vehicles/facets?maxPrice=500000&minYear=2018
GET /vehicles/facets?maxPrice=500000&minYear=2018&make=audi
GET /vehicles/facets?maxPrice=500000&minYear=2018&make=audi&model=audi:q3
```

The response includes `total`, `makes`, `models`, `variants`, `colour`, `categories`, `transmission`, `fuelType`, `drivetrain`, `province`, `city`, `condition`, `seats`, `engineCapacityCc`, `powerKw`, `dealerships`, and `ranges` (price/year/mileage). All counts use ALL supplied filters. Zero-match options and null specifications are omitted. Empty arrays are valid; hide empty dropdown options.

Makes: `{slug,name,count}`. Models: `{slug,name,make,value,count}`, where `value` is `make:model`. Variants: `{slug,name,make,model,count}`. Colours: `{value,name,count}`. Numeric specifications: `{value,count}`. Dealerships: `{slug,name,count}`. Other categorical groups: `{value,count}`, except categories: `{slug,name,count}`.

Group models beneath their `make`, and variants beneath their `make` and `model`. Only render the Variants expander when that model has returned variants.

## Matching car names under models and variants

```http
GET /vehicles?make=audi&model=audi:q3&page=1&pageSize=10
GET /vehicles?make=audi&model=audi:q3&variant=<returned-variant-slug>&page=1&pageSize=10
```

Preserve active price/year/colour/etc. filters. Set make and model to the branch being expanded. For a variant branch, set its returned variant slug. For a model branch, remove `variant`.

Response: `{data:[...],meta:{...}}`. Render `data[].title`; `data[].id` is the car UUID. Display total from `meta.total`; request the next page for more names. Each frontend name links to `/cars/{id-without-hyphens}`.

When variants are missing, the frontend displays “Variant information is unavailable for these listings” and shows model-level matching car names. Car titles are listings, not inferred variants.

## Apply, count and reset

`GET /vehicles` with selected criteria returns matching cars.

`GET /vehicles/count` with those same criteria returns `{total,count,formatted}`.

Different fields combine with AND; comma-separated choices within a field combine with OR. Example: `make=ferrari,chevrolet&colour=Black,White`. Reset removes filter parameters. Clearing one field removes that parameter. A zero total is valid.

| Filter | Parameter |
|---|---|
| Make | `make` (CSV slugs) |
| Model | `model` (CSV scoped make:model values) |
| Variant | `variant` (CSV returned slugs) |
| Body | `category` (CSV category slugs) |
| Colour | `colour` (CSV) |
| Transmission | `transmission` (CSV enums) |
| Fuel | `fuelType` (CSV enums) |
| Drive | `drivetrain` (CSV enums) |
| Province / city | `province` / `city` |
| Condition | `condition` |
| Price | `minPrice`, `maxPrice` |
| Year | `minYear`, `maxYear` |
| Mileage | `minMileage`, `maxMileage` |
| Seats | `seats=5,7` or `seats=8%2B` |
| Engine cc | `minEngineCc`, `maxEngineCc` |
| Power kW | `minPowerKw`, `maxPowerKw` |
| Dealership | `dealer` (returned slug) |
| Special / featured / available | `onSpecial`, `featured`, `availableOnly` (boolean) |
| Search | `q` |

The imported feed lacks many specifications and stored variants. Missing seats/engine/kW options remain empty until source data is populated.

## Local frontend proxy routes

`GET /api/vehicles/facets` forwards mobile criteria to backend `/vehicles/facets`.

`GET /api/vehicles/filter-cars` forwards criteria and pagination to backend `/vehicles` for expandable car names.

Frontend form labels are converted to backend parameters before requesting facets. Website results still use the `/web/cars` adapter and its own parameter names. Local frontend integration changes must be deployed before these proxy routes are available online.

## Postman

Import `postman/ChangeCars_Dependent_Facets_Tests.postman_collection.json`. Set `baseUrl` for backend tests; set `frontendUrl` for the local frontend proxy folder. Run with 500 ms delay. The collection covers dropdown dependencies, counts, filters, validation, car names, pagination and real variants discovered from facets. Variant cases explicitly skip if no matching variant data exists.
