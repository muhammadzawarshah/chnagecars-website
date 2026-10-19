# Source-only local inventory rebuild — 19 October 2026

The app database at `127.0.0.1:55432/changecars` was replaced with an independently rebuilt and verified local database. Railway and other remote databases were not changed.

## Result

- 38,766 fresh unique DealerTrade vehicle payloads and 933 complete dealer payloads preserved exactly in `source_feed_records`.
- 38,758 vehicle rows, 926 dealer rows and 702,347 vehicle image rows imported.
- Eight vehicles remain raw-only because price is missing/POA/nonpositive and the existing schema requires a positive price. IDs: 1559202, 1559200, 1559201, 1558610, 1558609, 1557263, 1531632, 1430410.
- Seven dealers remain raw-only because no valid province was supplied. 158 imported dealers have no source-derived city; their city remains empty.
- No old Fbook vehicle fields, colours, years, GPS coordinates, cached Firebase image URLs or generic catalogue specification values were carried into the rebuilt inventory responses.
- Every imported vehicle has null year and colour because those fields were absent from this source capture. Zero mileage remains zero; negative/invalid mileage becomes null while the untouched source payload retains the original value.
- Explicit fuel source IDs map to the existing app enums (1 Petrol, 2 Diesel, 3 Electric, 4 Hybrid); an unrecognized ID retains the existing OTHER enum and its original raw ID.
- Vehicle/dealer primary IDs are the original numeric DealerTrade IDs represented as strings. Existing vehicle/dealer slugs are retained where the same identity remains. Field names and response types remain compatible.
- 37,104 vehicle variant links retain existing catalogue UUIDs only where source variant identity and model establish a unique mapping. 1,654 vehicles remain unlinked. Old catalogue specifications and generic features are not returned for source-only inventory. Catalogue identity tables were retained to preserve application keys.
- Old listing activity and old filter snapshots were cleared. Fresh filters and local activity are generated from the rebuilt inventory.
- All five user accounts remain unchanged. Two memberships belonging to removed non-source demo dealers were not restored; those accounts no longer have those demo dealer affiliations.

## Validation

Every imported row was checked across 17 source/mapping fields, including actual image URLs. All 38,766 vehicle and 933 dealer raw payloads matched their captured JSON exactly: zero mismatches. The backend build and 207 tests passed. Numeric IDs, slugs, website vehicle detail, dealer detail, zero-mileage filtering, body types and filter manifest returned HTTP 200 before and after promotion. Chromium desktop (1440px) and mobile (390px) checks passed for contacts, source hours/reviews, specifications, finance and enquiry UI.

The capture queried 94 dealer partitions, validated each partition's distinct identities/counts, and refreshed the global head. The feed changed during traversal; this is a captured source dataset, not a single-instant upstream snapshot. The explicit user request authorized replacing the prior inventory with this capture.

## Recovery and local evidence

Full pre-refresh backup, successfully restore-tested:
`client-handover/changecars-clean-2026-10-19T11-54-54-387Z/changecars-clean.dump`.

The complete previous local database remains available as `changecars_before_strict_1792412281331`. Do not drop it until recovery is no longer needed.

Source capture, import report, exact field proof, app variant mapping, staging/API smoke checks and promotion record are under the ignored local folder `backend/.local/dealertrade-strict-refresh-20261019`.

The strict importer requires an empty isolated local staging database and `DEALERTRADE_STRICT_SOURCE=1`. Preparation, import, verification, API smoke test and promotion scripts are local-only and guard their target database. These one-off orchestration scripts reference this capture/backup explicitly; review those paths before a future refresh. No schema migration is needed.

Deploy the accompanying backend changes when restoring this database elsewhere. Source-only inventory must not fall back to older shared catalogue specifications or generic features. feature/search-sorting-near-me

### DealerTrade model year update

DealerTrade's stock endpoint now supplies `model_year` (verified by a fresh request). The importer maps valid integer values from 1900 to 2100 to the existing `year` field. Strict imports leave unavailable or invalid years null; they do not infer a year from URLs or model names.

`node backend/scripts/sync-dealertrade-years.cjs` refreshes years for matching vehicles in the local database only. It saves fetched responses and a rollback copy under `backend/.local/year-sync/`, preserves IDs and slugs, updates titles and stored source year values, and leaves other vehicle attributes unchanged. Vehicles absent from the fresh feed are not assigned guessed years. No app field names or response types change.

Local year sync result: 38,624 fetched rows, 38,603 unique source vehicle IDs (inventory changed during pagination), 31,909 valid source years, and 31,824 matching existing vehicles updated. The database retains all 38,758 existing vehicles; 6,934 still have null years. The captured feed contains 6,694 records with null `model_year`; unmatched existing vehicles were left untouched. Valid database years range from 1952 to 2027, with zero mismatches against each updated vehicle's stored DealerTrade year. Vehicle detail APIs for 1521740 and 1559302 both return HTTP 200 and `year: 2026`. This sync does not add or remove vehicles.

### Province database labels

Migration `20261019000200_province_database_labels` renames all nine PostgreSQL `Province` enum labels to their proper names (for example `Free State`, `Western Cape`, and `KwaZulu-Natal`). This applies consistently to vehicles, dealers, branches, and other columns using the enum, including enum arrays. Prisma `@map` preserves existing application/API codes such as `FREE_STATE`, so existing filters and app variables continue working. Deploy the schema migration with the regenerated Prisma client and restart the backend together. Verified locally: 37,928 vehicles and 926 dealers retain their original province counts; `/vehicles/count?province=FREE_STATE` returns 792; vehicle/dealer detail and facets remain HTTP 200. Backend build and 28 relevant tests pass.
=======

