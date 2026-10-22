# ChangeCars standalone admin frontend

This folder is an independent Next.js admin application. Copy it to its own repository or hosting application. It connects to the existing ChangeCars backend; it contains no backend, database, seed process or database credentials.

## Start locally

Use Node.js 20.19 or newer.

```sh
npm ci
cp .env.example .env.local
```

For local HTTP development set `SESSION_COOKIE_SECURE=false`, then run:

```sh
npm run dev -- --port 3001
```

Open http://localhost:3001 and sign in with an existing backend **SUPER_ADMIN** account. The root redirects to the superadmin dashboard. Login, refresh, dashboard queries and mutations use `API_URL`; no demo accounts are created.

## Connect to the existing backend

For a hosting panel, set application root to this folder and startup file to `app.js`.
Run `node app.js` to install dependencies, build, copy standalone assets, and start.
This repeats install/build on each restart; allow sufficient startup time and provide
npm/network access and a writable application directory. Errors stop startup.
The default port is 3001; the hosting-provided `PORT` takes precedence.

```env
API_URL=https://changecarapi.wowcar.co.th/api/v1
SESSION_COOKIE_SECURE=true
NEXT_PUBLIC_SITE_URL=https://your-customer-website.example
```

`API_URL` is server-only and must include `/api/v1`. Browser requests and server actions go through this Next.js application; it forwards authenticated requests to the backend. Access and refresh tokens use HttpOnly cookies. Never expose database credentials or JWT signing secrets to this app.

`NEXT_PUBLIC_SITE_URL` is the customer website (`frontend/`), not this app's own address: "View on website" opens the car's customer page there, and the header/footer links point to it. It is built into the pages, so rebuild after changing it.

`WEB_ADAPTER_KEY` is optional for trusted visitor-IP forwarding. If enabled, set it privately to the same value as the backend; do not commit it.

Deploy as a Node.js application, not static hosting:

```sh
npm ci
npm run build
npm start -- --port 3001
```

Terminate HTTPS at the hosting proxy and set `SESSION_COOKIE_SECURE=true`. If standalone build output is used instead, copy `public` and `.next/static` into `.next/standalone` and run `.next/standalone/server.js` with `PORT=3001`.

The existing backend remains the source of truth and enforces authorization. Keep its `PUBLIC_WEB_URL` pointed at the intended password-reset frontend. Authentication smoke tests require a valid existing superadmin account; no credentials are included in this package.
