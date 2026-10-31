# Branded customer apps and notifications handover

Current mode: **Group1 only**, configured automatically at backend startup. See [Group1 registration and release notes](group1-registration.md). Other branded-app registration is disabled.

## Delivered behavior

- Change Cars website/customer app retain their existing customer directory.
- Each registered branded dealer app has an independent customer directory.
- The same email and username may register once in each app, with separate user IDs,
  passwords, sessions, password resets, customer records and notifications.
- Branded-app signup creates a customer, not dealer staff.
- JWT, refresh-token and password-reset checks reject cross-app credentials.
- Superadmin can register/disable branded apps and send announcements to a chosen app.
- Notifications persist in the inbox, reach connected clients over authenticated
  Socket.IO, and support Android/iOS Firebase push once configured.

## Superadmin screens

- `/dashboard/super-admin/customer-apps`: register a branded app, view its API base,
  enable/disable it. Main Change Cars is protected from disabling.
- `/dashboard/super-admin/notifications`: choose the app, audience, title and message;
  preview and queue a notification. Sends appear in the existing audit trail.

## API bases

| Client | API base |
| --- | --- |
| Change Cars website/customer app | `/api/v1` |
| Branded dealer app | `/api/v1/apps/{registered-app-id}` |

Use the chosen base for every customer request, including auth, profile, favourites,
inbox and FCM device registration. Never mix a branded app's tokens with the main API.
Legacy `/scope/{dealerIds}` URLs remain for inventory; use registered app URLs for auth.

## Release steps

From `backend/`, install dependencies, apply migrations, generate Prisma and build:

```sh
npm ci
npm run prisma:deploy
npm run prisma:generate
npm run build
```

This includes migrations `20261031000200_push_devices` and
`20261031000300_customer_app_accounts`. Existing users are assigned to `changecars`;
their passwords and associated data are preserved. Back up the target database using
the normal release procedure before applying migrations. Local migrations have already
been applied; no production release was performed as part of this work.

Build/restart the standalone `superadmin/` app using its existing release process.
Run the backend API and existing outbox worker. For separate worker/API processes,
configure both with the same Redis via `REDIS_URL`. Local development can use the
existing `RUN_WORKER_IN_API=true` configuration.

Group1 is created automatically with its four existing branch IDs. Set its real HTTPS password reset page/universal link in **Customer apps → Group1 settings** before using reset emails. Configure the mobile app's API base and
Socket.IO `auth.appId` to match that registered app. The reset handler must submit
password changes to the same branded API base.

For phone push, configure `FIREBASE_SERVICE_ACCOUNT` server-side, enable FCM, configure
iOS APNs in Firebase, and register each device's FCM token through its own app API.
The current implementation uses one Firebase project for the branded mobile apps.
The mobile source is outside this repository; mobile SDK setup and a real-device push
test remain required. Firebase credentials are not included in this change.

## Validation completed locally

- Backend regression suite: 51 suites / 402 tests passed before adding the new app-boundary tests.
- Final targeted app/notification suite: 17 tests passed.
- Live local integration: 32 HTTP checks passed, covering three same-email accounts,
  duplicate rejection within one app, isolated login/reset/refresh, blocked staff routes,
  app-specific notification delivery and disabled-app access.
- Backend build/typecheck, superadmin typecheck and lint of changed UI files passed.
- Temporary integration-test accounts and app records were cleaned up.

Repeat the local integration with `npm run test:customer-apps:e2e` in `backend/` while
the local API/database and in-process worker are running. It refuses nonlocal hosts.

## Detailed references

- [Independent customer accounts and mobile API integration](customer-app-accounts.md)
- [Real-time notifications, FCM endpoints and Socket.IO integration](notifications-realtime.md)
