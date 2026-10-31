# Independent customer accounts for branded dealer apps

> Current release is restricted to the auto-configured Group1 app. See [Group1 registration](group1-registration.md) for the active URLs and fixed branch IDs. Generic app creation described below is reserved for future expansion and is currently rejected.

The Change Cars website and its customer app use the existing `/api/v1` base URL.
Each branded dealer app uses its registered `/api/v1/apps/{appId}` base URL for
**all** customer API calls, including registration, login, refresh, password reset,
profile, favourites, notifications and device registration.

One person may register `ali@example.com` in Change Cars, Dealer A and Dealer B.
These create three independent user IDs with independent passwords, sessions,
preferences, inboxes and customer records. Email and username uniqueness is per app.
Registering in a dealer-branded app creates a **CUSTOMER**, not dealership staff.
Dealer staff and platform administrators continue using the platform's existing APIs.

## Register a branded app

Sign into the standalone superadmin console and open **Customer apps**:
`/dashboard/super-admin/customer-apps`.

Enter the app's display name, a permanent lowercase ID (e.g. `dealer-a`), its approved
numeric dealer IDs, and its HTTPS password reset page/universal link. Up to 20 dealers
can belong to one branded app. Inventory reads inherit that registered dealer scope.
The app ID identifies a public account directory, not a secret or a staff credential.
The mobile app must use the configured base URL; clients cannot override the app via
a signup body field or arbitrary header. The backend resolves the app from its registry.
Unknown, disabled or unavailable dealer apps fail closed. Disabling an app revokes its
refresh sessions and stops its API access. Main Change Cars cannot be disabled.

Superadmin HTTP equivalents:

```http
POST /api/v1/admin/customer-apps
Authorization: Bearer <superadmin-access-token>
Content-Type: application/json

{
  "id": "dealer-a",
  "name": "Dealer A Cars",
  "dealerIds": ["3490"],
  "resetUrl": "https://dealer-a.example.com/reset-password"
}
```

`GET /admin/customer-apps` lists registered apps. `PATCH /admin/customer-apps/dealer-a/status`
with `{"enabled":false}` disables it (`true` enables it). These routes are SUPER_ADMIN-only
and app changes are audited. Dealer IDs are validated as approved at creation and on
requests. IDs and dealer membership are intentionally immutable in this initial API:
changing either would silently move customers or inventory between existing apps.

## Signup and login

The same registration contract applies everywhere:

```http
POST /api/v1/apps/dealer-a/auth/register
Content-Type: application/json

{
  "username": "ali",
  "email": "ali@example.com",
  "firstName": "Ali",
  "lastName": "Khan",
  "password": "Example123!"
}
```

The response's `user.appId` and signed JWT `appId` identify the account directory.
Duplicate signup in the **same app** returns `409 EMAIL_TAKEN` or `USERNAME_TAKEN`;
signup in another registered app is allowed. App roles cannot be supplied by clients;
even legacy `accountType: "DEALER"` is treated as a customer in branded apps.

Use `POST /apps/dealer-a/auth/login` with email/password and the same app base for
refresh, forgot-password, reset-password, logout and authenticated customer endpoints.
An access token from another app returns `403 APP_MISMATCH`; cross-app refresh/reset
tokens are rejected without consuming the correct app's token. Wrong credentials are
never searched for in other apps. Forgot-password retains its generic 202 response.

The configured reset URL receives `token` and `appId` query parameters. Its page/mobile
handler must submit the new password to that app's scoped reset endpoint. Use HTTPS
universal/app links configured for the branded app; arbitrary redirect URLs from
forgot-password requests are never accepted. Welcome/reset emails use the app name.
HTTP reset URLs are accepted only for localhost/127.0.0.1 development.

## Notifications

Superadmin **Notifications** now includes an app selector. A campaign targets customers
only within that app. API sends can specify `appId`; existing callers default to
`changecars`. Selected user IDs cannot select users outside the selected app.
Inbox and push-device endpoints use the same app base as login. Push payloads include
`appId`, `notificationId` and `type`. For the current FCM credential configuration,
register all branded mobile apps in the same Firebase project.

Socket.IO retains the backend-origin `/notifications` namespace and `/socket.io/` path:

```ts
const socket = io(`${API_ORIGIN}/notifications`, {
  transports: ['websocket'],
  auth: { token: accessToken, appId: 'dealer-a' },
});
```

The signed token must match the handshake app ID. Main-app clients can omit appId for
backward compatibility. Rooms are derived from the unique user ID; clients cannot join
another user's room. Resync the scoped inbox on every `ready`, including reconnects.
See the [real-time notification guide](notifications-realtime.md) for FCM setup.

## Existing accounts and rollout

The migration assigns **all existing users and newsletter subscriptions to `changecars`**.
It preserves their IDs, password hashes, sessions and associated data. Existing platform
JWTs without an app claim remain valid as Change Cars tokens until they expire. Main
website/customer-app callers do not need to change their API base URL.

Legacy `/scope/{dealerIds}` URLs remain inventory scopes; signup/login/password reset
must use a registered `/apps/{appId}` base instead. No existing account is silently
copied or attached to a branded app. Users register there independently.

Apply migrations and generate/build the backend through the normal release process.
The local database migration has been applied; production still needs its release.
The mobile source is outside this repository, so configure each mobile project's base
URL and Socket.IO app ID there. Merely changing a display name does not create a new
account directory; register and configure a distinct app ID for each branded app.

## Verification

Unit tests: `npm test -- --runInBand app-context.spec.ts`.
Local integration (API and in-process worker running): `npm run test:customer-apps:e2e`.
This integration test refuses nonlocal API/database hosts, uses two approved existing
dealers without changing them, creates temporary app/user records, and cleans up its
records. Local superadmin credentials default to those in LOCAL_SETUP.md; override with
`TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD` for a different local account.
It verifies same-email/username registration in three apps, scoped login, token/reset
isolation, blocked staff endpoints, notification targeting, and disabled-app access.
