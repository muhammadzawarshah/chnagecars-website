# App colour filtering and stock counts

This guide covers the public app API changes for DealerTrade inventory. Paths include `/api/v1`; prepend the deployed backend host. Public search, colour options and source-summary requests do not require a dealer app token.

## Standard colour IDs

| ID | Name | Hex code |
|---:|---|---|
| 1 | Any | — |
| 2 | Beige | #C9B89A |
| 3 | Black | #000000 |
| 4 | Blue | #2A6FDB |
| 5 | Brown | #7A4E2E |
| 6 | Gold | #D6A743 |
| 7 | Green | #2F8D4E |
| 8 | Grey | #8A8A8A |
| 9 | Orange | #E6782F |
| 10 | Pink | #D86197 |
| 11 | Purple | #8257C7 |
| 12 | Red | #C9433D |
| 13 | Silver | #A9A9A9 |
| 14 | Unknown | #DDDCDC |
| 15 | White | #FFFFFF |
| 16 | Yellow | #DCC73A |

## Colour options and stock counts

Use `GET /api/v1/vehicles/filters/colours`. It returns exactly the 16 DealerTrade list_colours entries, including zero-stock colours:

```json
{
  "total": 44426,
  "stockCount": 44426,
  "options": [
    {"id":1,"name":"Any","afrName":"Enige","hexCode":"","slug":"any","value":"any","count":44426,"stockCount":44426},
    {"id":15,"name":"White","afrName":"Wit","hexCode":"#FFFFFF","slug":"white","value":"white","count":13288,"stockCount":13288}
  ]
}
```

Counts above are examples; use the returned values. The endpoint accepts the same criteria as search so counts reflect the current selection. Any (ID 1) means no colour restriction; its count is the complete matching stock count. ID 14 means Unknown. It includes stock with no verified standard colour. Unknown paint names are never guessed into White/Grey/etc.

## Search by colour ID

- White: `GET /api/v1/vehicles?colourId=15`
- White or Black: `GET /api/v1/vehicles?colourId=15,3`
- Any: `GET /api/v1/vehicles?colourId=1`
- Unknown: `GET /api/v1/vehicles?colourId=14`
- Count only: `GET /api/v1/vehicles/count?colourId=15`

`colour_id` and `color_id` are aliases for `colourId`. Values must be comma-separated IDs from 1 through 16. Invalid IDs return HTTP 400. Existing name-based `colour=White` filtering continues to work. Saved searches use the same matching rules.

Vehicle responses include `colourId` for standard filtering. `colour` on a detail response can be the specific paint name (e.g. Frozen White), while `colourId` remains its standard group. Existing `colour_id` retains the upstream source ID; use `colourId` for app filters, particularly when the upstream ID is missing or Any. Bulk filter data also includes per-vehicle `colourId` and all colour options with counts. Compressed snapshots provide canonical `color_id` values and `options.colour` counts.

## Which stock count to display

Vehicle lists return the local filtered count as `meta.total` and `meta.stockCount`; `meta.source.total_stock_count` is the independent upstream count. `GET /api/v1/vehicles/source-summary` returns the upstream counts and update time.

The count-only endpoint returns `{ "total": 13288, "count": 13288, "formatted": "13 288" }` (example values).

Example source summary:

```json
{
  "source": "dealertrade",
  "total_stock_count": 38696,
  "last_updated": "2026-10-27 09:14:20",
  "total": 39020,
  "fetchedAt": "2026-10-27T08:15:00.000Z"
}
```

Use `meta.stockCount` for the matching local search count and each colour option's `stockCount` for its badge. Use `meta.source.total_stock_count` to display the upstream reported stock count. Its `total` is the separate upstream pagination total. These values can differ; do not replace the local pagination count with a source count. `last_updated` is the original upstream timestamp without an assumed timezone; `fetchedAt` is ISO UTC. Missing source values are null. Stock is refreshed automatically every 12 hours while the backend is running.

## Detail fields and display text

Human-readable inventory titles, descriptions, names, addresses and cities are stored in title case. Supplier paint names, comments and extras are formatted in title case when presented. For enum values, display `conditionLabel`, `fuelTypeLabel`, `transmissionLabel` and `bodyTypeLabel`; retain the original enum fields for filtering. URLs, email addresses, identifiers and source snapshots retain their original values. The scheduled sync applies the same normalization to future updates.

Additional public vehicle fields are `videoUrl`, `priceOnApplication`, `extras`, `comment`, `sourceCreatedAt`, and `sourceUpdatedAt`. Missing values are null. `videoUrl` permits HTTPS URLs only. Source timestamps retain the upstream string format.

For example, display `fuelTypeLabel: "Petrol"` instead of the filter code `fuelType: "PETROL"`, and `transmissionLabel: "Automatic"` instead of `transmission: "AUTOMATIC"`. Do not apply CSS uppercase to these labels or the returned title/description. A colour detail can read `colour: "Frozen White"` while `colourId: 15` remains the ID used for filtering.

## App implementation checklist

1. Load the colour options; render `name`, `hexCode` and `stockCount`, including zero-stock options.
2. Send selected IDs as `colourId=15,3`; select ID 1 to clear the colour restriction.
3. Use returned `colourId` for selected state and local filtering, rather than matching the detail paint name.
4. Use local `meta.total` for pagination and local counts; label upstream counts separately.
5. Display returned text and `*Label` fields directly; handle null values as unavailable.
