# Track Price API

Backs the "Track this vehicle's price" sheet in the app. The person enters their name, email and optional WhatsApp number, and the API stores a price-drop alert for that vehicle.

At the moment the API only stores the sign-up. Price-drop messages are not sent yet; that will be added later without changing this request.

## Endpoint

```
POST https://changecarapi.wowcar.co.th/api/v1/price-alerts
```

| Header | | Value |
|---|---|---|
| `Content-Type` | required | `application/json` |
| `Authorization` | optional | `Bearer <accessToken>` from login. If the person is signed in, send it so the alert is linked to their account. Guests can send without it. |

## Request body

| Field | | Rules |
|---|---|---|
| `vehicleId` | required | The vehicle's `id` from the search or detail API, as a string, e.g. `"1575860"`. |
| `name` | required | 2–160 characters. |
| `email` | required | Valid email, up to 254 characters. |
| `whatsappNumber` | optional | 7–20 characters: digits, spaces, `( ) -`, optional leading `+`. An empty string is treated as not given. |

Unknown fields are rejected with `400`. Send only the fields above. Do not send the price; the API records it.

```json
{
  "vehicleId": "1575860",
  "name": "Thabo Nkosi",
  "email": "thabo@example.com",
  "whatsappNumber": "+27 82 123 4567"
}
```

```bash
curl -X POST "https://changecarapi.wowcar.co.th/api/v1/price-alerts" \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"1575860","name":"Thabo Nkosi","email":"thabo@example.com","whatsappNumber":"+27 82 123 4567"}'
```

## Success response

`201 Created`

```json
{
  "id": "01a18251-39bd-748d-87af-a107dab3981f",
  "vehicleId": "1575860",
  "priceAtSignup": 189900,
  "createdAt": "2026-10-28T11:42:03.710Z",
  "duplicate": false
}
```

| Field | Meaning |
|---|---|
| `priceAtSignup` | The price shown when the person signed up, in whole Rand. If the vehicle is on special, this is the special price. Price drops will be measured from this value. |
| `duplicate` | `true` when this email already tracks this vehicle. No second alert is created: the name and WhatsApp number are updated and the original `priceAtSignup` is kept. Treat it as a success. |

After `201`, close the sheet and show a confirmation such as "We'll let you know if the price drops."

## Errors

Errors use the standard shape:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "details": ["email must be an email"],
  "requestId": "…",
  "timestamp": "…",
  "path": "/api/v1/price-alerts"
}
```

| Status | `code` | When | What to show |
|---|---|---|---|
| `400` | `VALIDATION_FAILED` | A field is missing or invalid. `details` lists each problem. | Show the message next to the matching field. |
| `404` | `NOT_FOUND` | The vehicle doesn't exist or its dealer is not active. | "This vehicle is no longer available." |
| `409` | `VEHICLE_NOT_AVAILABLE` | The vehicle is sold or no longer listed. | "This vehicle is no longer available." Hide the Track price button. |
| `429` | `RATE_LIMITED` | More than 10 sign-ups from one IP within a minute. | Ask the person to try again in a minute. |
| `5xx` | — | Server problem. | Let the person retry. |

## Form mapping

| Field on the sheet | Request field |
|---|---|
| Vehicle shown at the top | `vehicleId` (do not send title or price) |
| Name * | `name` |
| Email * | `email` |
| WhatsApp Contact Number | `whatsappNumber` (leave out or send `""` when empty) |
| Notify me | Sends the request. Disable it while the request is in flight. |

Pre-fill name and email from the profile when the person is signed in.
