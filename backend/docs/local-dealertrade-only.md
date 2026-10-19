# Local DealerTrade-only inventory and original public IDs

This change was applied only to the project's local database: `127.0.0.1:55432/changecars`. Railway and the live database were not modified.

## Local cleanup result

- Deleted 3,918 Fbook-only vehicles and one eligible orphan Fbook-only dealer.
- Preserved all 38,402 DealerTrade vehicle rows. A full-row fingerprint comparison inside the deletion transaction found zero changes to those retained rows, including names, internal IDs and dealer links.
- Preserved nine unrelated archived setup/demo records in storage; public inventory requires a DealerTrade source payload and excludes them.
- The public API currently lists 36,866 visible vehicles and 763 DealerTrade dealers. Remaining DealerTrade vehicles are subject to their existing status and visibility rules.
- A verified PostgreSQL custom-format backup was created before deletion under `backend/.local/dealertrade-only/before-cleanup-*.dump`. The exact backup path and deletion counts are in `cleanup-report.json` in the same directory. Backups and these local reports are git-ignored.

Fbook-only means a listing has `sourceData.vehicle_id` but no `sourceData.dealertrade.vehicle_id`. Shared imported listings must be retained. A legacy `fbook` slug or UUID namespace is not evidence of Fbook-only provenance.

## Original IDs returned by the API

Vehicle `id` and dealer `id` in public HTTP responses now use the original DealerTrade `vehicle_id` and `dealer_id`, serialized as strings. Example from the local API:

```json
{
  "id": "1556517",
  "sourceVehicleId": "1556517",
  "title": "Audi Q3 35 Tdi S Tronic",
  "dealer": {
    "id": "3095",
    "name": "Audi Centre Somerset West"
  }
}
```

Names, titles and existing slugs are preserved. Vehicle IDs and dealer IDs are separate identity spaces: always use a vehicle ID for vehicle endpoints and a dealer ID for dealer endpoints. The actual database `vehicles.id`, DealerTrade `dealers.id`, and their foreign keys now store the original DealerTrade IDs as text. The migration cascaded all references and preserved names, source data and record counts. Legacy UUID aliases are retained only for compatibility with old links. User, image, catalogue and other unrelated entity IDs remain UUIDs; one native demo dealer without a DealerTrade identity retains its own ID.

Supported examples:

```http
GET /api/v1/vehicles/1556517
GET /api/v1/vehicles/1556517/similar
GET /api/v1/vehicles/1556517/dealer-vehicles
GET /api/v1/vehicles/1556517/market-price
GET /api/v1/vehicles/compare?ids=1556517,1484951
GET /api/v1/vehicles?dealer=3095
GET /api/v1/dealers/3095
GET /api/v1/web/cars/1556517
PUT /api/v1/me/favourites/1556517
```

Enquiry request bodies accept original source IDs in `vehicleId` and `dealerId`. Website forms accept the original vehicle ID in `carId`. Existing vehicle UUID/slug lookups and legacy 32-character website IDs remain compatible. Vehicle/dealer validations and dealer-portal queries also support the new text IDs. Auth user/session IDs remain UUIDs.

The legacy identity cache is refreshed at most every 60 seconds from stored DealerTrade vehicle payloads, verified dealer snapshots and `dealertrade_id_aliases`; it never calls Railway or an external feed API. Duplicate/conflicting source identities fail rather than silently attach a vehicle to another dealer.

The old `db:seed:fbook` importer now refuses to run, preventing accidental reintroduction of Fbook-only inventory. Continue using the existing DealerTrade importer.

## Verification

- 15 local API/database checks passed, including comparison of 25 detail responses against the selected stored listing's original source IDs, dealer link, title and dealer name.
- Original numeric-ID lookups, legacy slug/UUID lookups, web detail, compare, similar, dealer stock, market price, dealer directory and count/list consistency were checked through real local HTTP requests.
- Unknown source IDs return 404.
- The final backend suite passed all 137 tests across 21 suites; the backend build also passed.

```sh
node backend/scripts/local-dealertrade-only.cjs        # read-only local cleanup plan
node backend/scripts/verify-local-dealertrade.cjs      # requires local API on port 4000
npm test --prefix backend -- --runInBand
npm run build --prefix backend
```

The cleanup script only permits the exact local database above. `--apply` creates and verifies a fresh backup before deleting, locks the affected tables, preserves DealerTrade fingerprints and rolls back on validation failure. Re-running after cleanup finds zero Fbook-only vehicles.

To restore if needed, stop the local API, select the recorded backup and use `pg_restore` against an appropriate local restore target. The backup contains the full pre-cleanup database, not only deleted vehicles.

## Subsequent archived cleanup

After the inventory cleanup described above, 1,543 archived vehicles (1,534 DealerTrade and 9 setup/demo) were separately backed up and deleted. See [archived vehicle backup and restore instructions](archived-vehicles-backup.md). The earlier 38,402 preserved count describes the state before that later archived cleanup.
