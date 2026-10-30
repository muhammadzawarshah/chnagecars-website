# Local vehicle image cleanup — 26 October 2026

- Vehicles before: 37928
- Confirmed coming-soon placeholder vehicles deleted: 379
- Vehicles with genuinely empty image references found/deleted: 0
- Vehicles remaining: 37549
- Dealer and branch counts unchanged: 926 each.
- Cached primary images checked with OCR: 27492
- Visually reviewed placeholder templates: 7.
- Uncached primary images not verified: 10436. Image origin returned HTTP 403, so those vehicles were not deleted merely because remote access failed.

Deleted records: [deleted-coming-soon-vehicles.csv](deleted-coming-soon-vehicles.csv).

Full PostgreSQL backup: [before-image-cleanup-2026-10-26T12-40-04-739Z.dump](.local/image-cleanup-20261026/before-image-cleanup-2026-10-26T12-40-04-739Z.dump). Archive index and SHA-256 were verified before deletion.

Targeted backup including complete deleted vehicle rows and related records: [.local/image-cleanup-20261026/deleted-records-and-relations.json](.local/image-cleanup-20261026/deleted-records-and-relations.json).

Image evidence and deletion report: [.local/image-cleanup-20261026/deletion-report.json](.local/image-cleanup-20261026/deletion-report.json).

Only the configured local database was changed. No live database or fetched DealerTrade snapshot was modified. Local image files were retained. Vehicle image/category relation rows were removed by database foreign-key cascades; dealer records and coordinate fields were not changed. A future upstream re-import can recreate deleted vehicles unless its import policy excludes these IDs/placeholders.
