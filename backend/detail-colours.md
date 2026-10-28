# Vehicle colours: filters versus detail pages

The existing stored `Vehicle.colour` remains the canonical colour for search, lists, filter options and immutable filter manifests. It is not overwritten by supplier paint names.

Only vehicle detail responses prefer the vehicle's saved DealerTrade `sourceData.dealertrade.colour`. For example:

| Output | Example |
|---|---|
| Stored `Vehicle.colour` | `White` |
| Manifest `color` and colour filter option | `white` |
| `GET /api/v1/vehicles/{id-or-slug}` → `colour` | `FROZEN WHITE` |
| Same detail → `technicalSpecifications.colour` | `FROZEN WHITE` |
| `GET /api/v1/web/cars/{id}` → `colour` | `FROZEN WHITE` |

The source name is trimmed but its spelling/case is preserved. If the API value is missing, blank, invalid or a missing-value marker, detail falls back to the existing stored colour. No supplier requests are made when loading a page; details use the latest saved source data.

Cards, related recommendations, compare results and dealer inventory keep their existing mappings. Existing immutable snapshot content/revisions remain unchanged when only the supplier colour changes. The detail cache has a new key prefix so previously cached old-format details are not reused after deploying this change. Subsequent source updates can remain in the detail cache for up to its existing 300-second TTL unless normal invalidation runs.

## Local source-field sync

To enrich existing local listings from a fetched DealerTrade array without importing vehicles or changing filter colours:

```sh
node scripts/sync-dealertrade-detail-colours.cjs --source /path/to/stock-observed.json
node scripts/sync-dealertrade-detail-colours.cjs --source /path/to/stock-observed.json --apply
```

The first command creates a plan; the second applies it. This utility is restricted to the configured local `127.0.0.1:55432/changecars` database. It matches vehicle and dealer source identities, skips mismatches and updates only `sourceData.dealertrade.colour`. No deleted vehicles are recreated and no listings are removed. It saves previous source colours for rollback and verifies all stored filter colours plus persisted snapshot revisions/checksums are unchanged.

A changing live capture can be used for this per-ID field enrichment; it must not be treated as an authoritative absence/deletion list. No full inventory reconciliation occurs. Deploying the presentation code alone does not populate a live database's source colour fields; its existing import/reconciliation process must supply the raw DealerTrade colour.

Tests cover main detail, website detail, old-colour fallback, unchanged list cards and unchanged manifest payload/revision when source colours change.
