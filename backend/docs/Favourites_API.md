# User Favourites API

Local base URL: `http://localhost:4000/api/v1`.

First sign in through [Login_API.md](Login_API.md), then send this header with each user request:

```http
Authorization: Bearer <accessToken>
```

## Add, remove and list favourites

All following endpoints require the Bearer token. User identity comes from the token; do not send a userId.

| Method | Path | Response |
| --- | --- | --- |
| PUT | `/me/favourites/<vehicleId>` | `{ "vehicleId": "...", "saved": true }` |
| DELETE | `/me/favourites/<vehicleId>` | `{ "vehicleId": "...", "saved": false }` |
| GET | `/me/favourites?page=1&pageSize=20` | `{ "data": [{ "savedAt": "...", "vehicle": { "id": "...", "isFavourite": true, "...": "public car fields" } }], "meta": { "page": 1, "pageSize": 20, "total": 1, "pageCount": 1 } }` |
| GET | `/me/favourites/ids` | Array of saved vehicle UUIDs (existing endpoint returns at most 1000). Use paginated favourites for a complete larger list. |

PUT/DELETE have no request body and are idempotent: repeating the action does not duplicate a favourite or increment/decrement its count twice. `vehicleId` must be the car's UUID, not its slug. Favourites persist across sessions/devices.

## Favourite state in car APIs

Send the Bearer token with `GET /vehicles`, `GET /vehicles/specials`, `GET /vehicles/hot-sellers`, and `GET /vehicles/<slugOrId>`. Each returned card has `isFavourite: true/false`. Detail recommendations (`moreFromThisDealer`, `youMightLike`) also include the flag. Anonymous calls return false. Flags are read separately from the shared cache, so saving/removing updates the next response without leaking another user's state. Other car endpoints retain their existing response format.

For `/vehicles/filters/all`, keep the shared snapshot and fetch `/me/favourites/ids` separately to mark hearts in app storage. Do not store user-specific favourites inside the shared filter snapshot.

Import `postman/ChangeCars_Login_Favourites.postman_collection.json`, set `baseUrl`, `email`, `password`, and run the register request only for a new account. Then run the Login → Pick a car → Add → Verify → List → Remove → Verify flow. This flow removes the selected favourite at the end, so use a test account. The collection stores access/refresh tokens automatically and picks a public vehicle UUID. New `isFavourite` response fields require rebuilding/restarting the local backend or deployment on hosting.
