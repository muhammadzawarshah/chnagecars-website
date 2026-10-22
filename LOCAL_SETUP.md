# Local setup

The repository has three separate apps: `backend/` (API), `frontend/` (customer
website) and `superadmin/` (super admin console). Each has its own dependencies.
Local environment files are `frontend/.env.local`, `superadmin/.env.local` and
`backend/.env`; keep these private.

PostgreSQL 17 uses the isolated, git-ignored directory `backend/.pgdata` and port
55432. Existing PostgreSQL services are unaffected.

From the repository root, start the database if it is stopped:

```sh
pg_ctl -D backend/.pgdata -l backend/.local/postgres.log -o '-h 127.0.0.1 -p 55432 -k /private/tmp' start
```

Run the API, website and super admin console in separate terminals:

```sh
cd backend
npm run start:dev
```

```sh
cd frontend
NODE_USE_SYSTEM_CA=1 npm run dev -- --webpack --hostname 127.0.0.1
```

```sh
cd superadmin
npm run dev -- --webpack --port 3001
```

For local use set `SUPERADMIN_URL=http://localhost:3001` in `frontend/.env.local`
and `API_URL=http://localhost:4000/api/v1`, `SESSION_COOKIE_SECURE=false` in
`superadmin/.env.local`.

- Website: http://localhost:3000
- Super admin: http://localhost:3001
- API docs: http://localhost:4000/docs
- Database: 127.0.0.1:55432, database/user/password `changecars` (local only).
- Demo customer: `customer@example.com` / `Password123`
- Demo dealer: `owner@demo-dealer.co.za` / `Password123`
- Local admin: `admin@changecars.co.za` / `LocalAdmin123`

All five migrations and the demo seed have been applied. The API runs its worker
inside the development process. Redis uses the supported in-memory fallback.
Email/SMS are logged locally. Object storage is not running; media uploads require
MinIO/S3 configured from `backend/.env.example`.

Stop the database when needed:

```sh
pg_ctl -D backend/.pgdata stop
```

The local network resets Google Fonts downloads. Webpack serves the site with
fallback fonts; Turbopack currently fails on these downloads. Use the command
above for this environment. Backend build and all 54 unit tests pass; website,
API cars endpoint and database health checks respond successfully.

The full user-provided XML vehicle feed is now imported. See
[the feed seed guide](backend/prisma/fixtures/fbook/README.md) for repeatable
imports, image downloads, bulk media sync and source-field verification.
Downloaded feed images are stored under `frontend/public/media/fbook/` and are excluded
from Git; copy this directory with the app when moving the setup.

Final full-feed verification: 30,011 published feed vehicles, 744 feed dealers,
30,000 original images downloaded locally (about 4 GB), 11 blocked/missing
source images using the local placeholder, and zero remote image dependencies.
The nine initial setup demo vehicles are archived.

## DealerTrade-only local inventory

The local database now uses DealerTrade inventory only for public browsing. Fbook-only listings have been removed with a backup, and the Fbook importer is disabled. Public vehicle/dealer IDs use original DealerTrade IDs. See [cleanup details and API examples](backend/docs/local-dealertrade-only.md); the earlier Fbook-import section describes historical setup only.
