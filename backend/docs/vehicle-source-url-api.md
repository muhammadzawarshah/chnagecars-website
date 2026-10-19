# Original vehicle URL

Vehicle and website car responses include:

- `singleVehicleUrl`: original DealerTrade `single_vehicle_url` path/string.
- `sourceUrl`: full HTTPS URL on `www.changecars.co.za`.

Both fields are nullable. Only trusted ChangeCars vehicle links whose final path segment matches the DealerTrade vehicle ID are returned. Missing or invalid links return null.

Example for listing 1521740:

```json
{
  "singleVehicleUrl": "new-or-used-cars-for-sale/mpumalanga/lydenburg/suv/suzuki-cars/xl6/1-5-gl/1521740",
  "sourceUrl": "https://www.changecars.co.za/new-or-used-cars-for-sale/mpumalanga/lydenburg/suv/suzuki-cars/xl6/1-5-gl/1521740"
}
```

This exposes stored source links; it does not scrape or import the linked page. Full website enrichment for all vehicles remains pending: the attempted reference page returned HTTP 403 with a Cloudflare challenge. Website market comparisons, seven-day activity and page-only specifications require an accessible authoritative source and must not be populated from a different vehicle or local approximations.
