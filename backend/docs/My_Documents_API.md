# My Documents API

Base URL: `http://localhost:4000/api/v1`. All endpoints require `Authorization: Bearer <accessToken>` from registration or login. No separate account creation is needed. A new user's list automatically contains all six categories without uploaded files.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/me/documents` | Screen categories, documents, upload status and `canSubmit`. |
| POST | `/me/documents/upload-url` | Create a pending document and obtain a private upload URL. |
| POST | `/me/documents/{documentId}/complete` | Validate uploaded file size/type and mark uploaded. |
| GET | `/me/documents/{documentId}/view` | Obtain a temporary private download URL (300 seconds). |
| DELETE | `/me/documents/{documentId}` | Delete the file and its record. |
| POST | `/me/documents/submit` | Submit all newly uploaded documents. |

## Categories

`DRIVING_LICENSE`, `VEHICLE_REGISTRATION`, `INSURANCE`, `WARRANTY`, `FINES`, `SERVICE_REPAIRS`.

Each category supports multiple documents, so fines and service records can be expanded as shown in the screen. To replace a file, upload and complete a new one, then delete the old document.

## Upload flow

1. Call `POST /me/documents/upload-url` with JSON:

```json
{
  "type": "DRIVING_LICENSE",
  "fileName": "driving-license.pdf",
  "contentType": "application/pdf",
  "size": 12345
}
```

Allowed types: PDF, JPEG and PNG. `size` is the actual file size in bytes, maximum 15 MiB (15728640). Response (201):

```json
{
  "documentId": "<UUID>",
  "uploadUrl": "<temporary signed storage URL>",
  "method": "PUT",
  "headers": { "Content-Type": "application/pdf" },
  "expiresIn": 600
}
```

2. PUT the raw file bytes to `uploadUrl` using the returned `Content-Type`. Do not send JSON, multipart or the API Bearer token to storage.
3. Call `POST /me/documents/{documentId}/complete`, no body. The API checks storage metadata before marking it `UPLOADED`. Refresh the screen after success.

Files stay under the private storage prefix, not publicly accessible vehicle media. Configure S3/MinIO credentials, bucket and app upload CORS before using uploads. The storage bucket must deny anonymous access to `private/*`. Upload URL generation alone does not upload a file.

## Screen response

`GET /me/documents` returns:

```json
{
  "canSubmit": false,
  "categories": [
    { "type": "DRIVING_LICENSE", "name": "Driving License", "uploaded": false, "documents": [] },
    { "type": "VEHICLE_REGISTRATION", "name": "Vehicle Registration", "uploaded": false, "documents": [] },
    { "type": "INSURANCE", "name": "Insurance", "uploaded": false, "documents": [] },
    { "type": "WARRANTY", "name": "Warranty", "uploaded": false, "documents": [] },
    { "type": "FINES", "name": "Fines", "uploaded": false, "documents": [] },
    { "type": "SERVICE_REPAIRS", "name": "Service & Repairs", "uploaded": false, "documents": [] }
  ]
}
```

Documents contain `id`, `type`, `fileName`, `contentType`, `size`, `status`, `createdAt`, `updatedAt`, and nullable `submittedAt`. Storage keys and user IDs are omitted. `PENDING` means upload not yet completed; use upload controls, not the uploaded checkmark. `UPLOADED` enables submit. `SUBMITTED` means submitted, not verified or approved. Use `updatedAt` for the Updated label and request `/view` on eye-button taps; download URLs are not saved in screen metadata.

Submit requires at least one newly completed document. It marks all this user's `UPLOADED` documents `SUBMITTED` and returns `{submitted: true, count, submittedAt}` (201). Mandatory category rules and an admin review workflow are not configured. Pending files do not count toward submit. Viewing another user's ID returns 404; missing/invalid auth returns 401. Delete returns `{documentId, deleted: true}` (200).

## Setup

Run `npx prisma generate`, `npx prisma migrate deploy`, then rebuild/restart the backend. The migration adds `customer_documents` without changing existing user data. Configure working object storage to test PUT, completion, viewing and deletion.
