# App developer: colour mapping on the vehicle detail screen

**Manifest ke existing colour keys aur labels wahi hain. Snapshot vehicles mein additive `color_id` aur detail API mein `colour_id` ab DealerTrade ki numeric ID dete hain (missing ho to null). Existing colour filters, dictionaries, list/card colours aur selected filter values ko change nahi karna. Sirf vehicle detail screen ki colour ko detail API response se map karna hai.**

## Mapping rules

| App area | Read from | Change needed |
|---|---|---|
| Manifest/snapshot download and revision handling | Existing manifest flow | Accept new revision and additive IDs |
| Colour filter options, labels and counts | Existing manifest colour dictionary/options | Same labels; optional `dictionaries.color_ids` mapping |
| Filter requests and selected colour IDs | Existing filter mapping | None |
| Vehicle list/cards and related recommendations | Existing list/card response | None |
| Vehicle detail screen colour label | Detail response `colour` | Map this field |
| Detail specification table colour | Detail response `technicalSpecifications.colour` | Map this field |

Do not write the detail paint name back into the manifest, filter options, selected filters or cached list/card models. Keep the detail response in a separate detail state/cache keyed by vehicle ID.

## Detail request

```http
GET /api/v1/vehicles/{vehicleId-or-slug}
```

Use the existing backend base URL. The app calls this central backend; it does not call DealerTrade directly and does not need a DealerTrade token.

Example shortened detail response:

```json
{
  "id": "1556378",
  "colour": "FROZEN WHITE",
  "colour_id": 15,
  "technicalSpecifications": {
    "colour": "FROZEN WHITE"
  }
}
```

For the website adapter, `GET /api/v1/web/cars/{id}` also returns the detail paint name in `colour` and `technicalSpecifications.colour`.

## Example: one vehicle, two intentional colour labels

The existing stored/filter colour may be `White` and its manifest key may be `white`. The detail API may return `FROZEN WHITE`, `PURE WHITE` or another supplier paint name.

- The filter stays `white`, with its existing label/count.
- The list/card keeps its existing colour.
- The detail screen displays `FROZEN WHITE` exactly as returned by the detail API.
- Returning from detail must not replace a list/card colour or a selected filter with `FROZEN WHITE`.

Do not derive a new manifest ID or add a filter option from the detail paint name. A paint name on the detail screen is a display value, not a filter key. Manifest field `color` and API field `colour` retain their current spellings.

## Screen flow

1. Keep the current manifest/filter initialization as it is.
2. When the user opens a vehicle, request its detail API by ID/slug.
3. Populate the main detail colour label from `detail.colour`.
4. Populate the specifications colour row from `detail.technicalSpecifications.colour`.
5. Keep the original manifest, card data and filter selections unchanged.

If a card has been passed to the detail screen while the detail request is loading, do not treat that card as the final detail response. Refresh the detail model from the actual detail API.

## JavaScript / TypeScript example

```ts
type VehicleDetail = {
  id: string;
  colour?: string | null;
  technicalSpecifications?: { colour?: string | null };
};

function displayColour(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function mapDetailScreen(detail: VehicleDetail) {
  return {
    id: detail.id,
    colourLabel:
      displayColour(detail.colour) ??
      displayColour(detail.technicalSpecifications?.colour) ??
      'Not available',
    specificationColourLabel:
      displayColour(detail.technicalSpecifications?.colour) ??
      displayColour(detail.colour) ??
      'Not available',
  };
}

// Store this in detail-screen state. Do not merge it into manifest/card caches.
const response = await fetch(`${API_BASE_URL}/vehicles/${encodeURIComponent(vehicleId)}`);
if (!response.ok) throw new Error(`Vehicle detail failed: ${response.status}`);
const detail: VehicleDetail = await response.json();
const detailScreen = mapDetailScreen(detail);
```

`API_BASE_URL` includes `/api/v1`. Use the app's existing request/auth/error-handling wrapper where applicable. In Flutter, map the same JSON keys into the detail model; the backend field names do not change.

## Nulls, fallback and caching

The backend already prefers the saved DealerTrade colour and falls back to the existing stored colour when the supplier value is missing/blank/invalid. The app does not need to inspect `sourceData` or perform supplier-colour normalization. Raw source data is not returned in public detail JSON.

If the final response colour is null/blank, show `Not available` or the app's existing empty-state label. Preserve the paint name's casing/spelling for display. Do not force it through the manifest colour dictionary.

Keep existing manifest revision/checksum logic. Supplier paint-name changes alone do not change the manifest payload/revision. Colour ID changes do produce a new immutable snapshot revision. Existing detail results may be cached for up to 300 seconds unless normal invalidation runs; refresh detail data when checking a recently changed supplier value. The snapshot keeps schema_version 1; accept the additive nullable numeric color_id field. Existing filters still use color.

## Acceptance checks

- With manifest colour `white` and detail colour `FROZEN WHITE`, the filter remains `white` and detail shows `FROZEN WHITE`.
- Both detail colour locations agree when populated.
- Missing detail values show an empty-state label rather than crashing.
- Back navigation preserves the original card/list colour and filter selection.
- No additional colour filter options appear after browsing detail pages.
- Existing manifest parsing, revision checks and filter requests remain unchanged.

Backend implementation and source-field sync notes: [detail-colours.md](detail-colours.md).

## DealerTrade colour IDs

Snapshot example: `{ "id": "1556378", "color": "white", "color_id": 15 }`.
Detail example: `{ "id": "1556378", "colour": "FROZEN WHITE", "colour_id": 15 }`.

Keep using `color` and `dictionaries.color` for existing local filters. The additive `dictionaries.color_ids` maps each existing colour key to a sorted array of observed supplier IDs, e.g. `{ "white": [14, 15] }`. Store `color_id` alongside that value; do not replace the dictionary key with the supplier ID. IDs come from the same vehicle's saved DealerTrade record, never inferred from its paint name. Standard IDs map to the existing palette; ID 1 (Any) and ID 14 (mixed supplier paints without a confirmed single base colour) do not fill missing filter colours. A supplier ID can cover multiple paint names and existing filter colours (the live feed returns ID 14 for several distinct paints). Missing/invalid IDs return null. Raw supplier data is never included in snapshots.

A new snapshot revision/checksum is expected when IDs are introduced. Previously downloaded immutable snapshots remain available. Refresh the manifest through the existing revision flow.

Local sync: `node scripts/sync-dealertrade-colour-ids.cjs --source .local/dealertrade-colour-ids/stock-all.json --apply`. This updates source colour IDs on matching vehicle/dealer identities and fills null stored colours for standard IDs (2–13, 15–16). Existing non-null colour/filter labels are preserved, with a backup under `.local/dealertrade-colour-ids/`.
