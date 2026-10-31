# Notifications: real-time connection and Android/iOS push

The standalone `superadmin/` console now has **Notifications** at
`/dashboard/super-admin/notifications`. Only SUPER_ADMIN may queue announcements.
Customers, dealers, both groups, or selected user UUIDs can be targeted. Suspended
and deleted accounts are excluded. Sends are recorded in the existing audit trail.

## Backend setup

1. Install backend dependencies and generate Prisma (`npm ci`, `npm run prisma:generate`).
2. Apply the committed migration through the normal release process (`npm run prisma:deploy`).
3. Configure `REDIS_URL` on both API and worker processes, pointing to the same Redis.
   Redis Pub/Sub carries live events from a worker to every API instance. The memory
   fallback only works for delivery inside the API process; use Redis with a separate worker.
4. Run the existing outbox worker (`npm run worker`, after building), or the existing
   `RUN_WORKER_IN_API` development option. Broadcasts return HTTP 202 and delivery is asynchronous.
5. Configure `FIREBASE_SERVICE_ACCOUNT` on the worker with the Firebase service-account
   JSON or base64 JSON, using the same Firebase project as the mobile apps. This is
   server-only; never embed it in the apps. Enable the FCM HTTP v1 API and grant the
   service account permission to send messages. Configure the iOS APNs key in Firebase.
6. Allow WebSocket upgrades for `/socket.io/` on the API reverse proxy. Browser origins
   must be included in `CORS_ORIGINS`. Native apps without an Origin use token authentication.

Firebase absence is shown in the console. It does not stop inbox/live notifications.
A nonempty credential setting reports configured; it does not validate Google permissions.

## HTTP API

Paths below are relative to the normal API prefix (`/api/v1`). Every call requires
`Authorization: Bearer <access token>`.

- `POST /admin/notifications/broadcast` (SUPER_ADMIN):
  `{"title":"New arrivals","body":"Explore the latest cars.","audience":"customers"}`.
  Audience is `all`, `customers`, `dealers`, or `selected`. With `selected`, provide
  `userIds: ["<user UUID>"]` (up to 500). Returns `campaignId`, matching active user
  count, `status: "queued"`, and `pushConfigured`. Count precedes preference filtering;
  it is not a device-delivery receipt. Audience membership is evaluated during processing.
- `GET /admin/notifications/status` (SUPER_ADMIN): Firebase credential presence.
- `POST /me/notifications/devices`: `{"token":"<FCM token>","platform":"android"}`
  or platform `ios`. Call after login and when FCM rotates the token. A token belongs
  to its latest signed-in user; registering it on another account transfers ownership.
- `DELETE /me/notifications/devices`: `{"token":"<FCM token>"}`. Call **before logout**.
  Deletion is scoped to the current user.
- Existing inbox APIs: `GET /me/notifications`, `GET /me/notifications/unread-count`,
  `POST /me/notifications/:id/read`, `POST /me/notifications/read-all`.

`admin.announcement` appears in the existing preference APIs. IN_APP opt-out currently
disables inbox, WebSocket and phone delivery for that type. Announcements do not send
marketing emails or SMS. Existing system notification email/SMS behavior is preserved.

## Live mobile connection

Use a **Socket.IO v4 client**, not a raw WebSocket client. The namespace is
`/notifications` on the backend origin; it does not include `/api/v1`. The Socket.IO
transport path is `/socket.io/`.

Example for a JavaScript/React Native app using `socket.io-client`:

```ts
import { io } from 'socket.io-client';

const socket = io(`${API_ORIGIN}/notifications`, {
  transports: ['websocket'],
  auth: { token: accessToken },
});

socket.on('notification', notification => {
  // Upsert by notification.id, update unread count, and show in-app UI.
  // Never append blindly: outbox and push delivery can be repeated.
  inbox.upsert(notification);
});

socket.on('ready', async () => {
  // The authenticated private room is joined before ready.
  // Fetch the inbox on EVERY ready, including reconnection, to recover missed events.
  // Merge by ID; follow pagination for older notifications.
  await inbox.syncFromApi();
});

// After refreshing the HTTP access token, reconnect with that new token:
function useNewAccessToken(token: string) {
  socket.auth = { token };
  socket.disconnect().connect();
}

// On logout: unregister the FCM token over HTTP first, then disconnect.
// On account changes: clear that account's cached inbox before connecting again.
```

Listen before connecting if your SDK can connect synchronously (`autoConnect: false`
then `connect()`). A rejected/expired token disconnects the socket. Obtain/refresh
credentials through the existing auth APIs and reconnect; do not retry invalid
credentials indefinitely. The server derives the private room from the verified token;
clients cannot subscribe to other user IDs. Session/user status and token expiry are
rechecked every 15 seconds. Access tokens must never be passed as URL query parameters.

The `notification` event contains the persisted notification: `id`, `userId`, `type`,
`title`, `body`, `data`, `readAt`, and `createdAt`. `ready` contains `userId`.
WebSocket delivery is transient; the database inbox is the source of truth.

## Android/iOS push integration

Add Firebase Messaging to the existing mobile app, request notification permission,
obtain its FCM token, and register it with the HTTP endpoint above. Handle token refresh
and unregister before logout. Set up the Android notification channel and iOS APNs
capability/configuration in the mobile project. In the foreground, handle incoming
messages and merge them with the live event by the same notification ID to avoid two
visible notifications. In background, Firebase delivers the notification title/body.

Push data includes string fields `notificationId`, `type`, and `appId`. On tap, fetch that
notification from the authenticated inbox. Never trust a push payload as authorization.
Unregistered FCM tokens are removed automatically. Other delivery errors retry via the
existing outbox, then become visible in Background processing if retries are exhausted.
Notification and delivery job IDs for campaign recipients are stable, so worker retries
do not create duplicate inbox items. External push and live delivery are at-least-once;
clients must deduplicate by notification ID. Large audiences are processed in batches
of 250, and only accounts created by the queue time are eligible.

No Android/iOS app source is present in this repository. Backend and dashboard are
implemented here; mobile SDK wiring and a real-device test must be completed in that
app repository with Firebase configured.

References: [FCM HTTP v1](https://firebase.google.com/docs/cloud-messaging/send/v1-api),
[FCM error codes](https://firebase.google.com/docs/cloud-messaging/error-codes).

For independent dealer-branded app accounts, use the registered app API base and include its `appId` in the Socket.IO handshake. See [customer app accounts](customer-app-accounts.md).
