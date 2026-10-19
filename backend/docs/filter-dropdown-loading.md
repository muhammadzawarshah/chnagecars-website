# Filter dropdown loading

The website's multi-filter form uses `/api/vehicles/facets`, which proxies the backend `/api/v1/vehicles/facets`. The mobile/offline snapshot API remains `/api/v1/vehicle-filters/manifest` plus its returned `snapshot_url`; the website form is not a snapshot consumer.

The website previously hit its 10-second server fetch timeout while the cold facets endpoint ran many inventory aggregations. The proxy returned HTTP 502, leaving option lists empty. Facets now reads matching public filter fields once and builds counts with the same filter-data builder used for full filter data. Response field names and values remain compatible. Only this proxy allows a 30-second cold-load budget; other website fetch timeouts are unchanged.

The full filter page now renders all configured additional controls. Cylinders and Specials have explicit option mappings. Cylinder selections are included in dependent queries, and Not on special sends `onSpecial=false`. Dealer option labels show names while selected values remain the existing dealer slugs. Loading, missing source data and errors are distinct; an error has a working Retry action.

Year and colour remain empty when no source values exist. No example values are inserted to fill these lists.

Validation on 19 October 2026: backend build and 207 tests passed; website TypeScript check passed. Actual local facets and proxy returned HTTP 200 with 85 makes, 644 models, 3,978 variants and nine cylinder options. Chromium tested desktop 1440px/mobile 390px fuel, cylinders, specials and missing-colour states, plus controlled HTTP 502 and successful Retry recovery. No browser page errors occurred.
