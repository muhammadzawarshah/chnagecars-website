**DealerTrade / original CHANGECARS source audit — 15 October 2026**

Read-only database audit completed at 2026-10-15T07:19:41.387Z. This report covers the complete local vehicle inventory, stored API records, dealer/branch relationships, source-backed normalized fields, historical XML-only inventory and imported photo galleries.

The database matches the checked fields from the stored import. Independent current equality with the original client website is **not established**: detail-page requests are blocked by Cloudflare, and the live API changed during pagination.

| Check | Result |
| --- | --- |
| All local vehicle rows read | 42,134 |
| All local dealer rows read | 765 |
| Original API vehicle records compared | 38,204 |
| Original API dealer records compared | 763 |
| Complete raw JSON records matching the imported snapshot | 38,967 / 38,967 |
| Normalized API inventory rows checked | 38,189 |
| Field/relationship/gallery checks | 3,613,880 |
| Database import mismatches detected | 0 |
| Local image file mismatches detected | 0 |
| Gallery references checked | 694,721 |
| Existing local photo references | 25,516 |
| Remote photo references, not downloaded | 669,205 |

**Inventory needing source confirmation**

3,936 older XML-feed vehicles remain published and are outside the imported DealerTrade snapshot. Their saved XML payloads and source-backed normalized fields match the historical source. All 3,936 legacy photo references were also checked; two use previously reported unavailable-image placeholders. Current availability is unverified. Absence from the API has not been interpreted as sold or deleted. Nine records without feed provenance are archived setup demos.

15 API cars are retained as complete raw records because their dealers could not be safely resolved. No unrelated dealer was substituted.

**Changes observed in the live API**

All 383 pages were visited, but reported totals changed from 38,204 to 38,283. The deduplicated traversal contains 38,101 observed identities, including 52 not in the saved import. 155 imported IDs were not observed in this changing traversal; this is not proof of removal. This observation is explicitly non-atomic and cannot be used as a complete import snapshot.

13 vehicles have observed business-field changes: 7 price changes, 7 mileage changes, 2 condition/type changes and 1 comment change. 739 records changed when including timestamp-only updates. Dealer source records are unchanged.

| Vehicle source ID | Stored/imported price (ZAR) | Observed API price (ZAR) |
| --- | --- | --- |
| 1554191 | 634,900 | 569,900 |
| 1552278 | 286,925 | 229,900 |
| 1552277 | 285,545 | 229,900 |
| 1548876 | 879,300 | 719,900 |
| 1548868 | 267,490 | 199,900 |
| 1548866 | 661,135 | 579,900 |
| 998514 | 349,000 | 359,900 |

These are changes since import, separately classified from import mistakes. The audit did not update inventory.

**Source completeness limits**

The source API omits car year and colour and provides no documented numeric fuel dictionary. Among normalized API cars: 16,380 years are null, 12,114 colours are null and 38,189 normalized fuel values remain OTHER. The original numeric fuel IDs are retained. Historical XML-backed years and mapped colours were checked for 21,809 and 26,075 cars respectively; this establishes historical source fidelity, not current independent website verification.

For 4,037 source cars, reported image_count differs from the number of explicit photos[] URLs (4,037 report more photos; 0 report fewer). One source gallery repeats a photo URL. The database matches the explicit photos[] array. Full gallery completeness needs the original site's accessible gallery or authoritative source export.

Across the complete inventory, 17,239 years are null, 12,114 colours are null and 42,125 fuel values remain OTHER. These include older XML-only listings.

**Original website access**

Direct homepage and car-detail requests to https://www.changecars.co.za returned HTTP 403 with a Cloudflare block page. Five car detail URLs, the sitemap, robots.txt and the catalogue page were inaccessible through the browsing tool. A browsable homepage aggregate is not a per-car source snapshot and was not used to certify data equality. The user confirmed that the client can arrange allowlisting; application of that rule has not yet been confirmed.

**Detailed evidence**

- [Full audit JSON](../.local/dealertrade-audit/audit-report.json)
- [Per-record difference CSV](../.local/dealertrade-audit/differences.csv)
- [Source image metadata warnings](../.local/dealertrade-audit/source-warnings.json)
- [Inventory not observed in the live API traversal](../.local/dealertrade-audit/legacy-not-in-fresh-api.json)
- [Missing source field records](../.local/dealertrade-audit/missing-source-fields.json)
- [Cloudflare evidence and allowlist request details](../.local/dealertrade-audit/website/evidence.json)
- [Client allowlist request text](../.local/dealertrade-audit/website/allowlist-request.txt)

Re-run the independent website comparison after client access is confirmed. A consistent source database export or read-only source connection is required if exact equality at one point in time is needed while live inventory continues changing.
