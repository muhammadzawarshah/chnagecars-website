# One API for app-side filters

`GET /api/v1/vehicles/filters/all` — public, no authentication, no filter parameters, no pagination.

Call once when opening filters and store the response in the app. It contains all currently public PUBLISHED and RESERVED listings from APPROVED dealers. Every listing is included, including those with missing specifications. Draft, sold, suspended and unapproved-dealer listings are excluded by the existing public search visibility rules.

Response fields:

| Field | Purpose |
| --- | --- |
| `schemaVersion` | Currently `1`; identifies the payload format. |
| `generatedAt` | UTC timestamp when the cached snapshot was built. |
| `total` | Number of rows in `vehicles`. |
| `options` | All makes, models, variants, dealerships, branches, categories, colour, city, province, condition, fuelType, transmission, drivetrain, seats, engineCapacityCc and powerKw with initial counts. Only values present in listings are included; missing specifications are omitted from options. |
| `ranges` | Min/max price, year, mileage, engineCapacityCc and powerKw. Both bounds are null if no known values exist. |
| `collectionRules` | Budget/student price limits, new-arrival days and bakkie categories used by backend collections. |
| `vehicles` | Complete compact dataset containing filter fields and relationships; no images, contact details, VIN or registration. |

Each vehicle has `id`, `slug`, `title`, `status`, `price`, `year`, `mileage`, `seats`, `engineCapacityCc`, `powerKw`, `colour`, `condition`, `transmission`, `fuelType`, `drivetrain`, `province`, `city`, `branchId`, `isSpecial`, `isFeatured`, `isHotSeller`, `publishedAt`, `latitude`, `longitude`, `make`, `model`, `variant`, `dealer` and `categories`. Make/model/dealer/category contain `slug` and `name`; model also has `value` such as `audi:q3`. Variant is null when unknown. Model options include their make; variant options include make, model and scoped `modelValue`. Colour is normalized to lowercase. Vehicle categories retain every membership; dropdown category options include active categories only.

## Local filtering

Always keep the original complete `vehicles` array. On each selection, filter that original array, compute the result count, and rebuild dropdown options/counts/ranges from matching rows. Do not repeatedly filter the previous subset: clearing a filter must restore matching rows.

```js
const snapshot = await fetch(`${baseUrl}/vehicles/filters/all`).then(r => r.json());
// Read snapshot.data instead if your HTTP client wraps response bodies.
const allVehicles = snapshot.vehicles;
const selected = allVehicles.filter(car =>
  car.make.slug === 'audi' &&
  car.price <= 500000 &&
  car.year !== null && car.year >= 2018 &&
  ['black', 'white'].includes(car.colour)
);
const total = selected.length;
const availableModels = [...new Set(selected.map(car => car.model.value))];
```

Use AND between different filter groups, OR between values within a group. For make/model selections, backend semantics are: `make=bmw,toyota&model=toyota:corolla` includes every BMW plus Toyota Corolla. Plain model slugs apply across selected makes. Variants use their slug, with their parent make/model stored for dropdown dependencies. City and colour comparisons are case-insensitive; dealer uses its slug, branch uses `branchId`, categories use array membership. Free-text search matches every word in title, case-insensitively (up to six words).

Numeric ranges are inclusive and use `price` (the listing price), not a special/effective price. Swap min/max when supplied in reverse order. Null specifications remain visible without a corresponding range/seat filter and are excluded when it is active. Seats support exact selections and `8+` (at least eight). `availableOnly` excludes RESERVED; special/featured selections use `isSpecial`/`isFeatured`. False special/featured selections mean no restriction, as on the existing API. For collections, use `collectionRules`, `isHotSeller`, flags, fuelType, category membership and `publishedAt` as applicable. Radius filtering can use latitude/longitude and Haversine distance; existing backend standard search uses a bounding box while nearest search applies exact distance.

Initial `options` counts describe the complete snapshot. Recompute dependent counts locally after each selection. Clear incompatible model/variant selections when changing their parent. This endpoint intentionally ignores selected filters so the app always receives the complete data.

The server caches snapshots for 120 seconds with listing namespace invalidation. Refresh on opening filters/app resume and after relevant listing changes; replace the stored snapshot entirely (do not append). Local counts reflect the cached snapshot. Fetch current vehicle cards/details through existing APIs and pass selected filters to `/vehicles` for final paginated results. Availability is checked again by transactional APIs.

Import `postman/ChangeCars_Complete_Filter_Data.postman_collection.json` to test the endpoint. These changes must be deployed before the endpoint is available on the hosted backend.
