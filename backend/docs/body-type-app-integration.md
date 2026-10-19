# Body Type options

For the Car Detail Page’s 13 technical specification fields, use [Technical specifications — app developer integration](technical-specifications-app-integration.md). This file covers Body Type search filters.

Use exactly these 15 display names in this order, including options with zero matching listings. The canonical mapping is `src/modules/web/body-types.json`, shared by the website and backend.

| Display name | Public vehicle API category slugs |
| --- | --- |
| Boat | `boats` |
| Caravan | `caravans` |
| Convertible | `convertibles` |
| Coupé | `coupes` |
| Double Cab Bakkie | `double-cabs` |
| Extended Cab | `king-cabs`, `super-cabs` |
| Hatchback | `hatchbacks` |
| Minibus | `minibuses` |
| Motorbike | `motorbikes` |
| MPV | `mpvs` |
| Panel Van | `panel-vans` |
| Sedan | `sedans` |
| Single Cab Bakkie | `single-cabs`, `bakkies` |
| Station Wagon | `station-wagons` |
| SUV | `suvs`, `crossovers` |

For the website API, pass the exact name as `bodyType` (URL encoded). For `/api/v1/vehicles` and its count/facet endpoints, pass corresponding comma-separated slugs as `category`. Multiple choices are ORed. For example, Extended Cab uses `category=king-cabs,super-cabs`; SUV uses `category=suvs,crossovers`. Do not send display names as category slugs.

Unknown listing categories remain unknown; do not assign them a fabricated body type. Marketing collections such as classic or electric are not Body Type options.

## Mobile app integration

1. Store all 15 display names and their category slugs from the table above. Preserve Unicode (`Coupé`), capitalization, spelling and display order. Keep selected values separate from their display labels.
2. On selection, collect every slug for every selected Body Type, remove duplicates, and join with commas. Do not send an empty `category` parameter when nothing is selected.
3. Use the same category query for results, count and facets. Preserve all other active filters. Reset removes the Body Type selection; multiple selected Body Types mean OR, combined with other filters using AND.
4. Keep all 15 options visible when an API response omits categories with zero stock. Never add marketing categories to this list. `Any` is a reset control, not a sixteenth Body Type.
5. Obtain counts from the facets response. Map counts by category slug, never by array position or source numeric body-type ID. The website sums aliases (SUV and Extended Cab). If a vehicle belongs to multiple aliases, summed category counts can overlap; use the count endpoint for the accurate combined result total. During loading or network failure, the app should treat counts as unknown rather than claim verified inventory counts.
6. For existing listings, translate recognized category slugs back to the canonical name. Do not treat raw `bodyTypeId` source IDs as category UUIDs or category slugs. Unknown categories must not be coerced into one of the 15 types.

### Public vehicle API requests

Use your configured API host with these paths:

```http
GET /api/v1/vehicles?category=boats&page=1&pageSize=20
GET /api/v1/vehicles?category=king-cabs,super-cabs&page=1&pageSize=20
GET /api/v1/vehicles?category=suvs,crossovers&page=1&pageSize=20
GET /api/v1/vehicles?category=king-cabs,super-cabs,suvs,crossovers&page=1&pageSize=20
GET /api/v1/vehicles/count?category=suvs,crossovers
GET /api/v1/vehicles/facets?category=suvs,crossovers
```

The website adapter takes display names instead. URL-encode values with your HTTP client's query builder; for example, `bodyType=Coup%C3%A9` or `bodyType=Extended+Cab%2CSUV`. Do not send `bodyType` to the public `/vehicles` endpoint: use `category` there.

Example language-independent selection algorithm:

```javascript
const selected = ["Extended Cab", "SUV"];
const slugs = [...new Set(selected.flatMap(name => mapping[name] ?? []))];
const query = new URLSearchParams();
if (slugs.length) query.set("category", slugs.join(","));
// category=king-cabs%2Csuper-cabs%2Csuvs%2Ccrossovers
```

## Verification report — 19 October 2026

The actual local frontend was exercised in Chromium at `/search/filters`, at desktop 1440px and mobile 390px widths. Facet HTTP responses were controlled in the browser: this verifies rendered labels, selection, request mapping, zero-result behavior and error handling. It does not verify live inventory or a deployed app. The configured local API (`localhost:4000`) was unreachable. No deployment was performed.

The browser found an import above the `"use client"` directive in `useDependentFilters.ts`; this was corrected before the passing checks below. No uncaught browser page errors occurred in the completed run.

| Check | Test | Result / observed response |
| --- | --- | --- |
| 1 | Desktop: exact 15 labels and order | PASS: HTTP 200; all 15 exact labels in requested order at 1440px. |
| 2 | Mobile: identical 15 labels and order | PASS: HTTP 200; identical labels/order at 390px. |
| 3 | Zero matching vehicles | PASS: All 15 options remain visible with (0); no fabricated counts. |
| 4 | Facet API failure | PASS: Controlled HTTP 502; all 15 options remain selectable; no page crash. |
| 5 | Multiple body types combine category aliases | PASS: HTTP 200; category=king-cabs,super-cabs,suvs,crossovers |
| 6 | Select and map Boat | PASS: HTTP 200; selected label=Boat; category=boats |
| 7 | Select and map Caravan | PASS: HTTP 200; selected label=Caravan; category=caravans |
| 8 | Select and map Convertible | PASS: HTTP 200; selected label=Convertible; category=convertibles |
| 9 | Select and map Coupé | PASS: HTTP 200; selected label=Coupé; category=coupes |
| 10 | Select and map Double Cab Bakkie | PASS: HTTP 200; selected label=Double Cab Bakkie; category=double-cabs |
| 11 | Select and map Extended Cab | PASS: HTTP 200; selected label=Extended Cab; category=king-cabs,super-cabs |
| 12 | Select and map Hatchback | PASS: HTTP 200; selected label=Hatchback; category=hatchbacks |
| 13 | Select and map Minibus | PASS: HTTP 200; selected label=Minibus; category=minibuses |
| 14 | Select and map Motorbike | PASS: HTTP 200; selected label=Motorbike; category=motorbikes |
| 15 | Select and map MPV | PASS: HTTP 200; selected label=MPV; category=mpvs |
| 16 | Select and map Panel Van | PASS: HTTP 200; selected label=Panel Van; category=panel-vans |
| 17 | Select and map Sedan | PASS: HTTP 200; selected label=Sedan; category=sedans |
| 18 | Select and map Single Cab Bakkie | PASS: HTTP 200; selected label=Single Cab Bakkie; category=bakkies |
| 19 | Select and map Station Wagon | PASS: HTTP 200; selected label=Station Wagon; category=station-wagons |
| 20 | Select and map SUV | PASS: HTTP 200; selected label=SUV; category=suvs,crossovers |

### Evidence and repeatability

- Raw responses: [body-type-verification/results.json](body-type-verification/results.json)
- Desktop screenshot: [desktop.png](body-type-verification/desktop.png)
- Mobile screenshot: [mobile.png](body-type-verification/mobile.png)
- Browser script: `scripts/check-body-types-browser.cjs`
- Backend round-trip tests: `src/modules/web/web-format.spec.ts`

Run the website on port 3100, then run `PLAYWRIGHT_MODULE=/path/to/playwright node scripts/check-body-types-browser.cjs` from the repository root. Alternatively install Playwright in your development environment and omit `PLAYWRIGHT_MODULE`. Set `BODY_TYPES_TEST_URL` to change the filter page URL. The script intentionally intercepts facet requests for deterministic UI testing.

Run `npm test --prefix backend -- --runInBand web-format.spec` to verify all backend aliases round-trip to the required names. Before release, repeat the requests against the running target API and confirm each returned listing has a category slug in the selected set. Verify zero-stock categories return zero matches and combined SUV/Extended Cab selections return the correct union.

## DealerTrade codes mapped in detail responses and filters

`bodyType` and `technicalSpecifications.bodyType` now return the exact canonical names below. The original code remains available as `bodyTypeRaw`, and `bodyTypeId` remains the original source ID. Raw source payloads are unchanged.

| Canonical display name | DealerTrade codes | Source IDs | Canonical category slug |
| --- | --- | --- | --- |
| Boat | No observed source code | No observed source ID | `boats` |
| Caravan | No observed source code | No observed source ID | `caravans` |
| Convertible | `C/B` | 3 | `convertibles` |
| Coupé | `C/P` | 5 | `coupes` |
| Double Cab Bakkie | `D/C` | 9 | `double-cabs` |
| Extended Cab | `XCab`, `Extended Cab` | 39, 53 | `king-cabs` |
| Hatchback | `H/B`, `Hatch` | 12, 14 | `hatchbacks` |
| Minibus | `B/S` | 2 | `minibuses` |
| Motorbike | `D/P`, `O/F`, `R/D`, `S/P` | 10, 16, 19, 23 | `motorbikes` |
| MPV | `MPV` | 15 | `mpvs` |
| Panel Van | `P/V` | 17 | `panel-vans` |
| Sedan | `S/D`, `Sedan` | 22, 26 | `sedans` |
| Single Cab Bakkie | `S/C`, `C/C`, `D/S` | 4, 11, 21 | `single-cabs` |
| Station Wagon | `S/W` | 24 | `station-wagons` |
| SUV | `SUV`, `SAV`, `X/O`, `R/V` | 20, 25, 27, 29 | `suvs` |

ID 8 maps to Coupé only when that individual listing's source URL identifies `coupe` or `coup`. ID 13 (`H/T`) and ID 43 (`F/C`) remain null/unmapped; no category is guessed. A missing source label can still be resolved from a verified source ID, such as ID 27 → SUV. Boat and Caravan remain valid selectable options even when no source stock matches them.

The technical specifications formatter preserves the canonical name's capitalization (`Hatchback`, `Coupé`, `Double Cab Bakkie`); it does not uppercase this field. Other technical value formatting stays the same. For unresolved values, show `Not available` and do not introduce a sixteenth selectable Body Type.

The local category backfill mapped 36,861 of 36,868 inventory vehicles and left 7 unresolved. It backed up the previous category assignments under `backend/.local/body-type-mapping/`, preserved every vehicle row unchanged, and assigned canonical category links so detail values, facets and search filters agree. Existing `bakkies` and `crossovers` filter aliases expand to their canonical groups.

Future DealerTrade imports, reconciliation and enrichment use the same shared resolver. Existing client dumps predate this category backfill and must be re-exported before handing over these latest database mappings.

## Capitalization normalization

Body Type names use their exact canonical capitalization: `Single Cab Bakkie`, `Double Cab Bakkie`, `Extended Cab`, `Station Wagon`. Mixed case, repeated spaces, hyphens and recognized spellings such as `Single Cab Bakie` normalize to the same canonical name. `SUV` and `MPV` remain uppercase. This rule applies to backend responses and technical specification rendering; original source codes remain unchanged.
