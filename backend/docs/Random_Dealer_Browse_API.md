# Random dealer browse

`GET /api/v1/vehicles` without `dealer`, `branchId` or an explicit `sort` selects a random approved dealer with vehicles matching the supplied filters. It returns up to `pageSize` cars (default 20, maximum 50) belonging only to that dealer, ordered by recent publication.

Each such request starts at page 1, even if `page` is supplied. `meta.total` and `meta.pageCount` describe the selected dealer's matching stock. The response includes `selectedDealer` containing the dealer summary, or null when no vehicles match. Dealers with fewer than 20 matching cars return fewer than 20.

For the next page of the same dealer, send `GET /api/v1/vehicles?dealer=<selectedDealer.slug>&page=2&pageSize=20`. An explicit dealer, branch or sort retains the existing search and pagination behavior. Use `sort=recent` to browse all dealers in the existing order.

Random browse bypasses the search response cache, and the list endpoint sends `Cache-Control: private, no-store`. Consecutive selections within the same API process avoid the previous dealer when another eligible dealer exists. With multiple API replicas, a dealer can repeat across replicas; a single eligible dealer necessarily repeats.

```bash
curl -sS '<BASE_URL>/api/v1/vehicles?pageSize=20' | jq '{selectedDealer, meta, dealers: [.data[].dealer.slug] | unique}'
```
