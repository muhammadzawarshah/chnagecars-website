# Vehicle fields: app integration

For exact Car Detail technical specification labels, nested API mappings, units and display order, see [Technical specifications — app developer integration](technical-specifications-app-integration.md).

The public API now adds the following top-level fields to vehicle cards and detail responses. Existing fields remain available. No database migration is required: values come from the stored feed and existing variant specifications.

Use `GET /api/v1/vehicles` for search and `GET /api/v1/vehicles/:slug` for details. Keep the existing response envelope and pagination handling.

| Field | Type | Meaning |
| --- | --- | --- |
| `gears` | number or null | Number of gears |
| `turboSupercharged` | string or null | `TURBO`, `SUPERCHARGED`, `NONE`, or `FORCED_INDUCTION` (source says yes without specifying which) |
| `bodyTypeId` | string or null | Original source body-type ID; not a category UUID |
| `bodyType` | string or null | Source body-type label |
| `frontTyreSize` | string or null | Front tyre size |
| `rearTyreSize` | string or null | Rear tyre size |
| `fuelTankLitres` | number or null | Fuel-tank capacity in litres |
| `drivetrainSourceId` | string or null | Original source driven-wheels ID |
| `mmcode` | string or null | MMCode; preserve leading zeroes |
| `stockNumber` | string or null | Dealer stock reference |
| `additionalInformation` | string or null | Source additional information, falling back to listing description |
| `sourceVehicleId` | string or null | This individual listing's source vehicle ID |

`drivetrain` continues to provide the normalized drivetrain enum. `categories` now also includes each category's `id`, alongside `slug` and `name`. Use category slugs for body-type filtering.

## App display

Read these properties directly from each vehicle. Hide rows whose value is `null`; unknown turbo data must not be displayed as “No turbo”. Treat source IDs, stock numbers and MMCode as strings. Do not use `variant.specification.extra.sourceVehicleIds` as the listing's identity: that array belongs to a shared variant.

For the photo gallery, fetch the detail endpoint and use its existing `images[]` array (`url`, `thumbnailUrl`, `mediumUrl`, `largeUrl`, `altText`, `isPrimary`). Cards continue to provide `primaryImageUrl` and `imageCount`; gallery images are not added to search cards.

Example properties (illustrative):

```json
{
  "gears": 7,
  "turboSupercharged": "TURBO",
  "bodyTypeId": "29",
  "bodyType": "X/O",
  "frontTyreSize": "195/60 R16",
  "rearTyreSize": "195/60 R16",
  "fuelTankLitres": 37,
  "drivetrainSourceId": "4",
  "mmcode": "04035331",
  "stockNumber": "ST-1",
  "additionalInformation": "Dealer notes",
  "sourceVehicleId": "1556378"
}
```

## Filters and rollout

This update exposes missing response fields; it does not add new search parameters. Existing `category=suvs` and `drivetrain=FOUR_X_FOUR` filters remain supported. Do not send gears, tyre, MMCode, stock-number or turbo filters.

Deploy the backend before integrating these fields. Existing cached responses may retain their previous shape until their cache TTL expires; the detail cache TTL is 300 seconds. The app should tolerate absent fields during rollout as well as explicit nulls. Raw source data, VIN and registration are not added to responses.

Verification: request a list, open one returned slug, check the field types above, and confirm the gallery loads from detail. Coverage depends on the source; a null is expected when no verified value exists.
