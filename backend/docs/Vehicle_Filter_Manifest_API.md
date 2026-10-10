# Vehicle filter manifest and snapshot

`GET /api/v1/vehicle-filters/manifest` is public and returns `schema_version`, `revision`, `total`, `snapshot_url`, `sha256`, `compressed_bytes`, `generated_at`.

Resolve `snapshot_url` against the backend origin, download the bytes, validate SHA256 against the **compressed** bytes, then gzip-decompress and parse JSON. Transport is `Content-Type: application/gzip` without `Content-Encoding: gzip`; explicitly decompress once. Downloads are immutable and survive process restarts because bytes are stored in PostgreSQL. An unknown revision returns 404; never construct sample revisions such as `inv-1042` yourself.

`GET /api/v1/vehicle-filters/snapshots/{revision}.json.gz` returns the gzip file. Revision is content-addressed and changes when filter data changes. Manifest cache is refreshed within 120 seconds, with existing listing namespace invalidation. Existing revisions remain downloadable; the initial implementation does not prune stored snapshots.

Decompressed JSON contains `schema_version`, `revision`, `total`, `dictionaries`, `vehicles`. Every public eligible vehicle is included. `total` is the actual current count, not hardcoded. Draft/sold/unapproved-dealer listings are excluded; reserved stock is included with availability `reserved`.

## Differences from the proposed Flutter plan

- `id` is the existing vehicle UUID string, not an invented numeric feed ID.
- `body_type` is an array of category slugs, since one vehicle may have multiple categories. Use array membership for local filters.
- Make/model/variant dictionaries preserve parents; variant ID is `make:model:variant`. For existing listing requests use variant's final slug with its make/model context.
- City IDs include province and the lowercased city name; dictionary names retain display labels.
- Fuel/transmission/drivetrain retain existing API enum codes. `UNKNOWN` transmission remains an actual stored value; missing nullable specifications remain null.
- Dealer IDs are existing slugs. Province IDs use lowercase hyphenated enum codes; convert to uppercase underscore for listing API.
- Listing search remains `/api/v1/vehicles?make=ford&model=ford:ranger&colour=white&page=1`; comma-separated multi-values are supported, not array query syntax. `/api/v1/cars` is not added.
- Local self-facet exclusion is computed in the Flutter engine. Existing `/vehicles/facets` keeps all supplied filters.
- Listing results do not claim an `inventory_revision`; exact same-revision parity requires further work.

Use manifest checks on app startup/resume, not every filter selection. Keep the previous validated snapshot if refresh fails. No change to the existing `/vehicles/filters/all` endpoint.
