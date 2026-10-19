# Fresh DealerTrade fetch and local database audit

Fetched on 19 October 2026. This was a read-only remote API fetch and local database audit. No inventory, dealers or source-feed rows were imported, updated or deleted.

## Capture

- Fresh dealers: **767**.
- Fresh unique vehicles: **38,423**.
- Validated dealer partitions: **78/78**.
- API global total at both start and finish: **38,423**.
- The capture is a paginated live traversal, not an atomic frozen source export. Do not delete records solely because they were not observed.

## Missing versus the stored snapshot

- **2,435** fresh vehicle IDs have no previously stored raw DealerTrade record.
- **4** fresh dealers are missing from the local dealer table: 2464, 2711, 3123, 3984.
- **15** previously stored source vehicles are still not imported into the inventory table.
- **583** vehicles previously archived and deleted at the user's request still occur in this fresh API capture. These were kept separate from new missing listings and were not restored.
- Total fresh records absent from the vehicle table: **3,033** = 2,450 other missing listings + 583 intentionally deleted archived listings.
- **1,478** local inventory vehicles were not observed in this fresh traversal. They were not changed or removed.

## Changed values

The source payload schema has no new field names compared with the stored raw payloads. Existing data values have changed: price on **1,289** shared records, mileage on **811**, photo arrays on **486**. The detailed report includes remaining changed fields. Most changed payloads also have a newer `updated_at`; that alone does not mean the listing's substantive fields changed.

Fresh vehicle payloads contain none of `colour`, `color`, `exterior_color`, or `exterior_colour`. Old local colour values are not confirmed by this API fetch.

## Saved files

All capture files are under `backend/.local/dealertrade-live-20261019-fresh/` (git-ignored):

- `dealers.json`: full fresh dealer responses.
- `vehicles.json`: full fresh deduplicated vehicle responses.
- `fetch-report.json`: validated totals, timing and checksum.
- `audit-summary.json`: concise database comparison.
- `database-audit.json`: detailed missing IDs and field changes.

The client dump generated earlier has not been refreshed with this fetched data. A separate import/update is required to include these new or changed records in the local database and a replacement dump.
