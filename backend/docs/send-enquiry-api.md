# Send Enquiry API

Sends a customer's enquiry about one vehicle to that vehicle's dealer. Each successful call creates an enquiry and opens a lead in the dealer's portal.

## Endpoint

```
POST https://changecarapi.wowcar.co.th/api/v1/enquiries/vehicle
```

| Header | | Value |
|---|---|---|
| `Content-Type` | required | `application/json` |
| `Authorization` | optional | `Bearer <accessToken>` from login. If the customer is signed in, send it so the enquiry is linked to their account and appears in `GET /api/v1/me/enquiries`. Guests can send without it. |

## Request body

| Field | | Type and rules |
|---|---|---|
| `vehicleId` | required | string. The vehicle's `id` from the search or detail API, e.g. `"1575860"`. |
| `name` | required | string, 2–160 characters. |
| `email` | required | valid email, up to 254 characters. |
| `phone` | required | 7–20 characters: digits, spaces, `( ) -`, optional leading `+`. Example: `+27 82 123 4567`. |
| `consent` | required | boolean, must be `true`. The customer agrees to be contacted about this request (POPIA). Show a checkbox and send its value. |
| `message` | optional | string, up to 4000 characters. |
| `interestedInFinance` | optional | boolean, default `false`. |
| `hasTradeIn` | optional | boolean, default `false`. |

Unknown fields are rejected with `400`. Send only the fields listed above.

```json
{
  "vehicleId": "1575860",
  "name": "Thabo Nkosi",
  "email": "thabo@example.com",
  "phone": "+27 82 123 4567",
  "consent": true,
  "message": "Is this car still available? Can I view it on Saturday?",
  "interestedInFinance": true,
  "hasTradeIn": false
}
```

## Example with curl

```bash
curl -X POST "https://changecarapi.wowcar.co.th/api/v1/enquiries/vehicle" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "1575860",
    "name": "Thabo Nkosi",
    "email": "thabo@example.com",
    "phone": "+27 82 123 4567",
    "consent": true,
    "message": "Is this car still available?"
  }'
```

> This call creates a real enquiry that the dealer receives. While testing, use a test vehicle agreed with the backend team rather than a live customer listing.

## Success response

`201 Created`

```json
{
  "id": "0f6c1e2a-7b3d-4c55-9a10-2d8e6f4b1c90",
  "reference": "ENQ-…",
  "type": "VEHICLE",
  "status": "NEW",
  "createdAt": "2026-10-28T09:40:12.511Z",
  "duplicate": false
}
```

- Show `reference` to the customer as their enquiry number.
- `duplicate: true` means the same person (same email) already sent this enquiry for this vehicle in the last 10 minutes. The API returns the existing enquiry and does not create a second one. Treat it as a success.

## Errors

Every error has the same shape. Show `message`, or the entries in `details` next to the matching form fields.

```json
{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "details": ["email must be an email", "Consent is required to submit this request"],
  "requestId": "7d4b9f63-23d6-43f0-8ed2-8b4005d76325",
  "timestamp": "2026-10-28T09:38:40.723Z",
  "path": "/api/v1/enquiries/vehicle"
}
```

| Status | `code` | When it happens and what to show |
|---|---|---|
| `400` | `VALIDATION_FAILED` | A field is missing or invalid, or `consent` is not `true`. `details` lists each problem. |
| `404` | `NOT_FOUND` | The vehicle doesn't exist or its dealer is not active. Tell the customer the listing is no longer available. |
| `409` | `VEHICLE_NOT_AVAILABLE` | The vehicle is sold or no longer listed. Hide the enquiry form for that vehicle. |
| `429` | `RATE_LIMITED` | More than 10 form submissions from one IP within a minute. Ask the customer to wait a minute and try again. |
| `5xx` | — | Server problem. Let the customer retry, and send `requestId` to the backend team. |

## Implementation checklist

- Pass `vehicleId` from the vehicle the customer is viewing.
- Pre-fill name, email and phone from the profile when the customer is signed in, and send the `Authorization` header.
- Require the consent checkbox before enabling the Send button.
- Disable the Send button while the request is in flight so it isn't sent twice.
- On `201`, show a confirmation with `reference`.

## Related

- `GET /api/v1/me/enquiries` lists a signed-in customer's enquiries.
- `GET /api/v1/me/enquiries/{id}` returns one.
- Other forms (test drive, finance, trade-in) use their own `POST /api/v1/enquiries/…` routes.
