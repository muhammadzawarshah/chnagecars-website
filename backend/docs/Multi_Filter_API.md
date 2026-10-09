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
