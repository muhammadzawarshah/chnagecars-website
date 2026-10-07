# ChangeCars Backend

NestJS 11 · Prisma 7 · PostgreSQL · Redis · S3-compatible object storage.

This is a modular backend for the ChangeCars marketplace. It implements the platform requirements (FR-01 to FR-57, NFR-01 to NFR-17, BR-01 to BR-14) and follows the Backend Architecture & Implementation Brief.

- Developer guide (PDF, every endpoint in simple English): [docs/ChangeCars_Backend_API_Guide.pdf](docs/ChangeCars_Backend_API_Guide.pdf)
- API docs (Swagger UI): `http://localhost:4000/docs`
- OpenAPI JSON: `http://localhost:4000/docs/openapi.json`
- All endpoints live under `/api/v1`. Health probes are `/health/live` and `/health/ready`.

---

## 1. Quick start

### Option A: everything in Docker

```bash
cp .env.example .env               # then set JWT_ACCESS_SECRET
docker compose up --build          # postgres, redis, minio, migrate, api, worker
docker compose run --rm api npx prisma db seed
```

### Option B: run Node locally

Requirements: Node 20.19+ (tested on Node 24), PostgreSQL 15+ (tested on 18), optional Redis 7 and MinIO/S3.

```bash
npm install                        # also runs `prisma generate`
cp .env.example .env               # set DATABASE_URL and JWT_ACCESS_SECRET
npx prisma migrate deploy          # create the schema
SEED_DEMO=true npm run db:seed     # reference data + demo dealer/customer/vehicles
npm run start:dev                  # API on :4000
npm run worker:dev                 # background worker (or set RUN_WORKER_IN_API=true)
```

The seed prints the super-admin password unless `SEED_ADMIN_PASSWORD` is set. Demo accounts use the password `Password123`:

| Role | Email |
|---|---|
| Super admin | admin@changecars.co.za |
| Dealer owner | owner@demo-dealer.co.za |
| Dealer sales staff | sales@demo-dealer.co.za |
| Customer | customer@example.com |

### Scripts

| Script | Purpose |
|---|---|
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the API (`dist/main.js`) |
| `npm run worker` | Run the worker (`dist/worker.js`) |
| `npm test` | Unit tests (business rules, calculators, search matcher, XSS guard) |
| `npm run test:smoke` | End-to-end checks against a running API with a fresh seeded DB. Never run against production. |
| `npm run prisma:migrate` | Create a new migration in development |
| `npm run prisma:deploy` | Apply migrations (CI/production) |

---

## 2. Architecture

```
Client → CDN/WAF → Nginx/Load balancer → API instances (stateless) ─┬─ PostgreSQL primary (+ optional read replica)
                                                                     ├─ Redis (cache, rate limits, view counters)
                                                                     └─ Object storage (vehicle media, documents)
                                         Worker instances ───────────┘  (outbox dispatch + scheduled jobs)
```

- **Modular monolith.** One codebase, strong module boundaries (brief section 2). Each module owns its services, DTOs, controllers and event handlers.
- **Two processes, one image.** `dist/main.js` serves HTTP. `dist/worker.js` runs the outbox dispatcher and scheduled jobs. Both scale horizontally.
- **Stateless API.** No session or file state in process memory or on local disk (brief section 4). Refresh tokens live in PostgreSQL. Cache, rate limits and view counters live in Redis. Media goes to object storage through presigned URLs.
- **PostgreSQL is the source of truth.** Search results and cache entries are projections. Every transactional action (enquiry, bid, acceptance) re-reads the primary database.
- **Transactional outbox.** Business changes write an `outbox_events` row in the same transaction. Workers claim rows with `FOR UPDATE SKIP LOCKED`, retry with exponential backoff, and dead-letter after 8 attempts. Notifications, image processing, valuations and saved-search alerts all run this way, so a user request never waits on email or image work.
- **CDN-friendly reads.** Anonymous GET responses for search, vehicle pages, catalogue, content and dealers carry `Cache-Control: public, s-maxage=…`. Signed-in responses are always `private, no-store`. This is what lets most browse traffic be served by the CDN instead of the API.

### Request pipeline

Every request gets an `X-Request-Id`. Then it passes through Helmet, compression, CORS, rate limiting (Redis-backed), JWT auth (global, opt out with `@Public()`), platform RBAC (`@Roles`), dealer tenant isolation (`@DealerAccess`), DTO validation, the idempotency interceptor and the cache-header interceptor.

Errors always have this shape:

```json
{ "statusCode": 409, "code": "OFFER_EXPIRED", "message": "This offer has expired", "details": null, "requestId": "…", "timestamp": "…", "path": "…" }
```

Lists always have this shape: `{ "data": [...], "meta": { "page", "pageSize", "total", "pageCount" } }`. Lists are never unbounded.

### Folder layout

```
prisma/                 schema.prisma, migrations/, seed.ts
src/
  main.ts / worker.ts   process entry points
  core.module.ts        infrastructure + HTTP cross-cutting concerns
  config/               zod-validated environment
  common/               errors, guards, decorators, interceptors, pagination, utils
  infrastructure/       database (Prisma), redis, cache, storage (S3), messaging (email/SMS), outbox, audit
  modules/              one folder per domain (see below)
  generated/prisma/     generated Prisma client (git-ignored)
test/smoke.e2e.mjs      end-to-end checks
deploy/nginx.conf       reverse proxy / load balancer example
```

---

## 3. Modules and requirements

| Module | Main routes | Requirements |
|---|---|---|
| `auth` | `/auth/*` register, login, refresh (rotating, reuse detection), logout, forgot/reset/change password, me | FR-01, NFR-04 |
| `customers` | `/me`, `/me/dashboard`, favourites, saved searches, recently viewed, sessions, export, delete account | FR-37, FR-38, FR-40, FR-41, NFR-17 |
| `dealers` | `/dealers/register`, `/dealers/:slug`, `/dealer/profile`, branches, staff, documents, `/admin/dealers` | FR-11, FR-12, FR-45, FR-46, BR-02, BR-14 |
| `catalogue` | `/catalogue/makes/…/models/…`, variants, compare, categories, features, `/admin/catalogue/*` | FR-06, FR-17, FR-25, FR-26, FR-49, FR-50 |
| `vehicles` | `/vehicles` search/detail/compare/similar, `/dealer/vehicles` inventory + lifecycle + images, `/admin/vehicles` review | FR-02 to FR-05, FR-12, FR-17, FR-23, FR-24, FR-47, FR-48, FR-51, BR-01, BR-03 to BR-05 |
| `search` | search engine, facets, saved-search alerts | FR-02, FR-05 to FR-07, FR-27, FR-39 |
| `enquiries` | `/enquiries/{vehicle,test-drive,quote,beat-my-quote,trade-in,concierge,help-me-find,finance,insurance,contact}`, `/me/enquiries`, `/dealer/enquiries`, `/admin/enquiries` | FR-14 to FR-16, FR-20 to FR-22, FR-30, FR-33, FR-42 |
| `crm` | `/dealer/leads` pipeline, assignment, activities, stats | FR-43, FR-44 |
| `selling` | `/sell-requests`, `/me/sell-requests`, `/admin/sell-requests` with automated and manual valuations | FR-08, FR-09 |
| `bidding` | `/admin/sell-requests/:id/bidding-sessions`, `/dealer/bidding/*`, `/dealer/offers/*`, `/me/offers/*` | FR-10, FR-52 to FR-56, BR-06 to BR-12 |
| `finance` | `/finance/repayment`, `/finance/affordability` | FR-18, FR-19 |
| `content` | `/content/articles`, media, FAQs, pages, `/promotions`, `/admin/*` CMS | FR-23, FR-28 to FR-31, FR-35 |
| `newsletter` | `/newsletter/subscribe`, `/newsletter/unsubscribe`, `/admin/newsletter/*` | FR-32 |
| `notifications` | `/me/notifications`, preferences | FR-36, FR-39, FR-48, FR-57 |
| `dealer-dashboard` | `/dealer/dashboard` | FR-13 |
| `admin` | `/admin/stats`, users, audit logs, outbox health and dead-letter retry | FR-34, BR-13, NFR-15 |
| `seo` | `/seo/sitemap.xml`, vehicle sitemaps, schema.org JSON-LD | NFR-12 |
| `health` | `/health/live`, `/health/ready` | NFR-03 |
| `web` | `/web/*` adapter for the Next.js website (repository root, see below) | all website screens |

### Roles and permissions (NFR-05, BR-14)

- **Platform roles:** `CUSTOMER`, `DEALER`, `ADMIN`, `SUPER_ADMIN`. Visitors are unauthenticated requests. A super admin satisfies every admin check. Only super admins manage administrators.
- **Dealership roles:** `OWNER`, `MANAGER`, `SALES`, `STAFF`, each with default permissions in [dealer-permissions.ts](src/modules/dealers/dealer-permissions.ts). Members can be granted extra permissions, but nobody can grant a permission they do not hold.
- **Tenant isolation.** The dealer and branch scope always come from the member record on the server, never from client input. Sales and staff members assigned to a branch only see that branch.

### Connecting the website

The website was built against its own TypeScript types with sample data. The `web` module ([src/modules/web](src/modules/web)) serves exactly those shapes, so the website's pages and components stay unchanged. Only its data files (`app/lib/**/api.ts`, `session.ts`) and the forms' submit functions call the API. The general `/api/v1` routes remain the contract for the mobile apps.

| Website need | Adapter route |
|---|---|
| Car search with the website's filters, collections and paging | `GET /web/cars?<CarSearch fields>` → `{ cars, total, page, pageCount }` |
| Home and detail lists | `GET /web/cars/{all,featured,recent,premium}`, `GET /web/cars/:id`, `/:id/{similar,dealer-cars,popular-dealers,market-price}` |
| News | `GET /web/articles`, `/web/articles/{featured,latest,:slug}`, `GET /web/article-categories` |
| Dashboards (signed in) | `GET /web/dashboard/{overview,dealers,dealers/:id,dealers-by-id,inventory,leads,staff,activity}`, `POST /web/dashboard/dealers/:id/status` |
| Forms | `POST /web/forms/:form` (newsletter, contact, vehicle-enquiry, beat-my-quote, keep-it, new-vehicle-quote, value-my-vehicle, sell-vehicle, sell-vehicle-site, special), `POST /web/auth/register` |
| Photos and documents of a submitted form | `POST /web/uploads/url` then `POST /web/uploads/confirm`, with the `uploadToken` from the form receipt |

- **Car ids.** The website ends each car URL with the id and reads it back after the last hyphen, so cars are sent as the UUID without hyphens (32 hex characters).
- **Form errors** come back as `422 FORM_INVALID` with `details.fields` keyed by the website's own field names, so each message appears under the right input.
- **Login.** The website calls `POST /auth/login` from a Server Action and keeps the tokens in http-only cookies. `proxy.ts` (website root) refreshes them before dashboard pages render.
- **Rate limits per visitor.** All website calls come from the Next.js server. It forwards the visitor's IP in `X-Web-Client-Ip` with the shared `WEB_ADAPTER_KEY`, and only then does the throttler use that IP.
- **Demo data.** `SEED_WEBSITE_DEMO=true npm run db:seed` loads the cars, news, dealers, stock, leads and staff the website showed as samples ([prisma/fixtures/website-demo.json](prisma/fixtures/website-demo.json), refreshed with `node scripts/export-website-fixture.cjs`). Every demo login uses the password `Password123`, for example `zawar@changecars.example` (super admin), `natasha@changecars.example` (admin) and `sales@rivoniaautohouse.example` (dealer).

To run both together:

```bash
# backend/.env: DATABASE_URL, JWT_ACCESS_SECRET, WEB_ADAPTER_KEY
npm run prisma:deploy && SEED_DEMO=true SEED_WEBSITE_DEMO=true npm run db:seed && npm run start:dev
# .env.local in the website folder (repository root): API_URL=http://localhost:4000/api/v1 and the same WEB_ADAPTER_KEY
cd .. && npm install && npm run dev
```

Without `API_URL` the website runs on its built-in sample data, as before.

**Going live (the website shows live data only when all of this is set):**

1. Run this API somewhere the website can reach over HTTPS (with PostgreSQL, ideally Redis, and S3 storage), run `npx prisma migrate deploy`, and start both `node dist/main.js` and `node dist/worker.js`.
2. In the website's hosting settings (Vercel → Project → Settings → Environment Variables) set `API_URL=https://<api-host>/api/v1` and `WEB_ADAPTER_KEY=<the same secret as the API>`, then redeploy. If `API_URL` is missing the website keeps showing its sample cars.
3. In the API's `.env` set `WEB_REVALIDATE_URL=https://<website>/api/revalidate` (same `WEB_ADAPTER_KEY`). Every change to cars, dealers, the catalogue or news then refreshes the website at once (well under a second in tests); without it, pages catch up within about a minute.
4. Add the website's address to `CORS_ORIGINS` and `PUBLIC_WEB_URL`, and allow `PUT` from it in the storage bucket's CORS rules (photo uploads).

- **Sync.** Public pages cache API data for up to 60 s (search 30 s) as a safety net. When data changes, the API calls the website's `/api/revalidate` (debounced, retried, protected by `WEB_ADAPTER_KEY`), which clears the `cars` or `articles` cache so the next visitor sees the change. Car pages and dashboards always read live data. Changes made directly in the database (not through the API) are only picked up when the cache expires.

- **Uploads.** Sell forms and Beat My Quote return a 2-hour `uploadToken`. The browser uploads each file straight to storage with a presigned URL; photos land in `media/sell-requests/…` (public), registration documents and quotes in `private/…` (staff get short-lived signed links). Limits: JPG/PNG/WebP photos up to 10 MB and 20 per request, PDF/JPG/PNG documents up to 5 MB and 2 per request. **Production:** the bucket needs a CORS rule allowing `PUT` from the website origin.
- **Errors.** Every failure reaches the visitor as a short message inside the form (never a pop-up or toast), with field messages under their inputs. Pages whose main data cannot load show a branded "Try again" page; extras (similar cars, latest news) are left out instead. API calls time out after 10 s (reads) or 20 s (writes), and server faults are logged with the API `requestId`.
- **Privacy.** Website enquiries are processed because the visitor asked to be contacted (POPIA s11(1)(b)/(f)), recorded as `details.lawfulBasis`; marketing stays opt-in (newsletter forms and the enquiry form's newsletter box). Sign-up shows a notice linking the CHANGECARS Privacy Policy.
- **Usernames.** The website's sign-up username is stored (unique, lower case) as the account's handle; sign-in remains by email.

---

## 4. Key business rules and where they live

- **Vehicle lifecycle.** [vehicle-lifecycle.ts](src/modules/vehicles/vehicle-lifecycle.ts) defines every allowed transition and who may perform it: Draft → Pending Review → Approved → Published → Reserved → Sold → Archived, plus Rejected, Suspended and back-to-Draft for material edits. After approval only price, specials, description, colour, branch, stock number and features can change without a new review. Availability (FR-51) is derived from the lifecycle, so there is one source of truth.
- **Reservations** expire automatically after `RESERVATION_HOLD_HOURS` (default 72) and the vehicle returns to Published.
- **Lead pipeline.** [lead-stages.ts](src/modules/crm/lead-stages.ts): forward-only, Won only after Qualified, Lost from any open stage, reopening only by managers. Every change is written to the lead's activity history.
- **Offer acceptance** follows brief section 5.2 in one transaction in [bidding.service.ts](src/modules/bidding/bidding.service.ts). It locks the session and offer rows, validates, accepts, supersedes competing offers, awards the session, updates the sell request, creates the deal and the dealer's lead, then writes the audit row and the outbox event. `bidding_sessions.acceptedOfferId` is `UNIQUE`, so two accepted offers per session are impossible even if the lock were bypassed. The endpoint honours an `Idempotency-Key` header, and re-accepting the same offer returns the same deal.
- **Bidding windows** open and close on schedule. Offers expire after `offerValidityHours`. A closed session only takes bids again after an explicit reopen. All of this runs as idempotent jobs in the worker.
- **Audit trail (BR-13).** Every privileged or business-critical change records actor, role, action, entity, previous and new values, IP, user agent and request id.

### Database-level guarantees

The hand-written migration `20261006172400_constraints_and_search_indexes` adds what Prisma's schema cannot express:

- CHECK constraints: positive prices and amounts, special price below price, valid year and mileage ranges, ordered valuation ranges, and bidding windows that end after they start.
- A CHECK that a feature assignment targets exactly one of make, model, generation, variant or vehicle.
- Partial unique indexes: one live bidding session per sell request, and one open counter-offer per offer.
- `pg_trgm` GIN indexes for free-text title search.
- Partial indexes for the public search hot path (published and reserved listings only).

Database sessions are pinned to UTC. Prisma stores timestamps as UTC, so raw SQL that uses `now()` stays correct whatever the server timezone is.

---

## 5. Scaling path

This follows brief sections 6, 8 and 15.

1. **Today.** One PostgreSQL primary, Redis, API and worker on the existing VPS behind Nginx. Run the API with several Node processes, for example PM2 cluster mode or multiple containers.
2. **More API capacity.** Deploy the same image to more hosts behind the load balancer. Nothing else changes, because the API is stateless. Redis must be configured once there is more than one instance.
3. **Database.** Add PgBouncer, then set `DATABASE_READ_URL` to a replica. Public search, listings, catalogue and content already read through `prisma.replica`.
4. **Search.** All search goes through `SearchService` with an engine-agnostic query contract. Swap its implementation for OpenSearch when faceting, typo tolerance or search QPS need it.
5. **Workers.** Add worker instances independently. Outbox claiming is safe to run concurrently.
6. **CDN.** Cache anonymous public GETs at the edge, using the headers already sent.

The "2 million concurrent users per second" target in the requirements must be turned into measured RPS and latency targets and load-tested (brief section 16) before any capacity is promised.

---

## 6. Verification status

- `npm test`: 53 unit tests pass. They cover lifecycle, lead stages, finance maths, valuation, bidding rules, the search matcher and builder, content XSS validation and the website adapter's mappings.
- Website sync: a car published, re-priced, featured and sold through the API, an article published and a dealer suspended and reinstated all show on the production website within a second.
- Website connection: 72 adapter checks, 25 upload checks, and browser runs of the real website on desktop and phone widths pass: every form, login, dealer approval, photo and document uploads, in-form error messages, the 404 and error pages, and behaviour with the API switched off.
- `npm run test:smoke`: 116 end-to-end checks pass against PostgreSQL 18. They cover search and filters, auth with refresh-token reuse detection, RBAC and dealer isolation, the enquiry-to-lead-to-response flow, the full vehicle lifecycle, valuation, bidding with counter-offers, concurrent offer acceptance (exactly one wins), idempotent replay, offer expiry, notifications via the outbox, audit, sitemaps and cache headers.
- **Not yet exercised against real services:** S3/MinIO uploads and `sharp` image processing, SMTP delivery, and Redis. The tests ran without Redis, using the in-memory fallback. Run the Docker stack to cover these.

---

## 7. Decisions to confirm with the business

These questions are open in the requirements. The current behaviour is noted for each, and every one is easy to change.

| Topic | Current behaviour |
|---|---|
| Capacity target ("2 million concurrent users per second") | Not load-tested; needs measurable RPS/latency targets |
| Can a published vehicle go straight to Sold without Reserved? | Allowed |
| Purchase enquiries on Reserved vehicles | Allowed (backup buyers); blocked for Sold, Suspended and Archived |
| Which sell requests go to bidding | An admin opens bidding per request with explicit rules |
| Bid rules (FR-52): modification, withdrawal, counter-offers, validity, reserve price | Configurable per session; defaults allow modification, withdrawal and counters, with 48 h validity |
| Lead stage when a customer accepts a dealer offer | Lead created at OFFER_SENT; the dealer marks it WON when the deal completes |
| Affordability rule | Instalment capped at 30% of gross income and at disposable income |
| Automated valuation | Median of comparable listings (or depreciated list price), adjusted for mileage and condition, minus a 15% trade margin; otherwise manual review |
| SMS | Interface plus a log provider; choose a gateway (Clickatell, Twilio…) |
| View counts with CDN caching | Views are counted on origin hits, so cached hits are not counted; add a client-side view beacon if exact counts matter |
| Valuation form has no condition question | Decided: stored as "Good" with a note in the request, so the automated estimate stays neutral |
| "Dealer" sign-up on the Register page (no dealership details asked) | Decided: a normal account is created and the team gets a dealer application to complete |
| Terms of use link | The website has no CHANGECARS terms page yet; the sign-up notice links the Privacy Policy and mentions the terms of use. The website sell form still links WeeLee's own policy documents |
