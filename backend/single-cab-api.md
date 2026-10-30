# Single Cab Bakkie: API and manifest mapping

Checked 26 October 2026 against the documented working host `https://changecarapi.wowcar.co.th`.

## Diagnosis

Single Cab inventory is present. Live count checks returned:

| Query | HTTP | Total at check time |
|---|---:|---:|
| `/api/v1/vehicles/count?category=single-cabs` | 200 | 2,243 |
| `/api/v1/vehicles/count?category=bakkies` | 200 | 2,243 |
| `/api/v1/vehicles/count?category=single-cab-bakkie` (before compatibility fix deployment) | 200 | 0 |

The live compressed manifest contained `dictionaries.body_type["single-cabs"] = "Single Cab Bakkie"` and 2,243 vehicle entries with `"single-cabs"` in their `body_type` arrays. Local DB verification found 2,235 mapped Single Cab vehicles after the local image cleanup. Local and live inventory counts differ; the live service has not automatically received local DB changes.

The singular source URL slug `single-cab-bakkie` was not a recognized category filter alias in the deployed implementation. This is a request-key compatibility issue, not missing category data. The exact query being sent by the external app was not available; the responses above show the observed behavior for each tested key.

The older documented hostname `chnagecars-website-production.up.railway.app` returned `404 Application not found` for every tested endpoint. Use the backend base URL supplied for the current deployment.

## App mapping that works with the current live API

- UI label: `Single Cab Bakkie`.
- Manifest/filter key: `single-cabs`.
- Manifest matching: check whether each vehicle's `body_type` array contains `single-cabs`.
- Do not use the display label or a source website URL segment as the manifest key.

```http
GET /api/v1/vehicles?category=single-cabs&page=1&pageSize=20
GET /api/v1/vehicles/count?category=single-cabs
GET /api/v1/vehicles/facets?category=single-cabs
```

For website-adapter search, `bodyType=Single%20Cab%20Bakkie` uses the existing display-name mapping. Public `/vehicles` requests use `category`, not `bodyType`.

DealerTrade source body IDs 4/11/21 and codes `C/C`, `D/S`, `S/C` map to this canonical category.

## Compatibility change

The backend now resolves known canonical labels/source codes and common category spellings through the existing body-type mapping. `single-cab-bakkie`, `single-cab`, `single_cab_bakkie`, `Single Cab Bakkie`, `Single Cab Bakie` and `S/C` resolve to the existing `single-cabs`/`bakkies` group after the updated backend is deployed. Existing historical aliases still work; unrelated category slugs are preserved.

Manifest keys, category assignments, stored colours, dictionaries and API response shapes are unchanged. No DB migration or inventory rewrite is needed. Search/count caches may retain an old result for their existing 30-second TTL, and facet caches for 120 seconds.

Verification: 270 Jest tests and 58 real-database API checks passed, including canonical versus alternate count/list equality. No live deployment was performed during this check.
