# Dealer directory API

Powers the "Search Car Dealers" page. Base URL: `https://changecarapi.wowcar.co.th/api/v1`. No token needed.

## Endpoints

| Endpoint | Use |
|---|---|
| `GET /dealers` | Dealer cards, paginated (`page`, `pageSize` up to 100). Only approved dealers with cars on sale, like changecars.co.za |
| `GET /dealers/groups` | "Dealer Group" dropdown: `{ total, groups }`. `total` is the "All (n)" count; the first group is "Non-Franchised Dealers" |
| `GET /dealers/makes` | Make/model picker: each make and model with `dealerCount` (dealers selling it). Pass `make` or `model` (its `value`) to `/dealers` |
| `GET /dealers/map` | Map view: every matching dealer with `latitude`/`longitude`, no paging. Takes the same filters as `/dealers` |
| `GET /dealers/{slug}` | One dealer with all branches and `activeListings` |

## Filters on `GET /dealers`

All filters can be combined.

| Page control | Query | Example |
|---|---|---|
| Search Dealer Name | `q` | `q=group1` |
| Search by Province | `province` | `province=Gauteng` |
| Dealer Group | `group`: IDs or slugs from `/dealers/groups`, comma-separated. `non-franchised-dealers` means dealers in no group | `group=134` or `group=group-1,non-franchised-dealers` |
| Make / Model / Variant | `make` (make slugs) and `model` (`make:model`), comma-separated. Returns dealers that currently list such cars | `make=abarth,ford`, `model=abarth:124` |
| A–Z | `letter`: one letter, or `#` (URL-encoded `%23`) for names starting with a number | `letter=A` |
| Dealers that sell with on-road costs included | `onRoadCosts=true` | |
| Motor Bike Dealers | `motorbike=true`: dealers listing motorbikes, or in a bike dealer group | |
| Vehicle Concierge Service | `concierge=true` | |

## Dealer fields

Each dealer has its usual fields (`id`, `name`, `slug`, `logoUrl`, `address`, `city`, `province`, `phone`, `email`, `whatsappNumber`, `rating`, `plan`) plus:

| Field | Meaning |
|---|---|
| `activeListings` | Cars on sale ("Vehicles Available") |
| `groups` | `[{ id, name, slug, logoUrl }]` from DealerTrade, e.g. `Group 1`, `Toyota Dealer` |
| `conciergePartner` | `true` for Vehicle Concierge Service partners (concierge icon) |
| `onRoadCostsIncluded` | `true` when advertised prices include on-road costs |
| `latitude`, `longitude` | Head office (or first branch) location for the map view; `null` when unknown |

## Example

```bash
curl "https://changecarapi.wowcar.co.th/api/v1/dealers?province=Gauteng&concierge=true&letter=H&page=1&pageSize=20"
```

```json
{
  "data": [
    {
      "id": "3490",
      "name": "Group1 Cars Midrand",
      "slug": "group1-cars-midrand-3490",
      "activeListings": 74,
      "groups": [{ "id": "134", "name": "Group 1", "slug": "group-1", "logoUrl": "https://www.changecars.co.za/images/200/dealer_categories/241219/gpi-lg.png" }],
      "conciergePartner": true,
      "onRoadCostsIncluded": false,
      "latitude": -25.977052499529,
      "longitude": 28.131768399911
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 13, "pageCount": 1 }
}
```

## Data notes

- Groups and the concierge flag come from DealerTrade and follow its sync. A sync change can take about a minute to show.
- DealerTrade does not send on-road costs. Admins set it with `PATCH /admin/dealers/{id}` and `{ "onRoadCostsIncluded": true }`. Until then `onRoadCosts=true` returns no dealers.
- `rating` is empty for all dealers; DealerTrade does not send ratings.
