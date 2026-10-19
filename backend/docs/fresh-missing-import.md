# Fresh DealerTrade missing-record import

Applied only to local `127.0.0.1:55432/changecars`, on 19 October 2026.

- New vehicles created: **2,427**.
- New dealers created: **4**.
- Complete new source payloads preserved: **2,435**.
- Image/gallery records added: **37,242** (source image URLs; no image download was performed).
- Existing vehicle business rows changed: **0**; existing dealer rows changed: **0**.
- Previously deleted archived IDs were excluded by selecting only IDs absent from the historical source table.

## Zero-price source records

Eight records have source price 0. The inventory table requires a strictly positive price. Their full unmodified payloads were saved in `source_feed_records`, but no price was invented and no inventory listing was created.

| Source vehicle ID | Reason |
| --- | --- |
| 1559202 | Missing/POA/nonpositive price; raw record retained |
| 1559200 | Missing/POA/nonpositive price; raw record retained |
| 1559201 | Missing/POA/nonpositive price; raw record retained |
| 1558610 | Missing/POA/nonpositive price; raw record retained |
| 1558609 | Missing/POA/nonpositive price; raw record retained |
| 1557263 | Missing/POA/nonpositive price; raw record retained |
| 1531632 | Missing/POA/nonpositive price; raw record retained |
| 1430410 | Missing/POA/nonpositive price; raw record retained |

## Backup and repeatability

Verified full pre-import backup and detailed reports: `backend/.local/missing-import/2026-10-19T06-37-46-221Z`.

`backend/scripts/import-fresh-missing.cjs --apply` stages only previously unseen source IDs and missing dealers, verifies a full local backup, invokes the shared DealerTrade importer in guarded new-only mode, and checks existing records and original source IDs afterward. A second run finds no new source records, including the eight retained raw-only rows.

This import did not update existing price/mileage values, restore deleted archived records, or import the separate 15 historically raw-only listings. Those are separate data reconciliation tasks. The previously delivered client dump predates this import and requires a fresh export to include it.
