# Package validation

Validated on 15 October 2026 with Node.js 24.18.0; the Dockerfiles target Node.js 22.

- Frontend production build: passed without API_URL or a database at build time. Authenticated dashboard pages render dynamically at runtime.
- Frontend lint: zero errors; two existing warnings for external inventory `<img>` elements.
- Backend Prisma client generation, TypeScript check and production build: passed.
- Backend unit tests: **19 suites, 96 tests passed**, including console authorization and browser-reachable storage signing URLs.
- Setup helper: generates unique configuration, preserves an existing `.env`, and the resulting fully interpolated Docker Compose configuration validates.
- Fresh temporary local PostgreSQL database: all migrations and the reference/demo seed passed; API readiness and seeded SUPER_ADMIN login passed.
- HTTP smoke checks against the production frontend build and packaged API: overview, dealers, listings, staff, customers, blogs, catalogue, quality, content, reports, audit, settings, leads, imports, snapshots and system returned successful pages.
- Anonymous and customer sessions were redirected away from superadmin. The standalone dealer dashboard route returned 404.
- Frontend login server action issued http-only session cookies; a customer login was refused without setting those cookies; logout cleared the session cookies.
- The temporary test database was removed after validation.

Docker Engine was not running on this machine. Compose configuration was validated, but the complete Docker image build/container startup, MinIO uploads and email delivery were not exercised here. Browser interaction with every management form was not exhaustively tested. The supplied backend unit tests cover the existing mutation and permission rules.

The package contains examples and generated-on-demand review credentials, not the original project's `.env`, SSH keys, service account files or production database contents.
