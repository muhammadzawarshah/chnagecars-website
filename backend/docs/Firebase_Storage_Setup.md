# Firebase Storage setup

The API stores every uploaded file (My Documents, dealer documents, sell-request photos, vehicle images) in object storage and hands clients short-lived signed URLs. Production uses **Firebase Storage**. Set `STORAGE_DRIVER=firebase`. S3/MinIO (`STORAGE_DRIVER=s3`, the default) remains available for local development.

Upload and API code does not change between drivers. The mobile app and website do not need the Firebase SDK.

## 1. Create a service account key (one time)

The Firebase **web config** (`apiKey`, `authDomain`, `appId`, ...) is for client SDKs. The backend cannot sign upload URLs with it. It needs a service account:

1. Firebase console → ⚙ **Project settings** → **Service accounts** → **Generate new private key**. A JSON file downloads.
2. Keep that file secret. Never commit it or put it in the app.

The default Firebase Admin SDK service account already has access to the project's Storage bucket.

## 2. Set the API's environment (Railway → service → Variables)

| Variable | Value |
|---|---|
| `STORAGE_DRIVER` | `firebase` |
| `FIREBASE_STORAGE_BUCKET` | the bucket name from the web config `storageBucket`, e.g. `shareitnow-59aad.firebasestorage.app` |
| `FIREBASE_SERVICE_ACCOUNT` | the whole JSON key file, pasted as-is, or base64: `base64 -i key.json \| tr -d '\n'` |

You can leave the `S3_*` variables and `MEDIA_PUBLIC_BASE_URL` as they are, because the Firebase driver ignores them. If `FIREBASE_*` is missing or invalid, the API refuses to boot and names the problem in the log. On success the log shows `Object storage: Firebase bucket <name>`.

## 3. Storage rules

Firebase console → **Storage** → **Rules**: paste `deploy/firebase/storage.rules` and publish. It makes `media/**` (public car photos) readable through Firebase download URLs and blocks everything else. Documents under `private/**` are only reachable through the API's 5-minute signed links.

## 4. Website uploads (CORS)

Browsers on the website upload sell-form photos and documents directly to the bucket. Allow that once:

```bash
cd backend
FIREBASE_STORAGE_BUCKET=... FIREBASE_SERVICE_ACCOUNT="$(cat key.json)" CORS_ORIGINS=https://www.changecars.co.za npx tsx scripts/firebase-storage-cors.ts
```

The mobile app does not need CORS.

## 5. For the mobile app

`POST /me/documents/upload-url` (and the other upload-url endpoints) keep the same response:

```json
{ "documentId": "…", "uploadUrl": "https://storage.googleapis.com/<bucket>/private/customers/…?X-Goog-Algorithm=GOOG4-RSA-SHA256&…", "method": "PUT", "headers": { "Content-Type": "application/pdf" }, "expiresIn": 600 }
```

- PUT the raw file bytes to `uploadUrl` **exactly as returned**, with the returned `headers`. Do not rewrite the host or edit the query. The signature covers the host, so a changed URL is rejected (403 `SignatureDoesNotMatch`). Remove any "localhost → API host" rewrite.
- Success is HTTP **200**. Then call `POST /me/documents/{documentId}/complete`.
- The `Content-Type` sent must equal the one requested. Otherwise `complete` returns 400 `INVALID_UPLOAD`.
- An expired URL (after `expiresIn` seconds) returns 400 from storage. Request a new one.

## Verify after deploy

1. `POST /me/documents/upload-url`: `uploadUrl` starts with `https://storage.googleapis.com/`.
2. `curl -X PUT -H 'Content-Type: application/pdf' --data-binary @file.pdf '<uploadUrl>'` returns 200.
3. `POST /me/documents/{id}/complete` returns `"status": "UPLOADED"`, and the file appears in Firebase console → Storage under `private/customers/…`.
