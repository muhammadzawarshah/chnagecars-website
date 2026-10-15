# CHANGECARS Superadmin — client review package

Independent Next.js superadmin app with the NestJS API, PostgreSQL migrations, reference data and optional sample inventory. Copy this entire directory to a new repository or server. It does not need the original project directory.

## Quick start (Docker)

Requirements: Docker Engine/Desktop with Docker Compose v2; Node.js 20.19+ for the one-time setup helper.

```sh
node scripts/setup.mjs
docker compose up --build -d
```

Open **http://localhost:3000**. Sign in with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from the generated `.env`. Setup generates unique passwords and secrets and never overwrites an existing `.env`.

- Frontend: http://localhost:3000
- API documentation: http://localhost:4000/docs
- API readiness: http://localhost:4000/health/ready
- Review email inbox (reset links and invitations): http://localhost:8025
- Storage console: http://localhost:9001 (credentials are `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` in `.env`)

The `init` container applies migrations and seeds the isolated database before the API starts. It must exit with code 0. `SEED_REVIEW_DEMO=true` creates sample dealers, listings, leads and articles for review; set it to `false` before the first start for reference data and the superadmin only. The seed does not reset an existing admin password. Demo account passwords are `Password123`, but only the `SUPER_ADMIN` role can log in to this frontend.

```sh
docker compose ps -a
docker compose logs --tail=100 init api web worker
docker compose stop
docker compose up -d
```

Named volumes preserve the review database and uploaded media across container restarts. No production database export, production credentials or bulk downloaded vehicle photos are included. Sample images are included in `public/`.

## Client review scope

- Superadmin login, token refresh, logout and password reset.
- Overview, dealers, dealer comparison and audited dealer view-as.
- Listing review and moderation, admins/staff, customers and leads.
- Blogs/categories, catalogue, pages/content and promotions.
- Data quality, feed diagnostics, snapshots, reports/CSV, audit trail, queue diagnostics and settings.

The frontend contains only superadmin and authentication routes. Shared dealer components are used inside superadmin's protected view-as screens; there is no independent dealer/admin dashboard or marketplace frontend. The backend retains the shared domain services and API routes needed by the console, with its existing authentication and role checks. The API is deployed before the frontend.

Existing product limits remain: deployment settings are read-only; import history, billing and feed scheduling do not gain new functionality in this package. See [CONSOLE_FEATURES.md](CONSOLE_FEATURES.md) for exact capabilities.

## Deploy on a server

1. Copy this directory, run `node scripts/setup.mjs`, and edit `.env`.
2. Set `PUBLIC_WEB_URL` to your superadmin HTTPS URL and `SESSION_COOKIE_SECURE=true`.
3. Set `S3_PUBLIC_ENDPOINT` to a browser-reachable storage HTTPS URL. Set `MEDIA_PUBLIC_BASE_URL` to that URL plus `/changecars-media`. Route the storage hostname to port 9000.
4. Optionally set `NEXT_PUBLIC_SITE_URL` to your separately deployed marketplace URL **before building**. Public article/listing preview buttons appear only when this is set.
5. Run `docker compose up --build -d`. Route your HTTPS reverse proxy to port 3000; route the API hostname to port 4000 if you need external API access. Set `TRUST_PROXY_HOPS` in the backend when your proxy chain differs from the default of one.

`API_URL` inside Compose is `http://api:4000/api/v1`; it is server-side and does not need to be public. `WEB_ADAPTER_KEY` is shared by web and API. PostgreSQL and Redis are internal services. Mailpit and the storage console bind to localhost for review. For real outbound email, replace `SMTP_URL` in `compose.yaml` with your SMTP provider and keep `PUBLIC_WEB_URL` pointed to this app for reset links. Use your own object storage service if preferred.

Ports are configurable in `.env`. If port 3000 is occupied, change `WEB_PORT` and `PUBLIC_WEB_URL` together. If changing `STORAGE_PORT`, update `S3_PUBLIC_ENDPOINT` and `MEDIA_PUBLIC_BASE_URL` too.

## Run without Docker / deploy as two Node services

Requirements: Node.js 20.19+, PostgreSQL 15+, optional Redis, and S3-compatible storage for uploaded documents/media. Node.js 22 is used by the supplied Dockerfiles.

Backend:

```sh
cd backend
cp .env.example .env
# Configure your new DATABASE_URL, JWT_ACCESS_SECRET, WEB_ADAPTER_KEY,
# PUBLIC_WEB_URL, CORS_ORIGINS, storage and SMTP settings.
# Add SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to this .env.
npm ci
npm run prisma:deploy
npm run db:seed
npm run build
npm run start:prod
# Separate worker process, using the same backend environment:
# npm run worker
```

The normal seed creates reference data and one superadmin. For sample review data on a **new test database**, run `NODE_ENV=development SEED_DEMO=true SEED_WEBSITE_DEMO=true npm run db:seed`. Existing production records are not included in this package.

Frontend (package root, separate terminal/service):

```sh
npm ci
# Create .env.local or set hosting environment variables:
# API_URL=https://your-api.example.com/api/v1
# WEB_ADAPTER_KEY=<same value as backend>
# SESSION_COOKIE_SECURE=true  (false for local HTTP review)
npm run build
npm run start
```

For frontend hosting, select this directory as the root, build with `npm run build`, and start with `npm run start`. For backend hosting, select `backend/`, install with `npm ci`, build with `npm run build`, run migrations with `npm run prisma:deploy`, seed once with configured admin credentials, then start with `npm run start:prod`. Deploy `npm run worker` as a second backend process. A Node server is required because authentication and mutations use server actions; static hosting alone does not support this app.

## Checks

```sh
npm run lint
npm run build
cd backend
npm run prisma:generate
npm run typecheck
npm run build
npm test -- --runInBand
```

See [VALIDATION.md](VALIDATION.md) for checks actually performed on this package.
