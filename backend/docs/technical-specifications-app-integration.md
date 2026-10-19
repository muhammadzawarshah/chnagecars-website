# Car Detail technical specifications — app developer integration

This guide covers the 13 technical specification rows on the Car Detail Page. Use the same mapping and formatter on desktop and mobile, including standard and featured listings. The separate Body Type filter guide covers search options, not these specification rows.

## 1. Fetch the selected vehicle

```http
GET /api/v1/vehicles/{slugOrId}
```

Use the selected listing's original DealerTrade vehicle ID, slug or legacy internal UUID. Database primary IDs and public vehicle/dealer IDs now use original DealerTrade IDs stored/serialized as strings; see [the local DealerTrade-only guide](local-dealertrade-only.md). Read `technicalSpecifications` from the returned vehicle object. The detail controller returns the vehicle directly; the website adapter also forwards its `technicalSpecifications` object. Do not look up another listing by make/model to fill missing specifications.

The following is an illustrative response fragment, not a default vehicle and not a captured live response:

```json
{
  "technicalSpecifications": {
    "doors": 5,
    "seats": 5,
    "bodyType": "SUV",
    "colour": "ARKONA WHITE",
    "introductionDate": "2024-01-17",
    "powerKw": 110,
    "cylinders": 4,
    "engineCapacityCc": 1395,
    "turboSupercharged": "T",
    "fuelTankLitres": 50,
    "frontTyreSize": "215/50 R18",
    "rearTyreSize": "215/50 R18",
    "drivenWheels": "4X2"
  }
}
```

Every property can be `null`. Older cached/deployed responses may omit the object or its properties; handle those as missing too. The example values must never be used as fallback values.

## 2. Exact labels, API paths and order

All paths below are relative to the returned vehicle object. Render sections and rows in this exact order. Labels are literal, case-sensitive display strings.

| Section | Row | Exact field label | API path | Type | Example display |
| --- | --- | --- | --- | --- | --- |
| General | 1 | No of Doors | `technicalSpecifications.doors` | number/null | `5` |
| General | 2 | No of Seats | `technicalSpecifications.seats` | number/null | `5` |
| General | 3 | Body Type | `technicalSpecifications.bodyType` | string/null | `SUV` |
| General | 4 | Colour | `technicalSpecifications.colour` | string/null | `ARKONA WHITE` |
| General | 5 | Introduction Date | `technicalSpecifications.introductionDate` | string/null | `17 January 2024` |
| Engine | 1 | Power Maximum | `technicalSpecifications.powerKw` | number/null | `110KW` |
| Engine | 2 | Engine Cylinders | `technicalSpecifications.cylinders` | number/null | `4` |
| Engine | 3 | Engine Capacity | `technicalSpecifications.engineCapacityCc` | number/null | `1395cc` |
| Engine | 4 | Turbo / Supercharged | `technicalSpecifications.turboSupercharged` | string/null | `T` |
| Engine | 5 | Fuel Tank Size | `technicalSpecifications.fuelTankLitres` | number/null | `50L` |
| Handling | 1 | Front Tyres | `technicalSpecifications.frontTyreSize` | string/null | `215/50 R18` |
| Handling | 2 | Rear Tyres | `technicalSpecifications.rearTyreSize` | string/null | `215/50 R18` |
| Handling | 3 | Driven Wheels | `technicalSpecifications.drivenWheels` | string/null | `4X2` |

Finance controls may remain outside the three technical sections. Do not add Year, Mileage, Fuel Type, Transmission or generic Extras rows to this 13-field specification structure.

## 3. Formatting rules

- Use section titles `General`, `Engine`, `Handling`, in that order. Do not apply an automatic uppercase transform to field labels.
- Numeric counts have no unit, grouping separator or forced decimal places: `5`, `4`.
- Power: append uppercase `KW`, with no space: `110KW`. Do not show `110 kW` or `110.0KW`.
- Engine capacity: keep the original cc value and append lowercase `cc`, with no space: `1395cc`. Do not derive it from a rounded litre label such as `1.4L`.
- Fuel tank: append uppercase `L`, with no space: `50L`. Preserve a meaningful fractional value if present, such as `52.5L`; do not force `.0`.
- Colour, tyre values and Driven Wheels: trim outer whitespace and uppercase the value. Preserve internal spaces and symbols, so `215/50 R18` stays `215/50 R18`. Do not change `4X2` to `4x2` or a descriptive phrase.
- Introduction Date: parse a valid date-only `YYYY-MM-DD` and display the numeric day, full English month and four-digit year. Use UTC/date-only parsing to avoid timezone changes. `2024-01-17` becomes `17 January 2024`, without an ordinal, comma or leading zero. Reject impossible dates such as `2024-02-31`.
- Turbo / Supercharged: use the nested value, `T`, `S` or `N`. Do not use the separate top-level `turboSupercharged`, which contains descriptive values such as `TURBO`. Unknown or ambiguous source values remain missing.

## 4. Missing values and listing consistency

Keep all 13 rows and display exactly `Not available` for null, absent or empty values. For numeric specifications also treat non-finite, zero or negative values as unavailable. Never display `0L`, `undefined`, `null`, a guessed introduction date, or a default tyre size.

On navigation between listings, replace the complete specification object with the new listing's response. Key cached detail data by listing slug/UUID and ignore stale responses from the previously selected vehicle. Do not merge non-null specifications from the previous listing into the next one.

Body Type in this table is now the canonical 15-name label resolved from this listing's DealerTrade source ID/code. Preserve its exact capitalization; for example, `Hatchback`, `Coupé`, `SUV`. The same mapping drives the search categories. `bodyTypeRaw` and `bodyTypeId` retain the original source code and ID. See the Body Type integration guide for the full mapping and ambiguous cases.

## 5. Backend mapping reference

This section documents the existing implementation; the app must consume the public properties above rather than request raw feed JSON. `feed` means this vehicle's `sourceData.dealertrade`. `row` means this vehicle's database record. Invalid/empty source values are treated as missing before a documented fallback is considered.

| Public specification property | Backend source priority |
| --- | --- |
| `doors` | `feed.no_doors`, then `row.doors` |
| `seats` | `feed.no_seats`, then `row.seats` |
| `bodyType` | Shared verified DealerTrade source-ID/code mapping; null when unresolved |
| `colour` | `row.colour` |
| `introductionDate` | `feed.introduction_date` only |
| `powerKw` | `feed.kilowatts`, then `row.powerKw` |
| `cylinders` | `feed.cylinders`, then `row.cylinders` |
| `engineCapacityCc` | `feed.engine_capacity`, then `row.engineCapacityCc` |
| `turboSupercharged` | Normalize `feed.turbo_supercharged`: T→T, S→S, N/no→N; otherwise null |
| `fuelTankLitres` | `feed.fuel_tank_size`, then linked `variant.specification.fuelTankLitres` |
| `frontTyreSize` | `feed.front_tyre_size` only |
| `rearTyreSize` | `feed.rear_tyre_size` only |
| `drivenWheels` | `feed.driven_wheels`, then this listing's normalized drivetrain: FOUR_X_TWO→4X2, FOUR_X_FOUR→4X4; FWD/RWD/AWD retain their enum text |

Introduction date and tyre sizes are not borrowed from a shared variant. Fuel tank currently permits a linked specification fallback; the DealerTrade enrichment process only populates that normalized variant field when its source listings agree. Other importers/manual catalogue edits must preserve its accuracy. If that provenance cannot be guaranteed for a listing, the backend should return null instead of relying on an unverified generic model value.

## 6. Shared formatter example

The website already uses `app/lib/cars/technical-specifications.ts` for standard/featured pages at every screen size. A React app in this repository can reuse it directly:

```tsx
import { technicalSpecificationGroups } from "@/app/lib/cars/technical-specifications";

const groups = technicalSpecificationGroups(selectedCar);
// Render groups in array order, then each group's [label, value] rows in array order.
```

For Flutter, Android or iOS, implement the same rules from sections 2–4 in one shared formatter. Keep formatting separate from API parsing so desktop/mobile cannot diverge.

## 7. Verification and release checklist

Verification already performed for the implementation:

- Automated formatter checks cover all 13 labels, example values, section/row order, nulls and invalid dates.
- Formatting checks ran against fields from 100 stored ChangeCars feed listings. These are local stored source records, not fresh live detail API responses.
- Backend tests verify listing-specific values override conflicting variant values, and tyres/introduction dates are not borrowed from shared variants.
- The earlier complete backend run passed 110 tests. These results are separate from the 20 Body Type selector browser checks documented in the Body Type guide.

Repeatable commands, from the repository root:

```sh
node scripts/check-technical-specifications.cjs
npm test --prefix backend -- --runInBand technical-specifications.spec vehicle.presenter.spec public-vehicles.service.spec
```

Before release, complete the following against the running target API and app:

- [ ] Fetch a specific vehicle detail response and compare all 13 properties against that same listing's verified source data.
- [ ] Verify the exact labels and order in section 2 on desktop and mobile.
- [ ] Verify KW/cc/L suffixes, date formatting, capitalized values and tyre spacing.
- [ ] Verify a listing with missing data shows `Not available` consistently.
- [ ] Navigate rapidly between two different listings and confirm no previous vehicle's specifications remain.
- [ ] Verify standard and featured Car Detail Pages display the same specification values for the same listing.
- [ ] Confirm the deployed backend includes `technicalSpecifications` before releasing the app integration.

Live end-to-end technical-detail verification and browser comparison of all 13 rows are not claimed by this document. The configured local backend at `localhost:4000` was unavailable during the later Body Type browser session. That session tested Body Type selectors with controlled facet responses, not Car Detail specifications.
