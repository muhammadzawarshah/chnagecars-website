**API-authoritative database reconciliation — 15 October 2026**

Completed verification at 2026-10-15T08:57:03.148Z. Nonempty values from the captured API rows were applied. Null, blank, absent and empty collection values preserved existing data. Zero and false were treated as valid values.

| Result | Count |
| --- | ---: |
| API vehicle rows checked | 38,241 |
| Existing inventory rows updated | 38,031 |
| New inventory rows created | 195 |
| Dealer rows verified | 763 |
| Nonempty API value checks | 1,713,874 |
| Empty API value preservation checks | 172,143 |
| Typed inventory/dealer column checks | 2,013,070 |
| Preserved inventory column checks | 1,906,528 |
| Gallery references checked | 695,423 |
| Unobserved inventory rows preserved | 4,103 |
| Failed writes | 0 |
| Verification mismatches | 0 |

All 49 supplied API columns are represented in reconciled source JSON. Typed columns receive their supported mappings. API stock numbers are now copied exactly even when the provider repeats one code for several cars; the dealer/stock-number uniqueness restriction was changed to a normal index. Vehicle UUIDs, existing slugs, application state and unrelated values were preserved.

Existing price updates: 205; mileage: 211; condition: 28; stock number: 36,778. Specifications, transmission/drivetrain, descriptions, reported image counts, catalogue links and raw source fields were also reconciled where provided. See the CSV for every changed field.

15 rows have no resolvable source dealer and remain fully stored in the source-record table. Their source data was updated and verified, without inventing dealers.

Typed-field exceptions are recorded explicitly: API mileage -4 for vehicle 1532910 cannot fit the nonnegative mileage constraint, so its existing typed value was preserved and -4 remains in exact source JSON. Fifty-one variant groups have missing/invalid introduction years or inconsistent names, preventing safe new typed catalogue associations. Two shared variant door-count definitions conflict between source rows, and one shared catalogue name has source aliases; exact per-vehicle API values remain available. Numeric fuel IDs are retained without guessing an undocumented fuel enum dictionary. Missing car year/colour values were preserved.

The source is live and was captured in 77 validated dealer partitions plus a refreshed global head. It is not a provider-wide atomic snapshot. No missing/unobserved vehicle was deleted or marked sold. Original responses and partition evidence are retained.

Blank preservation tests: 5 passed. Backend typecheck passed. The verification separately checked every nonempty source value, preserved empty values, direct mapped columns, branch/catalogue relationships, custom/protected image data and all untouched rows.

**Artifacts**

- [Verification report](../.local/dealertrade-reconcile/verification-report.json)
- [Every changed field, before/after CSV](../.local/dealertrade-reconcile/changes.csv)
- [API column mapping](../.local/dealertrade-reconcile/field-mapping.json)
- [Typed exceptions and raw-only rows](../.local/dealertrade-reconcile/exceptions.json)
- [Applied changes summary](../.local/dealertrade-reconcile/apply-report.json)
- [Source capture evidence](../.local/dealertrade-reconcile/source/fetch-report.json)

A full pre-update database backup is retained under `.local/backups/pre-api-reconcile-*.dump`.
