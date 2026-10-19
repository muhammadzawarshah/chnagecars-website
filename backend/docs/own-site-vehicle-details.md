# Vehicle details on our own website

The vehicle detail experience stays on `/car/{slug}`. Source URLs are optional reference data and are not used for navigation to render the page.

The web detail response now includes dealer phone/email/rating, saved DealerTrade WhatsApp, source opening hours, public Google/Hellopeter review links, actual additional information and an `insights` object. The existing technical specification mapping and embedded finance calculator remain on the page. Dealer call/WhatsApp links are shared across the main page, enquiry popup, mobile contact bar and featured detail contact bars. Missing contact numbers are not replaced with a generic phone. Unknown dealer ratings are not represented as five stars.

`insights` is also included in the public `/api/v1/vehicles/{id-or-slug}` response:

- `source`: `this-site`.
- `comparableCount`, `averagePrice`, `priceDifference`: other approved, public stock of the same model within one model year, and the same variant when linked. At least three price observations and a known selected model year are required. Positive difference means above average.
- `averageMileage`, `mileageDifference`: same peers, with at least three non-null mileage observations. Zero mileage is valid. Missing selected mileage returns a null difference.
- `daysListed`: age since this installation's `publishedAt`, not an inferred ChangeCars publication date.
- `viewsLast7Days`: flushed local view totals over today and six preceding UTC calendar days. Pending buffered views appear after the view worker flushes.
- `enquiriesLast7Days`: this installation's enquiries over the preceding 168 hours.

No source website analytics are claimed. Comparisons are local asking-price/mileage comparisons, not a formal valuation. Source year/colour gaps remain as unavailable until authoritative data is supplied. The finance calculator is an estimate, not a lender application or approval.

## Validation

19 October 2026: backend build and 204 existing/new tests passed; the additional dealer source whitelist test also passed (205 tests total). Website TypeScript check passed, excluding the separate untracked admin-frontend project. Chromium exercised the actual local page for vehicle 1521740 against the local database at desktop 1440px and mobile 390px. Correct selected dealer phone/WhatsApp, own-page navigation, General specification accordion, embedded finance accordion, reviews, dealer listing filter and mobile enquiry popup passed. No browser page errors or horizontal page overflow occurred.

Deploy both the website and backend changes, with the refreshed dealer data. Website-only deployment cannot expose the new backend response fields; older database dumps omit the refreshed source dealer details.
