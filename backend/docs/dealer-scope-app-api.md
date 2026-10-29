# Dealer App API (same API as the ChangeCars app, limited to chosen dealers)

A dealer app (for example a Group One app) uses **exactly the same API calls as the ChangeCars app**, with one
change: put `scope/{dealerIds}/` after `/api/v1/`. Every response then contains only those dealers' cars, dealers,
filters, counts and snapshots. Nothing from any other dealer is returned.

```
ChangeCars app:  https://changecarapi.wowcar.co.th/api/v1/vehicles?page=1
Dealer app:      https://changecarapi.wowcar.co.th/api/v1/scope/3490,3491,3493,3496/vehicles?page=1
```

## 1. Setting the scope

| Rule | Detail |
|---|---|
| Format | `/api/v1/scope/{dealerIds}/{the normal path}` |
| Dealer IDs | DealerTrade dealer numbers, comma-separated, 1 to 20 IDs. Order does not matter |
| One dealer | `/api/v1/scope/3490/...` |
| Group One | `/api/v1/scope/3490,3491,3493,3496/...` (Group1 Cars Midrand, Western Cape, Uitenhage, George) |
| Query strings | Same as the ChangeCars app: `.../scope/3490/vehicles?make=toyota&sort=recent` |
| Auth | Same as the ChangeCars app. Logged-in calls send the same `Authorization: Bearer` token |

Tip: keep the base URL in one place in the app, e.g.
`const API = 'https://changecarapi.wowcar.co.th/api/v1/scope/3490,3491,3493,3496';`, and reuse the ChangeCars
app's API code unchanged.

## 2. What is limited to the dealers

Every public API of the ChangeCars app works under the scope. Examples:

| Screen | Call (after `/api/v1/scope/{ids}`) | Scoped result |
|---|---|---|
| Search / listing | `GET /vehicles?...` (all filters and sorts) | Only these dealers' cars |
| Search button count | `GET /vehicles/count`, `POST /vehicles/count` | Their count |
| Filters and counts | `GET /vehicles/facets`, `GET /vehicles/filters/*`, `GET /vehicles/filters/all` | Only makes, models, colours, provinces, dealers… they have |
| Offline filter snapshot | `GET /vehicle-filters/manifest` then `snapshot_url` | A snapshot of only their cars (see §4) |
| Car detail | `GET /vehicles/{id}` | `404` for a car of another dealer |
| Similar, same dealer | `GET /vehicles/{id}/similar`, `/vehicles/{id}/dealer-vehicles` | Only their cars |
| Specials, hot sellers | `GET /vehicles/specials`, `GET /vehicles/hot-sellers` | Only their cars |
| Website-style car APIs | `GET /web/cars`, `/web/cars/recent`, `/web/cars/featured`, `/web/cars/premium`, `/web/cars/{id}`, `/web/cars/{id}/similar`, `/web/cars/{id}/dealer-cars`, `/web/cars/{id}/popular-dealers` | Only their cars |
| Dealers | `GET /dealers`, `/dealers/groups`, `/dealers/makes`, `/dealers/map`, `/dealers/{slug}` | Only these dealers |
| Makes and models | `GET /catalogue/makes`, `/catalogue/makes/{make}/models` | Only makes they sell (e.g. 27 instead of 88 for Group One) |
| Favourites, recently viewed | `GET /me/favourites`, `/me/recently-viewed` (logged in) | Only saved cars of these dealers |
| Enquiry | `POST /enquiries/...` | Only for their cars; another dealer's car returns `404` |

Content that is not dealer data (banners, articles, FAQs, login, profile, notifications) is the same as in the
ChangeCars app.

## 3. Differences from the ChangeCars app

| Item | In the dealer app |
|---|---|
| `source.total_stock_count`, `source.total` (on `/vehicles`, `/vehicles/count`, the manifest) | `null`. These are DealerTrade's totals for **all** dealers, so they are hidden. Use `meta.total` / `total` / `localTotal`, which count only the dealers' cars |
| "Featured" cars (`/web/cars/featured`) | Cars ChangeCars featured from these dealers first; when there are fewer than `limit`, the rest are random cars of these dealers with a photo. So the section is never empty while the dealers have cars |
| "Premium" cars | Can be empty when the dealers have no car above the premium price |
| Staff and dealer-portal APIs (`/admin/...`, `/dealer/...`, `/web/dashboard/...`, `/dealer-app/...`) | Not available under a scope (`404`) |

## 4. Offline filter snapshot

Same flow as the ChangeCars app:

1. `GET /api/v1/scope/{ids}/vehicle-filters/manifest`
2. Download `snapshot_url` from the response. It already contains the scope, e.g.
   `/api/v1/scope/3490,3491,3493,3496/vehicle-filters/snapshots/inv-….json.gz`.
3. Check `sha256`; re-download only when `revision` changes.

The snapshot holds only these dealers' cars (Group One: about 260 cars, ~17 KB instead of ~2.4 MB). A dealer
app's snapshot cannot be downloaded through the ChangeCars app URL and the other way round (`404`).

## 5. Errors

| Status | Code | When |
|---|---|---|
| `400` | `BAD_REQUEST` | IDs are not numbers, more than 20 IDs, or the scope is empty |
| `404` | `DEALER_NOT_FOUND` | An ID is not an approved dealer. `details` lists the unknown IDs |
| `404` | `NOT_FOUND` | Staff or dealer-portal path under a scope, or a path that does not exist |
| `404` | `VEHICLE_NOT_FOUND` | A car that does not exist or belongs to another dealer |

Every other error (validation, `429`, …) is the same as in the ChangeCars app.

## 6. Quick test

```bash
B=https://changecarapi.wowcar.co.th/api/v1/scope/3490,3491,3493,3496
curl "$B/vehicles?page=1&pageSize=5"      # meta.total = Group One's cars
curl "$B/vehicles/count"                   # same number
curl "$B/vehicle-filters/manifest"         # total = same number, scoped snapshot_url
curl "$B/dealers"                          # the 4 Group One dealers
```
