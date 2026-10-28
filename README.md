# CHANGECARS

Three separate applications, each with its own `package.json`, dependencies and deployment:

| Folder | What it is | Default port |
| --- | --- | --- |
| [`backend/`](backend/) | NestJS API, database (Prisma/PostgreSQL), workers and import scripts | 4000 |
| [`frontend/`](frontend/) | Customer website (Next.js), including the dealer and admin dashboards | 3000 |
| [`superadmin/`](superadmin/) | Super admin console (Next.js), SUPER_ADMIN accounts only | 3001 |

Both frontends talk only to the backend API (`API_URL`, including `/api/v1`); neither contains database credentials.

## Connecting the two frontends

- `frontend/.env.local`: `SUPERADMIN_URL` is the address of the super admin console. Super admins who sign in on the website, and old `/dashboard/super-admin/...` links, are sent there. Without it, super admins use the website's admin console.
- `superadmin/.env.local`: `NEXT_PUBLIC_SITE_URL` is the website address, used for "View on website" links.

## Media

Downloaded vehicle photos and dealer logos live in `frontend/public/media/` (not in Git). The backend import/sync scripts read and write that folder.

Local development: see [LOCAL_SETUP.md](LOCAL_SETUP.md). Super admin deployment: see [superadmin/README.md](superadmin/README.md).

## Dealer app integrations

Additional dealer apps use dealer-bound credentials on the central backend. See the [dealer app API guide](backend/docs/dealer-app-api.md) for token issuance, JSON examples, inventory/profile operations, photos and release instructions, and the [API test report](backend/docs/dealer-app-testing.md) for coverage and reproducible checks.
