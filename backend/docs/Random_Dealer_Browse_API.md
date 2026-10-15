# Stable mixed dealer browse

`GET /api/v1/vehicles` and `GET /api/v1/vehicles?sort=recent` return cars from multiple dealers in a stable order. Each dealer contributes one car per round; cars within a dealer remain newest first, with vehicle ID as a tie-breaker. Dealer order follows its newest matching car.

Interleaving happens before pagination. `page` and `pageSize` retain their normal meaning, and `meta.total` counts all matching cars. Repeated calls return the same order while matching inventory is unchanged. Inventory changes can move cars between pages. There is no per-request random selection or `selectedDealer` field.

Dealer and branch filters retain normal stock ordering. Other explicit sorts (price, mileage, year, popularity, nearest) and the default hot-sellers popularity order retain their existing behavior. All normal filters and public visibility rules still apply. Pages mix dealers while multiple dealers have remaining cars; the final pages may contain only one dealer when other dealers run out of stock.

```bash
curl -sS '<BASE_URL>/api/v1/vehicles?page=1&pageSize=20&sort=recent' | jq '{meta, dealers: [.data[].dealer.slug] | unique}'
curl -sS '<BASE_URL>/api/v1/vehicles?page=2&pageSize=20&sort=recent' | jq '{meta, dealers: [.data[].dealer.slug] | unique}'
```
