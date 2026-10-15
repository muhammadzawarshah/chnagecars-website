# CHANGECARS: LOCAL-ONLY FILTER FACETS — Flutter Implementation & Test Plan

**Updated 10 October 2026. Grounded in the supplied `lib(8).zip`. Scope: locally cached filter options/dependencies/counts/ranges only. Actual listing cards remain server-fetched.**

## Scope, decision, and rules of ownership

**IN SCOPE:** one backend-generated compact filter-only dataset for every eligible vehicle; versioned local disk cache; calculating dynamic dropdown choices, counts, numeric bounds and an indicative local matching count; existing UI wiring; complete test coverage.

**OUT OF SCOPE:** caching full listing cards, photos, descriptions, server-side search replacement, local ranking/sorting, or replacing the existing listings API. The app requests car cards with existing search parameters as before. Backend must agree on filter IDs and semantics for result consistency.

**Decision:** add a dedicated local `VehicleFacetEngine` and `VehicleFilterRepository`; keep `SearchProvider`, its selected values and current filter sheets. Do not rely on the capped `OfflineListingIndex` for whole-inventory facets. **A filter selection must never make a network request merely to refresh options/counts.** The existing listing-results request may still occur, according to current search UX.

## Objective and non-negotiable behaviour

Keep the existing ChangeNotifier/SearchProvider and filter UI, but use one complete, locally cached **filter-only** vehicle snapshot (30,011+ rows) for all option availability, facet counts, and range calculations. The server remains responsible for the authoritative paginated car-card search. Do not use partially downloaded listing pages as the facet universe.

**Semantics:** OR within a multi-select facet; AND across facets; for a facet's counts, apply *all other* selections but omit that facet's own selections. Enforce make/model and province/city parent-child relationships. A selected option that becomes unavailable after changing an unrelated filter may remain visible as selected with a `0` count, allowing the user to clear it; clear child selections when their parent is explicitly changed. A null attribute must never be interpreted as an available value.

## Verified existing-code integration points

| File | Relevant code | Action |
|---|---|---|
| `lib/features/buy_car/search/search_provider.dart` | `SearchProvider`, `_currentOfflineFilter()` (~183), `ensureFilterSheetData()` (~2448), `_liveFacetCounts()` (~2663) | Keep as UI state owner. Add `VehicleFilterRepository` + `VehicleFacetEngine`; replace source for facet options/counts. |
| same | `forFilterData`, `fetchCarsForFilter`, `_filterCarsCacheKey` | Stop using all-listings and SharedPreferences JSON as the authoritative dataset for facets. Keep temporary fallback behind rollout flag if needed. |
| same | `selectedMakes`, `selectedModels`, `selectedVariants`, `selectedDealerships`, price/year/km and other selection fields | Keep UI-facing selection state, map displayed names to stable IDs once at the provider boundary. |
| `lib/core/services/offline_listing_index.dart` | `OfflineListingIndex(capacity=4000)`, `facetCounts`, `query`, `addListings` | Keep for offline **listing pages**. Do not repurpose unmodified: it evicts at capacity and only indexes pages observed by the app. |
| `lib/core/services/offline_cache.dart` | file-based JSON atomic-ish writes | Reuse directory conventions/approach, but keep immutable revisioned snapshot files separately. |
| `lib/features/buy_car/search/filter_options_api.dart`, `filter_taxonomy.dart` | Listivo options and label/slug handling | In new-backend path, populate options from snapshot dictionaries; retain localization/UI labels as presentation only. |
| `search_page.dart`, `makes_models_sheet.dart`, `additional_filters.dart` | UI | No redesign. Wire counts, disabled states and range bounds to provider getters. |

## Backend contract (must be implemented first)

**Manifest:** `GET /api/v1/vehicle-filters/manifest`

```json
{
  "schema_version": 1,
  "revision": "inv-1042",
  "total": 30011,
  "snapshot_url": "/api/v1/vehicle-filters/snapshots/inv-1042.json.gz",
  "sha256": "64_character_hex_hash_of_compressed_file",
  "compressed_bytes": 1350000,
  "generated_at": "2026-10-10T10:00:00Z"
}
```

The byte count above is illustrative. Publish the file immutably. Serve `Content-Type: application/json` with `Content-Encoding: gzip` **only when delivering transparent HTTP compression**; alternatively serve the `.json.gz` as `application/gzip`, in which case Flutter explicitly decompresses. Choose *one* transport convention and document it. Checksum must be defined over the actual downloaded bytes (the example hashes compressed bytes).

**Snapshot (decompressed JSON):**

```json
{
  "schema_version": 1,
  "revision": "inv-1042",
  "total": 30011,
  "dictionaries": {
    "make": {"ford": "Ford"},
    "model": {"ford:ranger": {"name": "Ranger", "make_id": "ford"}},
    "variant": {}, "body_type": {"truck": "Bakkie / Truck"},
    "fuel_type": {}, "transmission": {}, "drivetrain": {},
    "color": {"white": "White"},
    "condition": {"used": "Used", "new": "New"},
    "availability": {"available": "Available"},
    "province": {"free-state": "Free State"},
    "city": {"free-state:bethlehem": {"name": "Bethlehem", "province_id": "free-state"}},
    "dealer": {"26": "Morgan Motor Group Bethlehem"}
  },
  "vehicles": [{
    "id": 1430475,
    "make": "ford", "model": "ford:ranger", "variant": null,
    "body_type": "truck", "fuel_type": null,
    "transmission": null, "drivetrain": null,
    "color": "white", "condition": "used", "availability": "available",
    "province": "free-state", "city": "free-state:bethlehem", "dealer": "26",
    "price": 437900, "year": 2020, "mileage": 111607,
    "sale_price": 437900,
    "seats": null, "engine_capacity_cc": null, "power_kw": null
  }]
}
```

All 30,011 records belong in the actual snapshot. Fields absent in the XML (e.g. fuel, transmission, seats) should be **null**, unless enrichment is explicitly verified. One stable record per `vehicle_id`, integer prices in ZAR, mileage in km, engine capacity in cc. The server must validate foreign-key relationships: model belongs to make; city belongs to province; all non-null codes have dictionary entries. Include any additional UI facets (specials, category, cylinders) **only if backend can meaningfully supply and filter them**, with the same pattern.

**Listing search:** `GET /api/v1/cars?make[]=ford&model[]=ford:ranger&color[]=white&page=1`. Agree on actual syntax for arrays, numeric ranges and sorting. Backend must apply the same filter normalization and OR/AND semantics. Return `inventory_revision` and authoritative `total` when possible. If snapshot revision differs from listing inventory revision, label local counts as possibly stale and schedule a snapshot refresh.

## Add these Flutter files

```text
lib/features/buy_car/search/vehicle_filter_models.dart
lib/features/buy_car/search/vehicle_filter_repository.dart
lib/features/buy_car/search/vehicle_facet_engine.dart
```

### 1. Typed snapshot model (`vehicle_filter_models.dart`)

Define immutable `VehicleFilterSnapshot { int schemaVersion; String revision; int total; Map<String, dynamic> dictionaries; List<VehicleFacetRow> vehicles; }`. Define `VehicleFacetRow` with:

- `int id`, nullable `String` for make/model/variant/body_type/fuel_type/transmission/drivetrain/color/condition/availability/province/city/dealer;
- nullable `int` for year, price, sale_price, mileage, seats, engine_capacity_cc, power_kw.

Parse explicitly (not by implicit string interpolation): `value == null ? null : value as String`; numeric fields `value is num ? value.toInt() : null`. Reject invalid types and duplicate IDs. Never replace null with zero, `OTHER`, or an invented value.

### 2. Repository (`vehicle_filter_repository.dart`)

**Expected API:** `Future<VehicleFilterSnapshot?> loadCached()`, `Future<VehicleFilterSnapshot?> syncIfChanged()` and `SyncStatus status`. Implement:

1. Read metadata (`active_revision`, `schema_version`, `last_check`) from a small metadata JSON in `getApplicationSupportDirectory()/vehicle_filters/`.
2. Open `snapshot-<revision>.json` if it exists. Parse and validate before emitting to provider.
3. On startup/search-screen entry, call manifest, subject to a check throttle (e.g. once every few hours).
4. If revision unchanged: update `last_check` only; reuse index.
5. If changed: download revision-specific snapshot to `.part`, validate compressed hash (when applicable), decompress, parse off main isolate (`compute`), validate `total`, unique IDs, supported schema version, dictionaries and parent relations.
6. Write new snapshot to temp file, flush, rename atomically **within the same directory**. Update active metadata only after validation and successful file rename. Keep previous active snapshot for rollback.
7. If request fails: use last validated snapshot; never delete it.
8. Guard against overlapping sync calls. On logout, do not clear public vehicle filter cache unless account-specific permissions affect content.

Do **not** store all vehicles in SharedPreferences. Use it only for very small state if required. HTTP gzip with transparent decompression is simplest; don't double-decompress a response already decoded by the HTTP client.

### 3. Filter engine (`vehicle_facet_engine.dart`)

Represent current selected categorical IDs as `Map<String, Set<String>> selected`; numeric bounds as `Map<String, RangeSelection>` (nullable min/max). Use the following reference algorithm first, then optimize with bitsets/inverted indexes when profiling shows the need:

```dart
class RangeSelection {
  const RangeSelection({this.min, this.max});
  final int? min;
  final int? max;
}

bool matchesExcept(
  Map<String, dynamic> car,
  Map<String, Set<String>> selected,
  Map<String, RangeSelection> ranges, {
  String? ignoredFacet,
}) {
  for (final entry in selected.entries) {
    if (entry.key == ignoredFacet || entry.value.isEmpty) continue;
    final value = car[entry.key];
    if (value == null || !entry.value.contains(value)) return false;
  }
  for (final entry in ranges.entries) {
    if (entry.key == ignoredFacet) continue;
    final r = entry.value;
    if (r.min == null && r.max == null) continue;
    final n = car[entry.key];
    if (n is! num) return false;
    if (r.min != null && n < r.min!) return false;
    if (r.max != null && n > r.max!) return false;
  }
  return true;
}

Map<String, Map<String, int>> calculateCounts(
  List<Map<String, dynamic>> cars,
  Map<String, Set<String>> selected,
  Map<String, RangeSelection> ranges,
  List<String> categoricalFacets,
) {
  final result = <String, Map<String, int>>{};
  for (final facet in categoricalFacets) {
    final counts = <String, int>{};
    for (final car in cars) {
      if (!matchesExcept(car, selected, ranges, ignoredFacet: facet)) continue;
      final value = car[facet];
      if (value is String && value.isNotEmpty) {
        counts[value] = (counts[value] ?? 0) + 1;
      }
    }
    result[facet] = counts;
  }
  return result;
}
```

**Note:** This code is a reference implementation for map-shaped parsed rows. Production typed rows can expose `valueOf(facet)` and `numberOf(facet)` instead. It intentionally excludes the target facet from the match calculation. For **price/year/mileage/seats/engine/power bounds**, scan cars matching all other filters and compute min/max, excluding nulls. For model options, intersect resulting counts with models whose `make_id` is in the selected make IDs (when any); similarly apply province/city constraints. Do *not* filter model counts by an active model selection: the engine already omitted it. For condition, availability and dealership, use the same count algorithm.

At 30k cars and ~13 categorical facets a straightforward scan is often acceptable but profile on low-end Android. If slow, build `Map<facet, Map<optionId, BitSet>>` and intersect bitsets per selection. Avoid running expensive calculations synchronously on every slider tick; debounce range input (e.g. 100–200 ms) or compute in an isolate. Use one active engine per snapshot revision.

### 4. Connect into `SearchProvider` **without breaking its API**

- Add provider fields `VehicleFilterSnapshot? filterSnapshot`, `VehicleFacetEngine? facetEngine`, `String? filterRevision`, `int? localMatchCount`, `FilterSyncStatus filterSyncStatus`.
- Call `loadCached()` on provider initialisation (or `ensureFilterSheetData`); publish local results immediately and then invoke revision check asynchronously with safe lifecycle handling.
- Replace the *new backend path* of `_liveFacetCounts()` with `facetEngine.calculate(currentSelection).counts`. Keep the existing Listivo path behind explicit feature flag, not mixed in one response.
- In `_refreshAvailableOptions()` and every existing picker, read option IDs/counts from the engine/dictionaries; convert to localized labels only when presenting the UI.
- When a user selects/chips/removes any filter: update the existing selected fields; normalize to ID sets; clear invalid model on make change and invalid city on province change; recompute local result; call `notifyListeners()` once.
- Preserve selected but now unavailable options as zero-count chips except when their parent has changed. Decide whether disable 0-count unselected options or hide them consistently across all pickers.
- Change `hasLocalFilterDataset` to mean `filterSnapshot != null && facetEngine != null`, not `forFilterData.isNotEmpty`.
- Keep `_offlineIndex.query()` only for intentional offline listing-card mode. **Never treat its count as complete 30k inventory facets.** Continue using existing listing API for cards and sorting.
- Replace fixed-range sentinel checks (`lowerValue==5000`, `upperValue>=25000000`, year 1980/current year, km 500000) with explicit nullable bounds or a clear "range active" flag. Otherwise legitimate boundary selections may be silently removed.
- Do not automatically treat selected `Any` as an option ID. Convert `Any` into an empty `Set<String>` when constructing the engine selection.
- Map UI categories such as `selectedSeatCounts`, `selectedCylinders`, `selectedSpecials` to actual backend facets where valid. Remove/disable UI options unsupported by the source instead of silently ignoring their selection.

### Example provider adapter (pseudocode; depends on your actual constructors)

```dart
Future<void> ensureVehicleFilterSnapshot() async {
  final cached = await vehicleFilterRepository.loadCached();
  if (cached != null) _activateSnapshot(cached);
  final fresh = await vehicleFilterRepository.syncIfChanged();
  if (fresh != null && fresh.revision != filterRevision) {
    _activateSnapshot(fresh);
  }
}

void _activateSnapshot(VehicleFilterSnapshot snapshot) {
  filterSnapshot = snapshot;
  filterRevision = snapshot.revision;
  facetEngine = VehicleFacetEngine(snapshot.vehicles);
  _recalculateFacets();
}

void onAnySelectionChanged() {
  _reconcileParentChildSelections();
  _recalculateFacets();
  // Existing result-list refresh may remain a separate debounced API call.
}

void _recalculateFacets() {
  if (facetEngine == null) return;
  final selection = buildSelectedIdsFromExistingState();
  final result = facetEngine!.calculate(selection);
  // Publish existing availableMakeCounts, availableModelCounts, ...;
  // add province/city/dealer/condition/variant count maps and ranges.
  // notifyListeners(); exactly once per user action.
}
```

The adapter is **not drop-in compiling code**, because `buildSelectedIdsFromExistingState()` and UI-facing option types must be mapped to the supplied application models. Implement those mappings explicitly; do not guess the backend's future request params.

## Testing and acceptance: must pass before rollout

1. **Baseline:** snapshot parses, `total == vehicles.length == 30011` (or newest actual count), IDs unique, every non-null dictionary lookup exists, valid model/make and city/province.
2. **Multi-select:** Ford+Toyota returns union; Ford+Toyota AND White returns intersection; changing White does not hide other colour choices with available counts.
3. **Make/model:** selecting Ford restricts model options to Ford; switching to Toyota clears incompatible Ford model chips; unrelated facets update too.
4. **Province/city:** selecting Gauteng restricts city choices; switching province clears invalid city selections.
5. **Ranges:** year, price, mileage, seats, engine and power apply AND; null values never pass a selected range; numeric bounds use correct no-value semantics.
6. **Zero matches:** return zero, retain selected chips; unselected impossible options disabled/hidden; clear filter restores options.
7. **Cache:** offline relaunch uses previous snapshot; corrupt/partial new download leaves prior snapshot usable; unchanged revision does not redownload; changed revision activates complete consistent dataset.
8. **Memory/performance:** test 30k and 100k rows on low-end Android and mid-range iOS. Measure parse time, RAM, first facet calculation, tap latency and slider latency.
9. **Server parity:** request complete matching *ID set* for combinations, not just page 1; assert local ID set equals backend results for the same `inventory_revision`. Test price boundaries and missing fields.
10. **Migration:** ensure existing WordPress taxonomy option callbacks no longer overwrite snapshot-derived options after sync. Preserve fallback until parity is proven.

## Rollout steps

**Step A:** backend contract + snapshot published. **Step B:** implement typed model + repository + independent facet engine with unit tests. **Step C:** connect provider under feature flag (`useSnapshotFacets`), keep old UI unchanged. **Step D:** wire remaining attributes and ranges, remove mixed sources. **Step E:** compare local counts against backend ID set. **Step F:** enable for all users and monitor `filter_revision`, local vehicle count, parse/sync failures, count mismatches (without logging personal user search terms).

## Clarifications the backend and Flutter teams must settle

- Are server results and snapshot generated from the same availability/status cutoff, including removed cars?
- Which fields are actually supplied rather than inferred from title? Current XML does **not** provide explicit fuel, transmission, seats, power or engine cc.
- Do vehicle listing titles support free-text filtering locally? If yes, include a normalized search token field in snapshot or explicitly say keyword search is server-only.
- How is sorting handled offline vs online? Listing pages may be ordered by server while facet counts are local.
- Does `availability` include vehicles unavailable for purchase? If not, exclude those rows from snapshot or apply availability as a mandatory base filter.

**Definition of done:** every filter change immediately updates all other applicable options/counts/ranges from the entire local vehicle snapshot; selected filters lead to the same vehicle IDs on the server; the cache survives restart/offline use and can be safely updated by revision. No redesign required.


## Exact developer work order (check into source control separately)

1. **Backend contract fixture.** Save a deterministic `test/fixtures/vehicle_filters_v1.json` following the contract above. Include two makes, two models under each, multiple colours, two provinces/cities, prices, nulls, and a `dealer` option. Finalize code/ID normalization and exact array-parameter syntax with backend before writing adapters.
2. **Models and validation.** Add `vehicle_filter_models.dart`; reject unsupported `schema_version`, duplicate `id`, missing required keys, `total` mismatch, invalid numeric types, bad model/make and city/province references. Categorical `null` is allowed. Keep all current filter attributes, including those with no source data; empty dictionaries mean no selectable values.
3. **Facet engine, no networking.** Add `vehicle_facet_engine.dart`; use typed row getters, a selection object, `calculate()` producing `matchingCount`, `countsByFacet`, and `boundsByRange`. Unit-test independently of widgets or `SearchProvider`.
4. **Repository and atomic cache.** Add `vehicle_filter_repository.dart`; manifest check and snapshot download only on start/staleness or explicit refresh, not on a selection. Keep the last valid snapshot on any sync error.
5. **Provider adapter.** Wire into `ensureFilterSheetData()` around line 2448; route `_liveFacetCounts()` around 2663 and `_refreshAvailableOptions()` around 3145 to the local engine **under one explicit feature flag**. Keep old Listivo route separate. Do not let concurrent legacy callbacks overwrite local counts.
6. **UI mapping.** Wire options from dictionaries and counts to existing make/model and additional filter sheets. Preserve the current `notifyListeners` UI style; selected but incompatible values are handled consistently. Prevent picking zero-count *unselected* options, unless product explicitly wants to show them disabled.
7. **API result routing.** Preserve current results API and its pagination. Translate selected stable IDs to existing backend parameters at one adapter boundary only. Do not change the request query names until the server supports the new values.
8. **Testing, profiling and rollout.** Run commands below, record artifacts, gate release on acceptance cases and same-revision parity.

## Filtering semantics — developer examples

- Selected `(Ford OR Toyota)` AND `(White OR Silver)` AND `price 100000..500000`: OR within one field, AND across fields. Missing `price` cannot match a selected price range.
- When computing **colour choices**, apply make/model/price/etc., **ignore all selected colours**, then count White and Silver separately. This is required for multi-select.
- When computing **model choices**, ignore selected models but keep selected make(s). When make changes explicitly, remove model selections whose dictionary parent is no longer selected. The same principle applies to province/city.
- When computing **price slider bounds**, ignore selected price bounds but respect every other selected attribute and numeric range. A numeric `null` is ignored when finding min/max, not treated as `0`.
- `matchingCount` = number of locally indexed vehicles matching *all* active conditions, not number of downloaded listing cards. The API may return different counts only if its inventory revision differs or the backend rules differ; both must be tracked.
- If `availability` is an eligibility gate, enforce it as the same mandatory base filter on backend and in local calculation, even when availability is not shown in the UI.

## Concrete Dart unit tests to adapt

Create `test/features/buy_car/search/vehicle_facet_engine_test.dart`. The names here are the required assertions; adapt constructors to your final typed models, but **do not relax expected results**:

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  // Fixture rows:
  // 1 Ford/Ranger/White/Gauteng/R300000
  // 2 Ford/Ranger/Black/Free State/R400000
  // 3 Ford/Everest/White/Gauteng/R500000
  // 4 Toyota/Hilux/White/Gauteng/R350000
  // 5 Toyota/Corolla/Silver/Free State/R250000
  // 6 Toyota/Hilux/null colour/Gauteng/null price

  test('all empty selections give total 6', () {
    // expect(engine.calculate(empty).matchingCount, 6);
  });

  test('make OR works, other facets AND', () {
    // Ford or Toyota = 6; Ford + White = 2.
    // expect(..., 6);
    // expect(..., 2);
  });

  test('self-facet exclusion preserves unselected colour options', () {
    // Ford + selected White: matchingCount 2; colour counts
    // White=2, Black=1 (not Black=0).
    // expect(result.matchingCount, 2);
    // expect(result.countsByFacet['color']?['black'], 1);
  });

  test('make change removes incompatible selected models', () {
    // Ford/Ranger -> change make to Toyota -> Ranger cleared;
    // only Toyota models displayed.
  });

  test('numeric bounds and null attributes', () {
    // Toyota + price 300000..400000 = Hilux id 4;
    // id 6 (null price) excluded.
  });

  test('zero matches and clear restores valid choices', () {
    // Ford + Silver -> 0 matches; removing Ford gives 1.
  });
}
```

The commented placeholders are **test specifications, not executable test implementations**. The developer must replace them with calls to the actual engine. The suite must pass in CI and include concrete assertions rather than just test names.

### Repository tests

Use a fake HTTP client, a temporary directory and deterministic fixture JSON:

| Case | Expected behaviour |
|---|---|
| No cache, network succeeds | Snapshot saved; status ready; engine receives all fixture vehicles |
| Same revision | No snapshot redownload; last-checked updated |
| Higher/new revision | New snapshot fully validated, then activated once |
| Download interrupted | Previous snapshot still loads; `.part` not activated |
| Wrong hash or invalid JSON | Reject update and retain last valid revision |
| Duplicate vehicle ID or count mismatch | Reject update |
| Unsupported schema version | Reject update; do not delete previous cache |
| Offline launch | Previously stored snapshot usable; no blocking failure |
| Old response arrives after newer revision | Older result must never replace newer active snapshot |
| Two concurrent sync calls | At most one underlying snapshot update per revision |

### Widget/provider tests

- Select make in existing make/model sheet: model options and counters update without a facet-network request.
- Select two colours: both remain selected and the unselected available colour counts are correct.
- Change province: city options update and invalid city selection is cleared.
- Apply and reset price/year/mileage ranges: all other options and local match count refresh.
- Verify old `fetchCarsForFilter()` and `forFilterData` never overwrite snapshot-derived options when feature flag enabled.
- Verify actual listings API still operates and paginates normally; changing options alone does not download the full feed.

### Commands and evidence

From your **complete Flutter project root** (the uploaded archive contains `lib/` only, not the entire project):

```bash
flutter pub get
flutter analyze
flutter test test/features/buy_car/search/vehicle_facet_engine_test.dart
flutter test
```

Also test a release/profile build on a lower-end Android device. Capture: snapshot download bytes, parse time, peak memory, first-facet calculation, per-selection latency, cache retention after forced network failure, current revision, and local matching count. Suggested performance target: most filter taps visibly refresh within 150 ms on a tested low-end device; profile before committing to this threshold.

**Parity test:** the backend should offer a test-only way to fetch all matching vehicle IDs for a fixed revision (or use a database query in backend tests). For the same revision, compare **sets of IDs**, not a paginated first page. If no parity endpoint exists, the backend team must validate representative combinations independently and provide their counts and query traces; do not claim exact parity from the Flutter UI alone.

## Required delivery evidence from Flutter developer

- [ ] New models, repository, engine and test files committed.
- [ ] `SearchProvider` integrated without UI redesign, behind feature flag.
- [ ] Every currently supported filter has a documented backend field or is explicitly hidden/disabled until available.
- [ ] No `all-listings` fetch required to populate locally derived facets.
- [ ] `flutter analyze` and `flutter test` logs supplied.
- [ ] Test fixture assertions cover OR/AND, exclusion, null, ranges, parent-child, empty result.
- [ ] Sync tests cover same revision, new revision, corrupt response, offline and rollback.
- [ ] 30k+ vehicle dataset tested on real Android device; observed memory and latency reported.
- [ ] Compare local vs backend IDs/counts at the same revision; document any mismatches.
- [ ] Listing cards, pagination, sorting, deep links and current filter UI remain unchanged.

## Integration warning

The ZIP only supplies `lib/` and does not include the complete `pubspec.yaml`, test folder, backend source, or a running server. Therefore the code shown here is a source-grounded implementation specification, **not a tested, compiled patch**. The developer must implement concrete typed adapters, run the tests against the full project, and confirm backend parity. Avoid claiming features are working solely because the snapshot loads.
